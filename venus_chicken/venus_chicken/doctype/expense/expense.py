# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, today


def has_permission(doc, ptype, user):
	"""Check if user has permission to access this expense"""
	from venus_chicken.permissions import has_shop_permission

	return has_shop_permission(doc, ptype, user)


def get_permission_query_conditions(user):
	"""Filter expenses based on shop access"""
	from venus_chicken.permissions import get_shop_based_permission_query_conditions

	return get_shop_based_permission_query_conditions("Expense")(user)


class Expense(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		amended_from: DF.Link | None
		date: DF.Date
		description: DF.SmallText | None
		expense_type: DF.Literal[
			"Petty Cash",
			"Transport",
			"Packaging",
			"Cleaning",
			"Repairs & Maintenance",
			"Utilities",
			"Miscellaneous",
		]
		shop: DF.Link
	# end: auto-generated types

	def before_insert(self):
		"""Set default values before insert"""
		if not self.date:
			self.date = today()

	def validate(self):
		"""Validate expense entry"""
		self.validate_amount()

	def validate_amount(self):
		"""Ensure amount is positive"""
		if flt(self.amount) <= 0:
			frappe.throw(_("Amount must be greater than zero"))


@frappe.whitelist()
def get_expenses_for_settlement(shop, date):
	"""Get all submitted expenses for a shop on a given date"""
	expenses = frappe.db.sql(
		"""
		SELECT name, expense_type, amount, description
		FROM `tabExpense`
		WHERE shop = %s
		AND date = %s
		AND docstatus = 1
	""",
		(shop, date),
		as_dict=1,
	)

	total_expenses = sum(flt(e.amount) for e in expenses)

	return {"expenses": expenses, "total_expenses": total_expenses}
