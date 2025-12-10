// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.js

frappe.ui.form.on("Product", {
	refresh(frm) {
		// Restrict price editing to System Manager
		if (!frappe.user.has_role("System Manager")) {
			frm.set_df_property("base_price", "read_only", 1);
			frm.set_df_property("purchase_price", "read_only", 1);
		}
	}
});
