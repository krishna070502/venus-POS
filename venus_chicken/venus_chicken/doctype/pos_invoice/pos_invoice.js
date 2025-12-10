// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on("POS Invoice", {
	refresh(frm) {
		// Add custom styling for POS mode
		if (frm.doc.docstatus === 0) {
			frm.page.set_primary_action(__("Submit"), function() {
				frm.savesubmit();
			});
		}
		
		// Show stock availability
		if (!frm.is_new()) {
			frm.add_custom_button(__("View Stock"), function() {
				frappe.set_route("Form", "Shop", frm.doc.shop);
			});
		}
	},

	shop(frm) {
		// Clear items when shop changes
		if (frm.doc.items && frm.doc.items.length > 0) {
			frappe.confirm(
				__("Changing shop will clear all items. Continue?"),
				function() {
					frm.clear_table("items");
					frm.refresh_field("items");
				},
				function() {
					// Revert shop change
					frm.reload_doc();
				}
			);
		}
	}
});

frappe.ui.form.on("POS Invoice Item", {
	product(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		if (row.product) {
			// Get product rate
			frappe.call({
				method: "venus_chicken.venus_chicken.doctype.pos_invoice.pos_invoice.get_product_rate",
				args: {
					product: row.product
				},
				callback: function(r) {
					if (r.message) {
						frappe.model.set_value(cdt, cdn, "rate", r.message);
					}
				}
			});
			
			// Check stock availability
			if (frm.doc.shop) {
				frappe.call({
					method: "venus_chicken.venus_chicken.doctype.shop.shop.get_stock_for_product",
					args: {
						shop: frm.doc.shop,
						product: row.product
					},
					callback: function(r) {
						if (r.message) {
							let stock = r.message.processed_weight_kg || 0;
							if (stock <= 0) {
								frappe.msgprint(__(`No stock available for ${row.product}`));
							} else {
								frappe.show_alert({
									message: __(`Available stock: ${stock.toFixed(2)} kg`),
									indicator: "green"
								});
							}
						}
					}
				});
			}
		}
	},

	qty_kg(frm, cdt, cdn) {
		calculate_item_amount(frm, cdt, cdn);
	},

	rate(frm, cdt, cdn) {
		calculate_item_amount(frm, cdt, cdn);
	},

	items_remove(frm) {
		calculate_invoice_totals(frm);
	}
});

function calculate_item_amount(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	row.amount = flt(row.qty_kg) * flt(row.rate);
	frm.refresh_field("items");
	calculate_invoice_totals(frm);
}

function calculate_invoice_totals(frm) {
	let total_kg = 0;
	let total_amount = 0;
	
	frm.doc.items.forEach(function(item) {
		total_kg += flt(item.qty_kg);
		total_amount += flt(item.amount);
	});
	
	frm.set_value("total_kg", total_kg);
	frm.set_value("total_amount", total_amount);
}
