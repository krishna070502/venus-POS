# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Product(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		base_price: DF.Currency
		item_code: DF.Data
		item_name: DF.Data
		purchase_price: DF.Currency
	# end: auto-generated types

	def validate(self):
		"""Validate product details"""
		# Only System Manager can update prices
		if not self.is_new():
			old_doc = self.get_doc_before_save()
			if old_doc:
				if self.base_price != old_doc.base_price or self.purchase_price != old_doc.purchase_price:
					if not frappe.has_permission(self.doctype, "write", user=frappe.session.user):
						if "System Manager" not in frappe.get_roles():
							frappe.throw("Only System Manager can update product prices")

	def before_save(self):
		"""Validate prices are non-negative"""
		if self.base_price and self.base_price < 0:
			frappe.throw("Base price cannot be negative")
		if self.purchase_price and self.purchase_price < 0:
			frappe.throw("Purchase price cannot be negative")
