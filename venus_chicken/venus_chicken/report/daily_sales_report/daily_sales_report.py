# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	return [
		{"fieldname": "posting_date", "label": "Date", "fieldtype": "Date", "width": 100},
		{
			"fieldname": "name",
			"label": "Invoice",
			"fieldtype": "Link",
			"options": "POS Invoice",
			"width": 150,
		},
		{"fieldname": "shop", "label": "Shop", "fieldtype": "Link", "options": "Shop", "width": 150},
		{"fieldname": "customer_name", "label": "Customer", "fieldtype": "Data", "width": 150},
		{"fieldname": "total_kg", "label": "Total Kg", "fieldtype": "Float", "width": 100, "precision": 3},
		{"fieldname": "total_amount", "label": "Total Amount", "fieldtype": "Currency", "width": 120},
		{"fieldname": "posting_time", "label": "Time", "fieldtype": "Time", "width": 100},
	]


def get_data(filters):
	conditions = ["docstatus = 1"]

	if filters.get("shop"):
		conditions.append(f"shop = '{filters.get('shop')}'")

	if filters.get("from_date"):
		conditions.append(f"posting_date >= '{filters.get('from_date')}'")

	if filters.get("to_date"):
		conditions.append(f"posting_date <= '{filters.get('to_date')}'")

	where_clause = " AND ".join(conditions)

	query = f"""
		SELECT
			posting_date,
			name,
			shop,
			customer_name,
			total_kg,
			total_amount,
			posting_time
		FROM `tabPOS Invoice`
		WHERE {where_clause}
		ORDER BY posting_date DESC, posting_time DESC
	"""

	return frappe.db.sql(query, as_dict=1)
