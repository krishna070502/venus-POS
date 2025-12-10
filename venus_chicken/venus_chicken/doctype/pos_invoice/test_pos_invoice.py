# Copyright (c) 2025, Gopal and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestPOSInvoice(IntegrationTestCase):
	def setUp(self):
		# Create test shop
		if not frappe.db.exists("Shop", "Test Shop POS"):
			shop = frappe.get_doc(
				{"doctype": "Shop", "shop_name": "Test Shop POS", "default_wastage_pct": 30}
			)
			shop.insert()

		# Create test product
		if not frappe.db.exists("Product", "TEST-ITEM"):
			product = frappe.get_doc(
				{
					"doctype": "Product",
					"item_code": "TEST-ITEM",
					"item_name": "Test Chicken",
					"base_price": 200,
				}
			)
			product.insert()

		# Add stock
		shop = frappe.get_doc("Shop", "Test Shop POS")
		shop.update_stock(product="TEST-ITEM", qty_no=10, raw_weight_kg=100, processed_weight_kg=70)

	def test_pos_invoice_creation(self):
		invoice = frappe.get_doc(
			{
				"doctype": "POS Invoice",
				"shop": "Test Shop POS",
				"posting_date": frappe.utils.today(),
				"posting_time": frappe.utils.nowtime(),
				"items": [{"product": "TEST-ITEM", "qty_kg": 5, "rate": 200}],
			}
		)
		invoice.insert()
		self.assertEqual(invoice.total_kg, 5)
		self.assertEqual(invoice.total_amount, 1000)

	def tearDown(self):
		frappe.db.rollback()
