// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.query_reports["Wastage Report"] = {
	"filters": [
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_days(frappe.datetime.get_today(), -30),
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
	],
	
	"formatter": function(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		
		// Color code status column
		if (column.fieldname === "status" && data) {
			if (data.status && data.status.includes("Good")) {
				value = "<span style='color: green; font-weight: bold;'>" + data.status + "</span>";
			} else if (data.status && data.status.includes("Over")) {
				value = "<span style='color: red; font-weight: bold;'>" + data.status + "</span>";
			}
		}
		
		// Color code actual wastage % if over allowed
		if (column.fieldname === "actual_wastage_pct" && data) {
			let actual = data.actual_wastage_pct || 0;
			let allowed = data.allowed_wastage_pct || 0;
			
			if (allowed > 0 && actual > allowed) {
				value = "<span style='color: red; font-weight: bold;'>" + value + "</span>";
			}
		}
		
		return value;
	}
};
