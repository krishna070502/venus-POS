// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.query_reports["Purchase Report"] = {
	"filters": [
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_start(),
			"reqd": 1
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_end(),
			"reqd": 1
		},
		{
			"fieldname": "shop",
			"label": __("Shop"),
			"fieldtype": "Link",
			"options": "Shop"
		},
		{
			"fieldname": "product",
			"label": __("Product"),
			"fieldtype": "Link",
			"options": "Product"
		},
		{
			"fieldname": "supplier",
			"label": __("Supplier"),
			"fieldtype": "Data"
		}
	]
};
