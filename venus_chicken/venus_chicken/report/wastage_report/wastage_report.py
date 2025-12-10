# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import flt


def execute(filters=None):
	"""Execute wastage report"""
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	"""Define report columns"""
	return [
		{
			"fieldname": "date_or_entry",
			"label": _("Date / Processing Entry"),
			"fieldtype": "Data",
			"width": 250,
		},
		{
			"fieldname": "shop",
			"label": _("Shop"),
			"fieldtype": "Link",
			"options": "Shop",
			"width": 150,
		},
		{
			"fieldname": "raw_weight_kg",
			"label": _("Raw Weight (Kg)"),
			"fieldtype": "Float",
			"width": 120,
			"precision": 3,
		},
		{
			"fieldname": "processed_weight_kg",
			"label": _("Processed Weight (Kg)"),
			"fieldtype": "Float",
			"width": 140,
			"precision": 3,
		},
		{
			"fieldname": "allowed_wastage_kg",
			"label": _("Allowed Wastage (Kg)"),
			"fieldtype": "Float",
			"width": 140,
			"precision": 3,
		},
		{
			"fieldname": "actual_wastage_kg",
			"label": _("Actual Wastage (Kg)"),
			"fieldtype": "Float",
			"width": 140,
			"precision": 3,
		},
		{
			"fieldname": "allowed_wastage_pct",
			"label": _("Allowed Wastage (%)"),
			"fieldtype": "Float",
			"width": 140,
			"precision": 2,
		},
		{
			"fieldname": "actual_wastage_pct",
			"label": _("Actual Wastage (%)"),
			"fieldtype": "Float",
			"width": 140,
			"precision": 2,
		},
		{
			"fieldname": "status",
			"label": _("Status"),
			"fieldtype": "Data",
			"width": 100,
		},
	]


def get_data(filters):
	"""Get wastage data grouped by date and shop"""
	conditions = get_conditions(filters)

	# Get all submitted processing entries
	entries = frappe.db.sql(
		f"""
		SELECT
			pe.name,
			pe.posting_date,
			pe.shop,
			s.default_wastage_pct,
			SUM(pei.raw_weight_in_kg) as total_raw_weight,
			SUM(pei.processed_weight_out_kg) as total_processed_weight,
			SUM(pei.wastage_kg) as total_wastage_kg
		FROM
			`tabProcessing Entry` pe
		INNER JOIN
			`tabProcessing Entry Item` pei ON pei.parent = pe.name
		LEFT JOIN
			`tabShop` s ON s.name = pe.shop
		WHERE
			pe.docstatus = 1
			{conditions}
		GROUP BY
			pe.name, pe.posting_date, pe.shop, s.default_wastage_pct
		ORDER BY
			pe.posting_date DESC, pe.shop, pe.name
		""",
		filters,
		as_dict=1,
	)

	if not entries:
		return []

	# Build flat list of processing entries
	data = []

	for entry in entries:
		entry_raw = flt(entry.total_raw_weight)
		entry_processed = flt(entry.total_processed_weight)
		entry_wastage = flt(entry.total_wastage_kg)
		entry_allowed_pct = flt(entry.default_wastage_pct)
		entry_allowed_kg = (entry_raw * entry_allowed_pct / 100) if entry_raw > 0 else 0
		entry_actual_pct = (entry_wastage / entry_raw * 100) if entry_raw > 0 else 0
		entry_status = "✅ Good" if entry_actual_pct <= entry_allowed_pct else "⚠️ Over"

		data.append(
			{
				"date_or_entry": entry.name,
				"shop": entry.shop,
				"raw_weight_kg": entry_raw,
				"processed_weight_kg": entry_processed,
				"allowed_wastage_kg": entry_allowed_kg,
				"actual_wastage_kg": entry_wastage,
				"allowed_wastage_pct": entry_allowed_pct,
				"actual_wastage_pct": entry_actual_pct,
				"status": entry_status,
			}
		)

	return data


def get_conditions(filters):
	"""Build SQL WHERE conditions from filters"""
	conditions = []

	if filters.get("from_date"):
		conditions.append("pe.posting_date >= %(from_date)s")

	if filters.get("to_date"):
		conditions.append("pe.posting_date <= %(to_date)s")

	if filters.get("shop"):
		conditions.append("pe.shop = %(shop)s")

	return " AND " + " AND ".join(conditions) if conditions else ""
