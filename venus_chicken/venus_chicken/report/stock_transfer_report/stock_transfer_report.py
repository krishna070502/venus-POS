# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
	"""Execute Stock Transfer Report"""
	if not filters:
		filters = {}

	columns = get_columns()
	data = get_data(filters)

	return columns, data


def get_columns():
	"""Define report columns"""
	return [
		{
			"fieldname": "transfer_no",
			"label": _("Transfer No"),
			"fieldtype": "Link",
			"options": "Stock Transfer",
			"width": 150,
		},
		{
			"fieldname": "posting_date",
			"label": _("Transfer Date"),
			"fieldtype": "Date",
			"width": 120,
		},
		{
			"fieldname": "from_shop",
			"label": _("From Shop"),
			"fieldtype": "Link",
			"options": "Shop",
			"width": 130,
		},
		{
			"fieldname": "to_shop",
			"label": _("To Shop"),
			"fieldtype": "Link",
			"options": "Shop",
			"width": 130,
		},
		{
			"fieldname": "stock_type",
			"label": _("Stock Type"),
			"fieldtype": "Data",
			"width": 120,
		},
		{
			"fieldname": "product",
			"label": _("Product"),
			"fieldtype": "Link",
			"options": "Product",
			"width": 130,
		},
		{
			"fieldname": "quantity_nos",
			"label": _("Quantity (Nos)"),
			"fieldtype": "Int",
			"width": 120,
		},
		{
			"fieldname": "quantity_kg",
			"label": _("Quantity (Kg)"),
			"fieldtype": "Float",
			"precision": 3,
			"width": 120,
		},
		{
			"fieldname": "transferred_by",
			"label": _("Transferred By"),
			"fieldtype": "Link",
			"options": "User",
			"width": 180,
		},
		{
			"fieldname": "status",
			"label": _("Status"),
			"fieldtype": "Data",
			"width": 110,
		},
	]


def get_data(filters=None):
	"""Get stock transfer data"""
	if not filters:
		filters = {}

	conditions = get_conditions(filters)

	query = f"""
		SELECT
			st.name as transfer_no,
			st.posting_date,
			st.from_shop,
			st.to_shop,
			st.transferred_by,
			st.status,
			sti.stock_type,
			sti.product,
			sti.quantity_nos,
			sti.quantity_kg
		FROM
			`tabStock Transfer` st
		INNER JOIN
			`tabStock Transfer Item` sti ON sti.parent = st.name
		WHERE
			st.docstatus IN (0, 1, 2)
			{" AND " + conditions if conditions else ""}
		ORDER BY
			st.posting_date DESC, st.name, sti.idx
	"""

	data = frappe.db.sql(query, filters, as_dict=1)

	return data


def get_conditions(filters):
	"""Build SQL WHERE conditions from filters"""
	conditions = []

	if filters.get("from_date"):
		conditions.append("st.posting_date >= %(from_date)s")

	if filters.get("to_date"):
		conditions.append("st.posting_date <= %(to_date)s")

	if filters.get("from_shop"):
		conditions.append("st.from_shop = %(from_shop)s")

	if filters.get("to_shop"):
		conditions.append("st.to_shop = %(to_shop)s")

	if filters.get("status"):
		conditions.append("st.status = %(status)s")

	if filters.get("stock_type"):
		conditions.append("sti.stock_type = %(stock_type)s")

	return " AND ".join(conditions) if conditions else ""
