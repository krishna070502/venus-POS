# Copyright (c) 2025, Gopal and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestProduct(IntegrationTestCase):
	def test_product_creation(self):
		product = frappe.get_doc(
			{
				"doctype": "Product",
				"item_code": "CHK-001",
				"item_name": "Chicken Breast",
				"base_price": 250,
				"purchase_price": 180,
			}
		)
		product.insert()
		self.assertEqual(product.item_name, "Chicken Breast")
		product.delete()
