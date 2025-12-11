// Copyright (c) 2025, Gopal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Expense", {
	refresh(frm) {
		// Set today's date if not set
		if (!frm.doc.date) {
			frm.set_value("date", frappe.datetime.get_today());
		}
	},

	shop(frm) {
		// Clear and refresh when shop changes
		if (frm.doc.shop && frm.doc.date) {
			frm.trigger("check_existing_expenses");
		}
	},

	date(frm) {
		// Check for existing expenses when date changes
		if (frm.doc.shop && frm.doc.date) {
			frm.trigger("check_existing_expenses");
		}
	},

	check_existing_expenses(frm) {
		// Show existing expenses for the day
		if (frm.doc.shop && frm.doc.date && !frm.is_new()) {
			return;
		}

		frappe.call({
			method:
				"venus_chicken.venus_chicken.doctype.expense.expense.get_expenses_for_settlement",
			args: {
				shop: frm.doc.shop,
				date: frm.doc.date,
			},
			callback: function (r) {
				if (r.message && r.message.total_expenses > 0) {
					frm.dashboard.add_comment(
						__("Total expenses for this day: {0}", [
							format_currency(r.message.total_expenses),
						]),
						"blue",
						true
					);
				}
			},
		});
	},
});
