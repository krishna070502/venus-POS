# Copyright (c) 2025, Gopal and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestShop(IntegrationTestCase):
	def test_wastage_validation(self):
		shop = frappe.get_doc({"doctype": "Shop", "shop_name": "Test Shop", "default_wastage_pct": 30})
		shop.insert()
		self.assertEqual(shop.default_wastage_pct, 30)
		shop.delete()
