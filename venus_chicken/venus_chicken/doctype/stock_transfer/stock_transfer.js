// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on('Stock Transfer', {
	refresh: function(frm) {
		// Add custom buttons based on status
		if (frm.doc.docstatus === 0 && frm.doc.status === 'Draft') {
			frm.add_custom_button(__('Mark as In Transit'), function() {
				frappe.call({
					method: 'frappe.client.set_value',
					args: {
						doctype: 'Stock Transfer',
						name: frm.doc.name,
						fieldname: 'status',
						value: 'In Transit'
					},
					callback: function() {
						frm.reload_doc();
					}
				});
			});
		}

		// Set color indicator based on status
		if (frm.doc.status === 'Completed') {
			frm.dashboard.set_headline_alert('Stock transfer completed successfully', 'green');
		} else if (frm.doc.status === 'In Transit') {
			frm.dashboard.set_headline_alert('Stock is in transit', 'blue');
		} else if (frm.doc.status === 'Cancelled') {
			frm.dashboard.set_headline_alert('Stock transfer cancelled', 'red');
		}
	},

	from_shop: function(frm) {
		// Clear items if from_shop changes
		if (frm.doc.items && frm.doc.items.length > 0) {
			frappe.confirm(
				__('Changing From Shop will clear all items. Do you want to continue?'),
				function() {
					frm.clear_table('items');
					frm.refresh_field('items');
				},
				function() {
					frm.set_value('from_shop', frm.doc.__from_shop_old);
				}
			);
		}
		frm.doc.__from_shop_old = frm.doc.from_shop;
	},

	to_shop: function(frm) {
		// Validate that to_shop is different from from_shop
		if (frm.doc.from_shop && frm.doc.to_shop === frm.doc.from_shop) {
			frappe.msgprint(__('To Shop cannot be the same as From Shop'));
			frm.set_value('to_shop', '');
		}
	}
});

frappe.ui.form.on('Stock Transfer Item', {
	stock_type: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		// Clear product when stock type changes
		frappe.model.set_value(cdt, cdn, 'product', '');
		frappe.model.set_value(cdt, cdn, 'quantity_nos', 0);
		frappe.model.set_value(cdt, cdn, 'quantity_kg', 0);
		frappe.model.set_value(cdt, cdn, 'available_stock_nos', 0);
		frappe.model.set_value(cdt, cdn, 'available_stock_kg', 0);
	},

	product: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Get available stock for the product in from_shop
		if (frm.doc.from_shop && row.product && row.stock_type) {
			frappe.call({
				method: 'venus_chicken.venus_chicken.doctype.stock_transfer.stock_transfer.get_available_stock',
				args: {
					shop: frm.doc.from_shop,
					product: row.product,
					stock_type: row.stock_type
				},
				callback: function(r) {
					if (r.message) {
						if (row.stock_type === 'Raw Meat') {
							frappe.model.set_value(cdt, cdn, 'available_stock_nos', r.message.quantity_nos || 0);
							frappe.model.set_value(cdt, cdn, 'available_stock_kg', r.message.quantity_kg || 0);
							if (r.message.quantity_kg === 0) {
								frappe.msgprint(__('No raw stock available for {0} in {1}', [row.product, frm.doc.from_shop]));
							}
						} else {
							frappe.model.set_value(cdt, cdn, 'available_stock_kg', r.message.quantity_kg || 0);
							if (r.message.quantity_kg === 0) {
								frappe.msgprint(__('No processed stock available for {0} in {1}', [row.product, frm.doc.from_shop]));
							}
						}
					} else {
						frappe.model.set_value(cdt, cdn, 'available_stock_nos', 0);
						frappe.model.set_value(cdt, cdn, 'available_stock_kg', 0);
					}
				}
			});
		}
	},

	quantity_nos: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Validate quantity_nos against available stock
		if (row.stock_type === 'Raw Meat' && row.available_stock_nos !== undefined && row.quantity_nos > row.available_stock_nos) {
			frappe.msgprint(__('Quantity ({0} nos) exceeds available stock ({1} nos)', 
				[row.quantity_nos, row.available_stock_nos]));
		}
	},

	quantity_kg: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Validate quantity_kg against available stock
		if (row.available_stock_kg !== undefined && row.quantity_kg > row.available_stock_kg) {
			frappe.msgprint(__('Quantity ({0} kg) exceeds available stock ({1} kg)', 
				[row.quantity_kg, row.available_stock_kg]));
		}
	}
});
