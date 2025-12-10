# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

"""
Installation and setup utilities for Venus Chicken app
"""

import json
import os

import frappe


def after_install():
	"""Called after app installation"""
	create_custom_roles()
	setup_role_permissions()
	setup_sample_data()
	create_workspace()
	frappe.db.commit()
	print("Venus Chicken app installed successfully!")


def create_custom_roles():
	"""Create custom roles if they don't exist"""
	roles = ["Shop Manager", "Cashier", "Stock Keeper"]

	for role_name in roles:
		if not frappe.db.exists("Role", role_name):
			role = frappe.get_doc(
				{"doctype": "Role", "role_name": role_name, "desk_access": 1, "is_custom": 1}
			)
			role.insert(ignore_permissions=True)
			print(f"Created role: {role_name}")


def setup_role_permissions():
	"""Setup permissions for User Permission doctype for shop-based roles"""
	# Shop Manager and Cashier need to read User Permission doctype
	# This is required for Frappe's permission filtering system
	roles = ["Shop Manager", "Cashier"]

	for role in roles:
		# Check if permission already exists
		existing = frappe.db.exists(
			"Custom DocPerm", {"parent": "User Permission", "role": role, "permlevel": 0}
		)

		if not existing:
			try:
				# Add read permission for User Permission doctype
				frappe.get_doc(
					{
						"doctype": "Custom DocPerm",
						"parent": "User Permission",
						"parenttype": "DocType",
						"parentfield": "permissions",
						"role": role,
						"permlevel": 0,
						"read": 1,
						"if_owner": 0,
					}
				).insert(ignore_permissions=True)
				print(f"Added User Permission read access for {role}")
			except Exception as e:
				print(f"Error adding permission for {role}: {e!s}")


def setup_sample_data():
	"""Setup sample products and shops"""
	if frappe.db.exists("Product", "CHK-BREAST"):
		print("Sample data already exists, skipping...")
		return

	# Import sample products
	products_file = os.path.join(frappe.get_app_path("venus_chicken"), "sample_data", "sample_products.json")

	if os.path.exists(products_file):
		with open(products_file) as f:
			products = json.load(f)
			for product_data in products:
				if not frappe.db.exists("Product", product_data.get("item_code")):
					product = frappe.get_doc(product_data)
					product.insert(ignore_permissions=True)
					print(f"Created product: {product.item_code}")

	# Import sample shops
	shops_file = os.path.join(frappe.get_app_path("venus_chicken"), "sample_data", "sample_shops.json")

	if os.path.exists(shops_file):
		with open(shops_file) as f:
			shops = json.load(f)
			for shop_data in shops:
				if not frappe.db.exists("Shop", shop_data.get("shop_name")):
					shop = frappe.get_doc(shop_data)
					shop.insert(ignore_permissions=True)
					print(f"Created shop: {shop.shop_name}")


@frappe.whitelist()
def setup_demo_data():
	"""Manually trigger demo data setup"""
	setup_sample_data()
	frappe.db.commit()
	return "Demo data setup completed!"


def create_workspace():
	"""Create Poultry Shop workspace from JSON file"""
	if frappe.db.exists("Workspace", "Poultry Shop"):
		print("Workspace already exists, skipping...")
		return

	workspace_file = os.path.join(
		frappe.get_app_path("venus_chicken"),
		"venus_chicken",
		"workspace",
		"poultry_shop",
		"poultry_shop.json",
	)

	if os.path.exists(workspace_file):
		with open(workspace_file) as f:
			workspace_data = json.load(f)
			ws = frappe.get_doc(workspace_data)
			ws.insert(ignore_permissions=True)
			print(f"Created workspace: {ws.name}")
