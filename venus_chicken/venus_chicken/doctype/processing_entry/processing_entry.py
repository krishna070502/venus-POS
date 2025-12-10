# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now, today


def has_permission(doc, ptype, user):
	"""Check if user has permission to access this processing entry"""
	from venus_chicken.permissions import has_shop_permission

	return has_shop_permission(doc, ptype, user)


def get_permission_query_conditions(user):
	"""Filter processing entries based on shop access"""
	from venus_chicken.permissions import get_shop_based_permission_query_conditions

	return get_shop_based_permission_query_conditions("Processing Entry")(user), now, today


class ProcessingEntry(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from venus_chicken.venus_chicken.doctype.processing_entry_item.processing_entry_item import (
			ProcessingEntryItem,
		)

		amended_from: DF.Link | None
		items: DF.Table[ProcessingEntryItem]
		posting_date: DF.Date
		posting_time: DF.Time
		shop: DF.Link
	# end: auto-generated types

	def before_insert(self):
		"""Set default values"""
		if not self.posting_date:
			self.posting_date = today()
		if not self.posting_time:
			self.posting_time = now()

	def validate(self):
		"""Validate processing entry"""
		self.calculate_wastage()
		self.validate_stock_availability()

	def calculate_wastage(self):
		"""Calculate wastage for each item and check against shop's limit"""
		shop_doc = frappe.get_doc("Shop", self.shop)
		shop_wastage_limit = flt(shop_doc.default_wastage_pct)

		for item in self.items:
			# Calculate wastage
			item.wastage_kg = flt(item.raw_weight_in_kg) - flt(item.processed_weight_out_kg)

			# Calculate wastage percentage
			if flt(item.raw_weight_in_kg) > 0:
				item.wastage_pct = (item.wastage_kg / item.raw_weight_in_kg) * 100
			else:
				item.wastage_pct = 0

			# Check wastage status
			if item.wastage_pct <= shop_wastage_limit:
				item.wastage_status = "Good ✅"
			else:
				item.wastage_status = f"Over Wastage! ⚠️ (Limit: {shop_wastage_limit}%)"

	def validate_stock_availability(self):
		"""Check if raw stock is available"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			stock_item = None
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					stock_item = stock
					break

			if not stock_item:
				frappe.throw(_("Product {0} not found in {1} raw stock").format(item.product, self.shop))

			# Check quantity
			if flt(stock_item.qty_no) < flt(item.qty_in_nos):
				frappe.throw(
					_("Insufficient quantity for {0}. Available: {1} nos, Required: {2} nos").format(
						item.product, stock_item.qty_no, item.qty_in_nos
					)
				)

			# Check raw weight
			if flt(stock_item.raw_weight_kg) < flt(item.raw_weight_in_kg):
				frappe.throw(
					_("Insufficient raw weight for {0}. Available: {1} kg, Required: {2} kg").format(
						item.product, stock_item.raw_weight_kg, item.raw_weight_in_kg
					)
				)

	def on_submit(self):
		"""Update shop stock - deduct from raw, add to processed"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			# Find the stock item
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					# Deduct from raw stock
					stock.qty_no = flt(stock.qty_no) - flt(item.qty_in_nos)
					stock.raw_weight_kg = flt(stock.raw_weight_kg) - flt(item.raw_weight_in_kg)

					# Add to processed stock
					stock.processed_weight_kg = flt(stock.processed_weight_kg) + flt(
						item.processed_weight_out_kg
					)
					break

		shop_doc.save()
		frappe.msgprint(
			_("Processing completed. Raw stock deducted, processed stock updated for {0}").format(self.shop)
		)

	def on_cancel(self):
		"""Reverse the processing - add back to raw, deduct from processed"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					# Add back to raw stock
					stock.qty_no = flt(stock.qty_no) + flt(item.qty_in_nos)
					stock.raw_weight_kg = flt(stock.raw_weight_kg) + flt(item.raw_weight_in_kg)

					# Deduct from processed stock
					stock.processed_weight_kg = flt(stock.processed_weight_kg) - flt(
						item.processed_weight_out_kg
					)
					break

		shop_doc.save()
		frappe.msgprint(_("Processing cancelled. Stock reversed for {0}").format(self.shop))
