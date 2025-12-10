// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Processing Entry", {
	refresh(frm) {
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("View Stock"), function() {
				frappe.set_route("Form", "Shop", frm.doc.shop);
			});
		}
	},

	shop(frm) {
		// Fetch shop wastage percentage for reference
		if (frm.doc.shop) {
			frappe.db.get_value("Shop", frm.doc.shop, "default_wastage_pct", (r) => {
				if (r && r.default_wastage_pct) {
					frappe.show_alert({
						message: __("Shop Wastage Limit: {0}%", [r.default_wastage_pct]),
						indicator: "blue"
					});
				}
			});
		}
	}
});

frappe.ui.form.on("Processing Entry Item", {
	raw_weight_in_kg(frm, cdt, cdn) {
		calculate_wastage(frm, cdt, cdn);
	},

	processed_weight_out_kg(frm, cdt, cdn) {
		calculate_wastage(frm, cdt, cdn);
	},

	items_remove(frm) {
		frm.refresh_field("items");
	}
});

function calculate_wastage(frm, cdt, cdn) {
	let item = locals[cdt][cdn];
	
	// Calculate wastage kg
	let wastage_kg = flt(item.raw_weight_in_kg) - flt(item.processed_weight_out_kg);
	frappe.model.set_value(cdt, cdn, "wastage_kg", wastage_kg);
	
	// Calculate wastage percentage
	let wastage_pct = 0;
	if (flt(item.raw_weight_in_kg) > 0) {
		wastage_pct = (wastage_kg / flt(item.raw_weight_in_kg)) * 100;
	}
	frappe.model.set_value(cdt, cdn, "wastage_pct", wastage_pct);
	
	// Get shop wastage limit and set status
	if (frm.doc.shop) {
		frappe.db.get_value("Shop", frm.doc.shop, "default_wastage_pct", (r) => {
			let shop_limit = r && r.default_wastage_pct ? flt(r.default_wastage_pct) : 30;
			let status;
			
			if (wastage_pct <= shop_limit) {
				status = "Good ✅";
			} else {
				status = `Over Wastage! ⚠️ (Limit: ${shop_limit}%)`;
			}
			
			frappe.model.set_value(cdt, cdn, "wastage_status", status);
		});
	}
}
