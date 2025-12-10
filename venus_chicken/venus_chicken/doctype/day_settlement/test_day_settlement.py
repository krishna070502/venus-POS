# Copyright (c) 2025, Gopal and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestDaySettlement(IntegrationTestCase):
	def test_variance_calculation(self):
		settlement = frappe.get_doc(
			{
				"doctype": "Day Settlement",
				"shop": "Test Shop",
				"date": frappe.utils.today(),
				"total_sales": 5000,
				"cash_collected": 4800,
			}
		)
		settlement.insert()
		self.assertEqual(settlement.variance, 200)
