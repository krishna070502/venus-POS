# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	return [
		{"fieldname": "shop", "label": "Shop", "fieldtype": "Link", "options": "Shop", "width": 150},
		{"fieldname": "product", "label": "Product", "fieldtype": "Link", "options": "Product", "width": 150},
		{"fieldname": "item_name", "label": "Product Name", "fieldtype": "Data", "width": 150},
		{"fieldname": "qty_no", "label": "Qty (Hens)", "fieldtype": "Float", "width": 100, "precision": 2},
		{
			"fieldname": "raw_weight_kg",
			"label": "Raw Weight (Kg)",
			"fieldtype": "Float",
			"width": 120,
			"precision": 3,
		},
		{
			"fieldname": "processed_weight_kg",
			"label": "Processed Weight (Kg)",
			"fieldtype": "Float",
			"width": 150,
			"precision": 3,
		},
		{"fieldname": "base_price", "label": "Base Price (per Kg)", "fieldtype": "Currency", "width": 120},
		{"fieldname": "stock_value", "label": "Stock Value", "fieldtype": "Currency", "width": 120},
	]


def get_data(filters):
	conditions = []

	if filters.get("shop"):
		conditions.append(f"s.name = '{filters.get('shop')}'")

	if filters.get("product"):
		conditions.append(f"si.product = '{filters.get('product')}'")

	where_clause = " AND ".join(conditions) if conditions else "1=1"

	query = f"""
		SELECT
			s.name as shop,
			si.product,
			p.item_name,
			si.qty_no,
			si.raw_weight_kg,
			si.processed_weight_kg,
			p.base_price,
			(si.processed_weight_kg * IFNULL(p.base_price, 0)) as stock_value
		FROM `tabShop` s
		LEFT JOIN `tabShop Stock Item` si ON si.parent = s.name
		LEFT JOIN `tabProduct` p ON p.name = si.product
		WHERE {where_clause} AND si.product IS NOT NULL
		ORDER BY s.name, si.product
	"""

	return frappe.db.sql(query, as_dict=1)
