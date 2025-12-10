// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Purchase Entry", {
	refresh(frm) {
		// Add custom buttons or actions
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("View Stock"), function() {
				frappe.set_route("Form", "Shop", frm.doc.shop);
			});
		}
	},

	validate(frm) {
		// Calculate totals before saving
		calculate_total(frm);
	}
});

frappe.ui.form.on("Purchase Entry Item", {
	quantity_nos(frm, cdt, cdn) {
		// Just recalculate total when quantity changes
		calculate_total(frm);
	},

	weight_kg(frm, cdt, cdn) {
		calculate_item_amount(frm, cdt, cdn);
	},

	rate_per_kg(frm, cdt, cdn) {
		calculate_item_amount(frm, cdt, cdn);
	},

	items_remove(frm) {
		calculate_total(frm);
	}
});

function calculate_item_amount(frm, cdt, cdn) {
	let item = locals[cdt][cdn];
	let amount = flt(item.weight_kg) * flt(item.rate_per_kg);
	frappe.model.set_value(cdt, cdn, "amount", amount);
	calculate_total(frm);
}

function calculate_total(frm) {
	let total = 0;
	frm.doc.items.forEach(item => {
		total += flt(item.amount);
	});
	frm.set_value("total_amount", total);
}
