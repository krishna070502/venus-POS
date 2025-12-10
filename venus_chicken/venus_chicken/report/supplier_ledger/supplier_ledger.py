# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import add_days, flt, today


def execute(filters=None):
	"""Execute supplier ledger report"""
	if not filters:
		filters = {}

	# Validate required filters
	if not filters.get("supplier"):
		frappe.msgprint(_("Please select a Supplier"))
		return [], []

	columns = get_columns()
	data = get_data(filters)

	# Calculate opening and closing balances
	total_debit = sum(
		flt(row.get("debit") or 0) for row in data if isinstance(row.get("debit"), (int, float))
	)
	total_credit = sum(
		flt(row.get("credit") or 0) for row in data if isinstance(row.get("credit"), (int, float))
	)
	closing_balance = total_debit - total_credit

	# Add summary cards with opening and closing balances
	chart = {
		"data": {
			"labels": ["Opening Balance", "Total Debit", "Total Credit", "Closing Balance"],
			"datasets": [{"name": "Amount", "values": [0, total_debit, total_credit, closing_balance]}],
		},
		"type": "bar",
		"colors": ["#10b981", "#3b82f6", "#ef4444", "#f59e0b"],
	}

	summary = [
		{"value": 0, "indicator": "green", "label": "Opening Balance", "datatype": "Currency"},
		{
			"value": total_debit,
			"indicator": "blue",
			"label": "Total Debit (Purchases)",
			"datatype": "Currency",
		},
		{
			"value": total_credit,
			"indicator": "red",
			"label": "Total Credit (Payments)",
			"datatype": "Currency",
		},
		{
			"value": closing_balance,
			"indicator": "orange",
			"label": "Closing Balance (Outstanding)",
			"datatype": "Currency",
		},
	]

	# Add message showing supplier name and period
	message = f"Ledger for <b>{filters.get('supplier')}</b>"
	if filters.get("from_date") and filters.get("to_date"):
		message += f" | Period: {filters.get('from_date')} to {filters.get('to_date')}"

	return columns, data, message, chart, summary


def get_columns():
	"""Define report columns"""
	return [
		{
			"fieldname": "posting_date",
			"label": _("Date"),
			"fieldtype": "Date",
			"width": 120,
		},
		{
			"fieldname": "voucher_type",
			"label": _("Voucher Type"),
			"fieldtype": "Data",
			"width": 140,
		},
		{
			"fieldname": "voucher_no",
			"label": _("Voucher No"),
			"fieldtype": "Dynamic Link",
			"options": "voucher_type",
			"width": 180,
		},
		{
			"fieldname": "shop",
			"label": _("Shop"),
			"fieldtype": "Link",
			"options": "Shop",
			"width": 140,
		},
		{
			"fieldname": "remarks",
			"label": _("Remarks"),
			"fieldtype": "Data",
			"width": 250,
		},
		{
			"fieldname": "debit",
			"label": _("Debit (Purchases)"),
			"fieldtype": "Currency",
			"width": 150,
			"precision": 2,
		},
		{
			"fieldname": "credit",
			"label": _("Credit (Payments)"),
			"fieldtype": "Currency",
			"width": 150,
			"precision": 2,
		},
		{
			"fieldname": "balance",
			"label": _("Balance (Outstanding)"),
			"fieldtype": "Currency",
			"width": 180,
			"precision": 2,
		},
	]


def get_data(filters=None):
	"""Get supplier ledger data with debit/credit tracking"""
	if not filters:
		filters = {}

	conditions = get_conditions(filters)

	# Get all purchase entries (debits)
	query = f"""
		SELECT
			pe.posting_date,
			'Purchase Entry' as voucher_type,
			pe.name as voucher_no,
			pe.supplier,
			pe.shop,
			pe.total_amount as debit,
			0 as credit,
			pe.docstatus
		FROM
			`tabPurchase Entry` pe
		WHERE
			pe.docstatus = 1
			{" AND " + conditions if conditions and conditions != "1=1" else ""}
		ORDER BY
			pe.supplier, pe.posting_date, pe.name
	"""

	entries = frappe.db.sql(query, filters, as_dict=1)

	# Group by supplier and calculate running balance
	supplier_data = {}
	for entry in entries:
		supplier = entry.supplier
		if supplier not in supplier_data:
			supplier_data[supplier] = []
		supplier_data[supplier].append(entry)

	# Build final data with running balance
	data = []
	for supplier in sorted(supplier_data.keys()):
		supplier_entries = supplier_data[supplier]
		running_balance = 0

		# Add transactions
		for entry in supplier_entries:
			running_balance += flt(entry.debit) - flt(entry.credit)

			# Build remarks
			if entry.voucher_type == "Purchase Entry":
				pe_items = frappe.db.sql(
					"""
					SELECT product, quantity_nos, weight_kg
					FROM `tabPurchase Entry Item`
					WHERE parent = %s
				""",
					entry.voucher_no,
					as_dict=1,
				)
				remarks = ", ".join(
					[
						f"{item.product} ({item.quantity_nos} nos, {item.weight_kg:.2f} kg)"
						for item in pe_items
					]
				)
			else:
				remarks = "Payment"

			data.append(
				{
					"posting_date": entry.posting_date,
					"voucher_type": entry.voucher_type,
					"voucher_no": entry.voucher_no,
					"shop": entry.shop,
					"remarks": remarks[:200],
					"debit": flt(entry.debit) if entry.debit else "",
					"credit": flt(entry.credit) if entry.credit else "",
					"balance": running_balance,
				}
			)

	return data


def get_conditions(filters):
	"""Build SQL WHERE conditions from filters"""
	conditions = ["pe.docstatus IN (0, 1)"]

	if filters.get("from_date"):
		conditions.append("pe.posting_date >= %(from_date)s")

	if filters.get("to_date"):
		conditions.append("pe.posting_date <= %(to_date)s")

	if filters.get("supplier"):
		conditions.append("pe.supplier = %(supplier)s")

	if filters.get("shop"):
		conditions.append("pe.shop = %(shop)s")

	return " AND ".join(conditions) if conditions else "1=1"
