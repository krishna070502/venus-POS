// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Day Settlement", {
	refresh(frm) {
		if (!frm.is_new()) {
			// Add button to view invoices
			frm.add_custom_button(__("View Invoices"), function() {
				frappe.set_route("List", "POS Invoice", {
					"shop": frm.doc.shop,
					"posting_date": frm.doc.date
				});
			});
			
			// Add button to show sales summary
			frm.add_custom_button(__("Sales Summary"), function() {
				show_sales_summary(frm);
			});
		}
		
		// Highlight variance
		if (frm.doc.variance) {
			if (frm.doc.variance > 0) {
				frm.get_field("variance").$wrapper.css("background-color", "#ffe6e6");
			} else if (frm.doc.variance < 0) {
				frm.get_field("variance").$wrapper.css("background-color", "#fff4e6");
			}
		}
	},

	shop(frm) {
		if (frm.doc.shop && frm.doc.date) {
			calculate_sales(frm);
		}
	},

	date(frm) {
		if (frm.doc.shop && frm.doc.date) {
			calculate_sales(frm);
		}
	},

	cash_collected(frm) {
		if (frm.doc.total_sales && frm.doc.cash_collected) {
			frm.set_value("variance", frm.doc.total_sales - frm.doc.cash_collected);
		}
	}
});

function calculate_sales(frm) {
	frappe.call({
		method: "venus_chicken.venus_chicken.doctype.day_settlement.day_settlement.get_day_sales_summary",
		args: {
			shop: frm.doc.shop,
			date: frm.doc.date
		},
		callback: function(r) {
			if (r.message) {
				frm.set_value("total_sales", r.message.total_amount);
				frappe.show_alert({
					message: __(`Found ${r.message.invoice_count} invoices, Total: ₹${r.message.total_amount.toFixed(2)}`),
					indicator: "green"
				});
			}
		}
	});
}

function show_sales_summary(frm) {
	frappe.call({
		method: "venus_chicken.venus_chicken.doctype.day_settlement.day_settlement.get_day_sales_summary",
		args: {
			shop: frm.doc.shop,
			date: frm.doc.date
		},
		callback: function(r) {
			if (r.message) {
				let summary = r.message;
				let html = `
					<h4>Sales Summary for ${frm.doc.date}</h4>
					<p><b>Total Invoices:</b> ${summary.invoice_count}</p>
					<p><b>Total Kg Sold:</b> ${summary.total_kg.toFixed(2)} kg</p>
					<p><b>Total Amount:</b> ₹${summary.total_amount.toFixed(2)}</p>
					<hr>
					<h5>Invoice Details:</h5>
					<table class="table table-bordered">
						<thead>
							<tr>
								<th>Invoice</th>
								<th>Time</th>
								<th>Customer</th>
								<th>Kg</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody>
				`;
				
				summary.invoices.forEach(function(inv) {
					html += `
						<tr>
							<td><a href="/app/pos-invoice/${inv.name}">${inv.name}</a></td>
							<td>${inv.posting_time}</td>
							<td>${inv.customer_name || "-"}</td>
							<td>${inv.total_kg.toFixed(2)}</td>
							<td>₹${inv.total_amount.toFixed(2)}</td>
						</tr>
					`;
				});
				
				html += `
						</tbody>
					</table>
				`;
				
				frappe.msgprint({
					title: __("Sales Summary"),
					message: html,
					wide: true
				});
			}
		}
	});
}
