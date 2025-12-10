# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	"""Define report columns"""
	return [
		{"fieldname": "posting_date", "label": _("Date"), "fieldtype": "Date", "width": 100},
		{
			"fieldname": "name",
			"label": _("Purchase Entry"),
			"fieldtype": "Link",
			"options": "Purchase Entry",
			"width": 150,
		},
		{"fieldname": "shop", "label": _("Shop"), "fieldtype": "Link", "options": "Shop", "width": 120},
		{"fieldname": "supplier", "label": _("Supplier"), "fieldtype": "Data", "width": 150},
		{
			"fieldname": "product",
			"label": _("Product"),
			"fieldtype": "Link",
			"options": "Product",
			"width": 120,
		},
		{"fieldname": "quantity_nos", "label": _("Qty (Nos)"), "fieldtype": "Int", "width": 80},
		{
			"fieldname": "weight_kg",
			"label": _("Weight (Kg)"),
			"fieldtype": "Float",
			"width": 100,
			"precision": 3,
		},
		{"fieldname": "rate_per_kg", "label": _("Rate/Kg"), "fieldtype": "Currency", "width": 100},
		{"fieldname": "amount", "label": _("Amount"), "fieldtype": "Currency", "width": 120},
		{"fieldname": "docstatus", "label": _("Status"), "fieldtype": "Data", "width": 100},
	]


def get_data(filters):
	"""Get purchase data based on filters"""
	conditions = ["pe.docstatus < 2"]  # Exclude cancelled

	if filters.get("from_date"):
		conditions.append(f"pe.posting_date >= '{filters.get('from_date')}'")
	if filters.get("to_date"):
		conditions.append(f"pe.posting_date <= '{filters.get('to_date')}'")
	if filters.get("shop"):
		conditions.append(f"pe.shop = '{filters.get('shop')}'")
	if filters.get("product"):
		conditions.append(f"pei.product = '{filters.get('product')}'")
	if filters.get("supplier"):
		conditions.append(f"pe.supplier LIKE '%{filters.get('supplier')}%'")

	where_clause = " AND ".join(conditions)

	query = f"""
		SELECT
			pe.posting_date,
			pe.name,
			pe.shop,
			pe.supplier,
			pei.product,
			pei.quantity_nos,
			pei.weight_kg,
			pei.rate_per_kg,
			pei.amount,
			CASE
				WHEN pe.docstatus = 0 THEN 'Draft'
				WHEN pe.docstatus = 1 THEN 'Submitted'
				WHEN pe.docstatus = 2 THEN 'Cancelled'
			END as docstatus
		FROM
			`tabPurchase Entry` pe
		INNER JOIN
			`tabPurchase Entry Item` pei ON pei.parent = pe.name
		WHERE
			{where_clause}
		ORDER BY
			pe.posting_date DESC, pe.name DESC
	"""

	return frappe.db.sql(query, as_dict=1)
