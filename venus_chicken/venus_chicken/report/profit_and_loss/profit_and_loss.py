# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import flt


def execute(filters=None):
	"""Execute Profit and Loss report"""
	if not filters:
		filters = {}

	columns = get_columns()
	data = get_data(filters)

	# Calculate summary
	total_revenue = sum(
		flt(row.get("revenue") or 0) for row in data if isinstance(row.get("revenue"), (int, float))
	)
	total_cogs = sum(flt(row.get("cogs") or 0) for row in data if isinstance(row.get("cogs"), (int, float)))
	total_profit = total_revenue - total_cogs
	profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

	# Summary cards
	summary = [
		{
			"value": total_revenue,
			"indicator": "blue",
			"label": "Total Revenue (Sales)",
			"datatype": "Currency",
		},
		{
			"value": total_cogs,
			"indicator": "orange",
			"label": "Total COGS (Cost of Goods Sold)",
			"datatype": "Currency",
		},
		{
			"value": total_profit,
			"indicator": "green" if total_profit >= 0 else "red",
			"label": "Net Profit/Loss",
			"datatype": "Currency",
		},
		{
			"value": profit_margin,
			"indicator": "green" if profit_margin >= 0 else "red",
			"label": "Profit Margin %",
			"datatype": "Percent",
		},
	]

	# Add message
	message = "Profit & Loss"
	if filters.get("shop"):
		message += f" for <b>{filters.get('shop')}</b>"
	if filters.get("from_date") and filters.get("to_date"):
		message += f" | Period: {filters.get('from_date')} to {filters.get('to_date')}"

	return columns, data, message, None, summary


def get_columns():
	"""Define report columns"""
	return [
		{
			"fieldname": "shop",
			"label": _("Shop"),
			"fieldtype": "Link",
			"options": "Shop",
			"width": 150,
		},
		{
			"fieldname": "revenue",
			"label": _("Revenue (Sales)"),
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"fieldname": "cogs",
			"label": _("COGS (Cost of Goods Sold)"),
			"fieldtype": "Currency",
			"width": 180,
		},
		{
			"fieldname": "gross_profit",
			"label": _("Gross Profit"),
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"fieldname": "profit_margin",
			"label": _("Profit Margin %"),
			"fieldtype": "Percent",
			"width": 130,
		},
	]


def get_data(filters=None):
	"""Get profit and loss data shop-wise"""
	if not filters:
		filters = {}

	sales_conditions = get_conditions(filters, "")
	cogs_conditions = get_conditions(filters, "pi.")

	# Get sales data (revenue from POS Invoice)
	sales_query = f"""
		SELECT
			shop,
			SUM(total_amount) as revenue
		FROM
			`tabPOS Invoice`
		WHERE
			docstatus = 1
			{" AND " + sales_conditions if sales_conditions else ""}
		GROUP BY
			shop
	"""

	sales_data = frappe.db.sql(sales_query, filters, as_dict=1)

	# Get COGS data (cost calculated from stock ledger - weighted average cost)
	# We need to calculate cost based on processed stock consumption
	cogs_query = f"""
		SELECT
			pi.shop,
			SUM(
				pii.qty_kg * (
					SELECT COALESCE(AVG(pei.rate_per_kg), 0)
					FROM `tabPurchase Entry` pe
					INNER JOIN `tabPurchase Entry Item` pei ON pei.parent = pe.name
					WHERE pei.product = pii.product
					AND pe.shop = pi.shop
					AND pe.docstatus = 1
					AND pe.posting_date <= pi.posting_date
				)
			) as cogs
		FROM
			`tabPOS Invoice` pi
		INNER JOIN
			`tabPOS Invoice Item` pii ON pii.parent = pi.name
		WHERE
			pi.docstatus = 1
			{" AND " + cogs_conditions if cogs_conditions else ""}
		GROUP BY
			pi.shop
	"""

	cogs_data = frappe.db.sql(cogs_query, filters, as_dict=1)

	# Merge data by shop
	shop_data = {}

	for sale in sales_data:
		shop = sale.shop
		if shop not in shop_data:
			shop_data[shop] = {"shop": shop, "revenue": 0, "cogs": 0}
		shop_data[shop]["revenue"] = flt(sale.revenue)

	for cost in cogs_data:
		shop = cost.shop
		if shop not in shop_data:
			shop_data[shop] = {"shop": shop, "revenue": 0, "cogs": 0}
		shop_data[shop]["cogs"] = flt(cost.cogs)

	# Build final data with profit calculations
	data = []
	for shop in sorted(shop_data.keys()):
		row = shop_data[shop]
		revenue = flt(row["revenue"])
		cogs = flt(row["cogs"])
		gross_profit = revenue - cogs
		profit_margin = (gross_profit / revenue * 100) if revenue > 0 else 0

		data.append(
			{
				"shop": shop,
				"revenue": revenue,
				"cogs": cogs,
				"gross_profit": gross_profit,
				"profit_margin": profit_margin,
			}
		)

	return data


def get_conditions(filters, table_prefix=""):
	"""Build SQL WHERE conditions from filters"""
	conditions = []

	if filters.get("from_date"):
		conditions.append(f"{table_prefix}posting_date >= %(from_date)s")

	if filters.get("to_date"):
		conditions.append(f"{table_prefix}posting_date <= %(to_date)s")

	if filters.get("shop"):
		conditions.append(f"{table_prefix}shop = %(shop)s")

	return " AND ".join(conditions) if conditions else ""
