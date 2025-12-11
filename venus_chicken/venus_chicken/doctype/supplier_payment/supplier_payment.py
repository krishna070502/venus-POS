# Copyright (c) 2025, Venus Chicken and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, now_datetime


class SupplierPayment(Document):
	def before_insert(self):
		if not self.posting_time:
			self.posting_time = now_datetime().strftime("%H:%M:%S")

	def validate(self):
		self.validate_payment_amount()
		self.calculate_outstanding()

	def validate_payment_amount(self):
		if flt(self.payment_amount) <= 0:
			frappe.throw("Payment Amount must be greater than zero")

	def calculate_outstanding(self):
		"""Calculate outstanding amount if linked to a purchase entry"""
		if self.purchase_entry:
			# Get total paid amount for this purchase entry (excluding current doc if amending)
			filters = {"purchase_entry": self.purchase_entry, "docstatus": 1}
			if self.name and not self.is_new():
				filters["name"] = ["!=", self.name]

			paid_amount = frappe.db.get_value("Supplier Payment", filters, "sum(payment_amount)") or 0

			self.paid_amount = flt(paid_amount)
			self.outstanding_amount = flt(self.purchase_amount) - flt(paid_amount) - flt(self.payment_amount)

	def on_submit(self):
		self.update_purchase_entry_status()

	def on_cancel(self):
		self.update_purchase_entry_status()

	def update_purchase_entry_status(self):
		"""Update payment status on linked purchase entry if any"""
		if self.purchase_entry:
			# Recalculate total paid for the purchase entry
			total_paid = (
				frappe.db.get_value(
					"Supplier Payment",
					{"purchase_entry": self.purchase_entry, "docstatus": 1},
					"sum(payment_amount)",
				)
				or 0
			)

			# Could update a payment_status field on Purchase Entry if needed
			# frappe.db.set_value("Purchase Entry", self.purchase_entry, "paid_amount", total_paid)


@frappe.whitelist()
def get_supplier_outstanding(supplier):
	"""Get total outstanding amount for a supplier"""
	# Get total purchase amount
	total_purchases = (
		frappe.db.get_value("Purchase Entry", {"supplier": supplier, "docstatus": 1}, "sum(total_amount)")
		or 0
	)

	# Get total payments
	total_payments = (
		frappe.db.get_value("Supplier Payment", {"supplier": supplier, "docstatus": 1}, "sum(payment_amount)")
		or 0
	)

	return {
		"total_purchases": flt(total_purchases),
		"total_payments": flt(total_payments),
		"outstanding": flt(total_purchases) - flt(total_payments),
	}


@frappe.whitelist()
def get_unpaid_purchases(supplier):
	"""Get list of purchase entries with outstanding amounts for a supplier"""
	purchases = frappe.db.sql(
		"""
		SELECT 
			pe.name,
			pe.posting_date,
			pe.total_amount,
			COALESCE(SUM(sp.payment_amount), 0) as paid_amount,
			pe.total_amount - COALESCE(SUM(sp.payment_amount), 0) as outstanding
		FROM `tabPurchase Entry` pe
		LEFT JOIN `tabSupplier Payment` sp ON sp.purchase_entry = pe.name AND sp.docstatus = 1
		WHERE pe.supplier = %s AND pe.docstatus = 1
		GROUP BY pe.name
		HAVING outstanding > 0
		ORDER BY pe.posting_date DESC
	""",
		supplier,
		as_dict=True,
	)

	return purchases
