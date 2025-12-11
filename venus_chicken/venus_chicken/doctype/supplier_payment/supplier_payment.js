// Copyright (c) 2025, Venus Chicken and contributors
// For license information, please see license.txt

frappe.ui.form.on("Supplier Payment", {
	refresh(frm) {
		// Show outstanding amount for supplier
		if (frm.doc.supplier && !frm.is_new()) {
			frm.add_custom_button(__('View Supplier Ledger'), function() {
				frappe.set_route('query-report', 'Supplier Ledger', {
					supplier: frm.doc.supplier
				});
			});
		}
		
		// Add button to get unpaid purchases
		if (frm.doc.supplier && frm.doc.docstatus === 0) {
			frm.add_custom_button(__('Get Unpaid Purchases'), function() {
				frappe.call({
					method: 'venus_chicken.venus_chicken.doctype.supplier_payment.supplier_payment.get_unpaid_purchases',
					args: { supplier: frm.doc.supplier },
					callback: function(r) {
						if (r.message && r.message.length > 0) {
							show_unpaid_purchases_dialog(frm, r.message);
						} else {
							frappe.msgprint(__('No unpaid purchases found for this supplier'));
						}
					}
				});
			});
		}
	},
	
	supplier(frm) {
		if (frm.doc.supplier) {
			// Fetch and show outstanding
			frappe.call({
				method: 'venus_chicken.venus_chicken.doctype.supplier_payment.supplier_payment.get_supplier_outstanding',
				args: { supplier: frm.doc.supplier },
				callback: function(r) {
					if (r.message) {
						let msg = `<strong>Total Purchases:</strong> ${format_currency(r.message.total_purchases)}<br>
								   <strong>Total Paid:</strong> ${format_currency(r.message.total_payments)}<br>
								   <strong>Outstanding:</strong> ${format_currency(r.message.outstanding)}`;
						frm.set_intro(msg, r.message.outstanding > 0 ? 'orange' : 'green');
					}
				}
			});
		} else {
			frm.set_intro('');
		}
	},
	
	purchase_entry(frm) {
		if (frm.doc.purchase_entry) {
			// Calculate already paid amount for this purchase
			frappe.call({
				method: 'frappe.client.get_list',
				args: {
					doctype: 'Supplier Payment',
					filters: {
						purchase_entry: frm.doc.purchase_entry,
						docstatus: 1,
						name: ['!=', frm.doc.name || '']
					},
					fields: ['sum(payment_amount) as paid']
				},
				callback: function(r) {
					let paid = r.message && r.message[0] ? r.message[0].paid || 0 : 0;
					frm.set_value('paid_amount', paid);
					
					// Calculate outstanding
					let outstanding = (frm.doc.purchase_amount || 0) - paid;
					frm.set_value('outstanding_amount', outstanding);
					
					// Suggest payment amount as outstanding
					if (!frm.doc.payment_amount && outstanding > 0) {
						frm.set_value('payment_amount', outstanding);
					}
				}
			});
		}
	},
	
	payment_amount(frm) {
		// Recalculate outstanding when payment amount changes
		if (frm.doc.purchase_entry && frm.doc.purchase_amount) {
			let outstanding = (frm.doc.purchase_amount || 0) - (frm.doc.paid_amount || 0) - (frm.doc.payment_amount || 0);
			frm.set_value('outstanding_amount', outstanding);
		}
	}
});

function show_unpaid_purchases_dialog(frm, purchases) {
	let d = new frappe.ui.Dialog({
		title: __('Select Purchase Entry'),
		fields: [
			{
				fieldtype: 'HTML',
				fieldname: 'purchases_html'
			}
		]
	});
	
	let html = `<table class="table table-bordered">
		<thead>
			<tr>
				<th>Purchase Entry</th>
				<th>Date</th>
				<th>Amount</th>
				<th>Paid</th>
				<th>Outstanding</th>
				<th>Action</th>
			</tr>
		</thead>
		<tbody>`;
	
	purchases.forEach(p => {
		html += `<tr>
			<td>${p.name}</td>
			<td>${frappe.datetime.str_to_user(p.posting_date)}</td>
			<td>${format_currency(p.total_amount)}</td>
			<td>${format_currency(p.paid_amount)}</td>
			<td>${format_currency(p.outstanding)}</td>
			<td><button class="btn btn-xs btn-primary select-purchase" data-name="${p.name}">Select</button></td>
		</tr>`;
	});
	
	html += '</tbody></table>';
	
	d.fields_dict.purchases_html.$wrapper.html(html);
	
	d.$wrapper.find('.select-purchase').on('click', function() {
		let purchase_name = $(this).data('name');
		frm.set_value('purchase_entry', purchase_name);
		d.hide();
	});
	
	d.show();
}
