// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.query_reports["Stock Summary"] = {
	"filters": [
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
		}
	]
};
