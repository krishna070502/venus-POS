# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now, today


def has_permission(doc, ptype, user):
	"""Check if user has permission to access this purchase entry"""
	from venus_chicken.permissions import has_shop_permission

	return has_shop_permission(doc, ptype, user)


def get_permission_query_conditions(user):
	"""Filter purchase entries based on shop access"""
	from venus_chicken.permissions import get_shop_based_permission_query_conditions

	return get_shop_based_permission_query_conditions("Purchase Entry")(user)


class PurchaseEntry(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from venus_chicken.venus_chicken.doctype.purchase_entry_item.purchase_entry_item import (
			PurchaseEntryItem,
		)

		amended_from: DF.Link | None
		items: DF.Table[PurchaseEntryItem]
		posting_date: DF.Date
		posting_time: DF.Time
		shop: DF.Link
		supplier: DF.Data
		total_amount: DF.Currency
	# end: auto-generated types

	def before_insert(self):
		"""Set default values"""
		if not self.posting_date:
			self.posting_date = today()
		if not self.posting_time:
			self.posting_time = now()

	def validate(self):
		"""Validate purchase entry"""
		self.calculate_totals()
		self.validate_quantities()

	def validate_quantities(self):
		"""Ensure all quantities are positive"""
		for item in self.items:
			if flt(item.quantity_nos) <= 0:
				frappe.throw(_("Quantity (Nos) must be greater than 0 for product {0}").format(item.product))
			if flt(item.weight_kg) <= 0:
				frappe.throw(_("Weight (Kg) must be greater than 0 for product {0}").format(item.product))
			if flt(item.rate_per_kg) < 0:
				frappe.throw(_("Rate cannot be negative for product {0}").format(item.product))

	def calculate_totals(self):
		"""Calculate item amounts and total"""
		total = 0
		for item in self.items:
			item.amount = flt(item.weight_kg) * flt(item.rate_per_kg)
			total += item.amount
		self.total_amount = total

	def on_submit(self):
		"""Update shop raw stock when purchase is submitted"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			# Find or create stock item
			stock_item = None
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					stock_item = stock
					break

			if stock_item:
				# Add to existing stock
				stock_item.qty_no = flt(stock_item.qty_no) + flt(item.quantity_nos)
				stock_item.raw_weight_kg = flt(stock_item.raw_weight_kg) + flt(item.weight_kg)
			else:
				# Create new stock item
				shop_doc.append(
					"stock_items",
					{
						"product": item.product,
						"qty_no": flt(item.quantity_nos),
						"raw_weight_kg": flt(item.weight_kg),
						"processed_weight_kg": 0,
					},
				)

		shop_doc.save()
		frappe.msgprint(_("Raw stock updated for {0}").format(self.shop))

	def on_cancel(self):
		"""Reverse raw stock update when purchase is cancelled"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					stock.qty_no = flt(stock.qty_no) - flt(item.quantity_nos)
					stock.raw_weight_kg = flt(stock.raw_weight_kg) - flt(item.weight_kg)
					break

		shop_doc.save()
		frappe.msgprint(_("Raw stock reversed for {0}").format(self.shop))
