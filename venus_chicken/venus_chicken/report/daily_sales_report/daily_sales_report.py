# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	chart = get_chart_data(data)
	summary = get_summary(data, filters)
	return columns, data, None, chart, summary


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

	# Check user roles for shop-based filtering
	user_roles = frappe.get_roles(frappe.session.user)

	# If user is Shop Manager but not System Manager, filter by their assigned shops
	if "Shop Manager" in user_roles and "System Manager" not in user_roles:
		# Get shops assigned to this user
		user_shops = frappe.get_all("Shop", filters={"shop_manager": frappe.session.user}, pluck="name")
		if user_shops:
			shops_str = ", ".join([f"'{shop}'" for shop in user_shops])
			conditions.append(f"shop IN ({shops_str})")
		else:
			# User has no assigned shops, return empty
			return []

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


def get_summary(data, filters):
	"""Generate summary cards"""
	if not data:
		return []

	total_invoices = len(data)
	total_amount = sum(flt(row.get("total_amount", 0)) for row in data)
	total_kg = sum(flt(row.get("total_kg", 0)) for row in data)
	avg_invoice_value = total_amount / total_invoices if total_invoices > 0 else 0
	avg_rate_per_kg = total_amount / total_kg if total_kg > 0 else 0

	# Get payment mode breakdown
	payment_query = """
		SELECT
			payment_mode,
			SUM(total_amount) as amount,
			COUNT(*) as count
		FROM `tabPOS Invoice`
		WHERE docstatus = 1
	"""

	conditions = []

	# Check user roles for shop-based filtering
	user_roles = frappe.get_roles(frappe.session.user)

	# If user is Shop Manager but not System Manager, filter by their assigned shops
	if "Shop Manager" in user_roles and "System Manager" not in user_roles:
		user_shops = frappe.get_all("Shop", filters={"shop_manager": frappe.session.user}, pluck="name")
		if user_shops:
			shops_str = ", ".join([f"'{shop}'" for shop in user_shops])
			conditions.append(f"shop IN ({shops_str})")

	if filters and filters.get("shop"):
		conditions.append(f"shop = '{filters.get('shop')}'")
	if filters and filters.get("from_date"):
		conditions.append(f"posting_date >= '{filters.get('from_date')}'")
	if filters and filters.get("to_date"):
		conditions.append(f"posting_date <= '{filters.get('to_date')}'")

	if conditions:
		payment_query += " AND " + " AND ".join(conditions)

	payment_query += " GROUP BY payment_mode"

	payment_data = frappe.db.sql(payment_query, as_dict=1)

	cash_amount = 0
	upi_amount = 0
	cash_count = 0
	upi_count = 0

	for row in payment_data:
		if row.get("payment_mode") == "Cash":
			cash_amount = flt(row.get("amount", 0))
			cash_count = row.get("count", 0)
		elif row.get("payment_mode") == "UPI":
			upi_amount = flt(row.get("amount", 0))
			upi_count = row.get("count", 0)

	return [
		{"value": total_invoices, "label": "Total Invoices", "datatype": "Int", "indicator": "blue"},
		{
			"value": flt(total_amount, 2),
			"label": "Total Sales (₹)",
			"datatype": "Currency",
			"indicator": "green",
		},
		{"value": flt(total_kg, 3), "label": "Total Quantity (Kg)", "datatype": "Float", "indicator": "blue"},
		{
			"value": flt(avg_invoice_value, 2),
			"label": "Avg Invoice Value (₹)",
			"datatype": "Currency",
			"indicator": "orange",
		},
		{
			"value": flt(avg_rate_per_kg, 2),
			"label": "Avg Rate/Kg (₹)",
			"datatype": "Currency",
			"indicator": "purple",
		},
		{
			"value": f"{cash_count} (₹{flt(cash_amount, 2)})",
			"label": "Cash Sales",
			"datatype": "Data",
			"indicator": "green",
		},
		{
			"value": f"{upi_count} (₹{flt(upi_amount, 2)})",
			"label": "UPI Sales",
			"datatype": "Data",
			"indicator": "blue",
		},
	]


def get_chart_data(data):
	"""Generate chart showing shop-wise sales"""
	if not data:
		return None

	# Group data by shop
	shop_sales = {}
	for row in data:
		shop = str(row.get("shop", "Unknown"))
		if shop not in shop_sales:
			shop_sales[shop] = {"amount": 0, "kg": 0, "count": 0}
		shop_sales[shop]["amount"] += flt(row.get("total_amount", 0))
		shop_sales[shop]["kg"] += flt(row.get("total_kg", 0))
		shop_sales[shop]["count"] += 1

	# Sort by amount (descending)
	sorted_shops = sorted(shop_sales.keys(), key=lambda x: shop_sales[x]["amount"], reverse=True)

	# Prepare chart data
	labels = []
	amount_values = []
	kg_values = []

	for shop in sorted_shops:
		labels.append(shop)
		amount_values.append(flt(shop_sales[shop]["amount"], 2))
		kg_values.append(flt(shop_sales[shop]["kg"], 2))

	chart = {
		"data": {
			"labels": labels,
			"datasets": [
				{"name": "Sales Amount (₹)", "values": amount_values},
				{"name": "Quantity Sold (Kg)", "values": kg_values},
			],
		},
		"type": "bar",
		"colors": ["#10b981", "#3b82f6"],
		"height": 300,
		"axisOptions": {"xIsSeries": 1},
	}

	return chart
