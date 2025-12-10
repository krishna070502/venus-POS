# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, today


def has_permission(doc, ptype, user):
	"""Check if user has permission to access this day settlement"""
	from venus_chicken.permissions import has_shop_permission

	return has_shop_permission(doc, ptype, user)


def get_permission_query_conditions(user):
	"""Filter day settlements based on shop access"""
	from venus_chicken.permissions import get_shop_based_permission_query_conditions

	return get_shop_based_permission_query_conditions("Day Settlement")(user)


class DaySettlement(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		cash_collected: DF.Currency
		date: DF.Date
		notes: DF.Text | None
		shop: DF.Link
		status: DF.Literal["Open", "Closed"]
		total_sales: DF.Currency
		variance: DF.Currency
	# end: auto-generated types

	def before_insert(self):
		"""Set default values before insert"""
		if not self.date:
			self.date = today()

	def validate(self):
		"""Calculate total sales and variance"""
		self.calculate_total_sales()
		self.calculate_variance()

	def calculate_total_sales(self):
		"""Calculate total sales from submitted POS invoices for the day"""
		# Get total sales
		total = frappe.db.sql(
			"""
			SELECT SUM(total_amount)
			FROM `tabPOS Invoice`
			WHERE shop = %s
			AND posting_date = %s
			AND docstatus = 1
		""",
			(self.shop, self.date),
		)
		self.total_sales = flt(total[0][0]) if total and total[0][0] else 0

		# Get UPI sales (net amount after change)
		upi_total = frappe.db.sql(
			"""
			SELECT SUM(total_amount)
			FROM `tabPOS Invoice`
			WHERE shop = %s
			AND posting_date = %s
			AND docstatus = 1
			AND payment_mode = 'UPI'
		""",
			(self.shop, self.date),
		)
		self.upi_sales = flt(upi_total[0][0]) if upi_total and upi_total[0][0] else 0

		# Get Cash sales (net amount after change: cash_received - change_amount)
		cash_total = frappe.db.sql(
			"""
			SELECT SUM(cash_received - change_amount)
			FROM `tabPOS Invoice`
			WHERE shop = %s
			AND posting_date = %s
			AND docstatus = 1
			AND payment_mode = 'Cash'
		""",
			(self.shop, self.date),
		)
		self.cash_sales = flt(cash_total[0][0]) if cash_total and cash_total[0][0] else 0

	def calculate_variance(self):
		"""Calculate variance between expected and actual collections"""
		self.upi_variance = flt(self.upi_sales) - flt(self.actual_upi_collected)
		self.cash_variance = flt(self.cash_sales) - flt(self.actual_cash_collected)

	def before_save(self):
		"""Validate shop access"""
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


@frappe.whitelist()
def get_day_sales_summary(shop, date):
	"""Get summary of sales for a specific shop and date"""
	invoices = frappe.get_all(
		"POS Invoice",
		filters={"shop": shop, "posting_date": date, "docstatus": 1},
		fields=["name", "customer_name", "total_kg", "total_amount", "posting_time"],
	)

	total_amount = sum([inv.total_amount for inv in invoices])
	total_kg = sum([inv.total_kg for inv in invoices])

	return {
		"invoices": invoices,
		"total_amount": total_amount,
		"total_kg": total_kg,
		"invoice_count": len(invoices),
	}
