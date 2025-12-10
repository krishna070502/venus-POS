# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, nowtime, today


def has_permission(doc, ptype, user):
	"""Check if user has permission to access this POS invoice"""
	from venus_chicken.permissions import has_shop_permission

	return has_shop_permission(doc, ptype, user)


def get_permission_query_conditions(user):
	"""Filter POS invoices based on shop access"""
	from venus_chicken.permissions import get_shop_based_permission_query_conditions

	return get_shop_based_permission_query_conditions("POS Invoice")(user)


class POSInvoice(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from venus_chicken.venus_chicken.doctype.pos_invoice_item.pos_invoice_item import POSInvoiceItem

		customer_name: DF.Data | None
		items: DF.Table[POSInvoiceItem]
		naming_series: DF.Literal["POS-INV-.YYYY.-"]
		posting_date: DF.Date
		posting_time: DF.Time
		shop: DF.Link
		total_amount: DF.Currency
		total_kg: DF.Float
	# end: auto-generated types

	def before_insert(self):
		"""Set default values before insert"""
		if not self.posting_date:
			self.posting_date = today()
		if not self.posting_time:
			self.posting_time = nowtime()

	def validate(self):
		"""Validate POS invoice before save"""
		self.validate_shop_access()
		self.calculate_totals()
		self.validate_stock_availability()

	def validate_shop_access(self):
		"""Ensure user has access to the shop"""
		if frappe.session.user == "Administrator" or "System Manager" in frappe.get_roles():
			return

		# Check user permissions for shop
		allowed_shops = frappe.get_list(
			"User Permission",
			filters={"user": frappe.session.user, "allow": "Shop", "for_value": self.shop},
			pluck="for_value",
		)

		if self.shop not in allowed_shops and allowed_shops:
			frappe.throw(f"You don't have permission to access {self.shop}")

	def calculate_totals(self):
		"""Calculate total kg and total amount from items"""
		self.total_kg = 0
		self.total_amount = 0

		for item in self.items:
			# Calculate item amount
			item.amount = flt(item.qty_kg) * flt(item.rate)

			# Add to totals
			self.total_kg += flt(item.qty_kg)
			self.total_amount += flt(item.amount)

	def validate_stock_availability(self):
		"""Check if sufficient stock is available"""
		if self.docstatus == 0:  # Only validate on draft
			shop_doc = frappe.get_doc("Shop", self.shop)

			for item in self.items:
				stock = shop_doc.get_stock_balance(item.product)
				if flt(item.qty_kg) > flt(stock.get("processed_weight_kg", 0)):
					frappe.throw(
						f"Insufficient stock for {item.product}. "
						f"Available: {stock.get('processed_weight_kg', 0):.2f} kg, "
						f"Required: {item.qty_kg:.2f} kg"
					)

	def on_submit(self):
		"""Update stock after invoice submission"""
		self.update_stock()

	def on_cancel(self):
		"""Restore stock after invoice cancellation"""
		self.restore_stock()

	def update_stock(self):
		"""Deduct stock from processed stock after sale"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			# Sold quantity in kg
			sold_kg = flt(item.qty_kg)

			# Find stock item and deduct from processed stock
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					stock.processed_weight_kg = flt(stock.processed_weight_kg) - sold_kg
					break

		shop_doc.save()
		frappe.msgprint(f"Stock updated for {self.shop}")

	def restore_stock(self):
		"""Restore processed stock when invoice is cancelled"""
		shop_doc = frappe.get_doc("Shop", self.shop)

		for item in self.items:
			sold_kg = flt(item.qty_kg)

			# Find stock item and add back to processed stock
			for stock in shop_doc.stock_items:
				if stock.product == item.product:
					stock.processed_weight_kg = flt(stock.processed_weight_kg) + sold_kg
					break

		shop_doc.save()
		frappe.msgprint(f"Stock restored for {self.shop}")


@frappe.whitelist()
def get_product_rate(product):
	"""Get base price for a product"""
	return frappe.db.get_value("Product", product, "base_price") or 0
