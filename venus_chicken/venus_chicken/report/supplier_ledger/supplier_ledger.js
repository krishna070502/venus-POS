// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.query_reports["Supplier Ledger"] = {
	"filters": [
		{
			"fieldname": "supplier",
			"label": __("Supplier"),
			"fieldtype": "Link",
			"options": "Supplier",
			"reqd": 1
		},
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			"reqd": 1
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1
		},
		{
			"fieldname": "shop",
			"label": __("Shop"),
			"fieldtype": "Link",
			"options": "Shop"
		}
	]
};
