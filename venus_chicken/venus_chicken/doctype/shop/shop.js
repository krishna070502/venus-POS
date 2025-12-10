// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Shop", {
	refresh(frm) {
		// Add custom button to view today's sales
		if (!frm.is_new()) {
			frm.add_custom_button(__("View Today's Sales"), function() {
				frappe.set_route("List", "POS Invoice", {
					"shop": frm.doc.name,
					"posting_date": frappe.datetime.get_today()
				});
			});

			frm.add_custom_button(__("Day Settlement"), function() {
				frappe.set_route("List", "Day Settlement", {
					"shop": frm.doc.name
				});
			});
		}
	},

	default_wastage_pct(frm) {
		if (frm.doc.default_wastage_pct < 0 || frm.doc.default_wastage_pct > 100) {
			frappe.msgprint(__("Wastage percentage must be between 0 and 100"));
			frm.set_value("default_wastage_pct", 30);
		}
	}
});
