# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Shop(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from venus_chicken.venus_chicken.doctype.shop_stock_item.shop_stock_item import ShopStockItem

		default_wastage_pct: DF.Percent
		location: DF.Data | None
		shop_manager: DF.Link | None
		shop_name: DF.Data
		stock_items: DF.Table[ShopStockItem]
	# end: auto-generated types

	def validate(self):
		"""Validate shop details"""
		if self.default_wastage_pct:
			wastage = float(self.default_wastage_pct)
			if wastage < 0 or wastage > 100:
				frappe.throw("Wastage percentage must be between 0 and 100")

	def on_update(self):
		"""Update user permissions when shop manager is changed"""
		self.update_user_permissions()

	def get_stock_balance(self, product):
		"""Get current stock balance for a product"""
		for item in self.stock_items:
			if item.product == product:
				return {
					"qty_no": item.qty_no or 0,
					"raw_weight_kg": item.raw_weight_kg or 0,
					"processed_weight_kg": item.processed_weight_kg or 0,
				}
		return {"qty_no": 0, "raw_weight_kg": 0, "processed_weight_kg": 0}

	def update_stock(self, product, qty_no=0, raw_weight_kg=0, processed_weight_kg=0):
		"""Update stock for a product - add or deduct quantities"""
		stock_updated = False

		for item in self.stock_items:
			if item.product == product:
				item.qty_no = (item.qty_no or 0) + qty_no
				item.raw_weight_kg = (item.raw_weight_kg or 0) + raw_weight_kg
				item.processed_weight_kg = (item.processed_weight_kg or 0) + processed_weight_kg

				# Validate no negative stock
				if item.qty_no < 0:
					frappe.throw(f"Insufficient quantity for {product}. Available: {item.qty_no - qty_no}")
				if item.raw_weight_kg < 0:
					frappe.throw(
						f"Insufficient raw weight for {product}. Available: {item.raw_weight_kg - raw_weight_kg:.2f} kg"
					)
				if item.processed_weight_kg < 0:
					frappe.throw(
						f"Insufficient processed weight for {product}. Available: {item.processed_weight_kg - processed_weight_kg:.2f} kg"
					)

				stock_updated = True
				break

		if not stock_updated:
			# Add new stock item
			self.append(
				"stock_items",
				{
					"product": product,
					"qty_no": qty_no,
					"raw_weight_kg": raw_weight_kg,
					"processed_weight_kg": processed_weight_kg,
				},
			)

		self.save(ignore_permissions=True)

	def update_user_permissions(self):
		"""Create/update user permissions for shop manager"""
		if not self.shop_manager:
			# Remove any existing permissions for this shop
			try:
				frappe.db.delete("User Permission", {"allow": "Shop", "for_value": self.name})
			except Exception:
				pass
			return

		# Check if user permission already exists
		existing = frappe.db.exists(
			"User Permission", {"user": self.shop_manager, "allow": "Shop", "for_value": self.name}
		)

		if not existing:
			try:
				# Create user permission (requires System Manager role)
				# Using ignore_permissions to allow this operation
				frappe.flags.ignore_permissions = True
				user_perm = frappe.get_doc(
					{
						"doctype": "User Permission",
						"user": self.shop_manager,
						"allow": "Shop",
						"for_value": self.name,
						"apply_to_all_doctypes": 1,
					}
				)
				user_perm.insert(ignore_permissions=True)
				frappe.db.commit()

				if frappe.session.user == "Administrator" or "System Manager" in frappe.get_roles():
					frappe.msgprint(f"User permission created for {self.shop_manager} to access {self.name}")
			except Exception as e:
				frappe.log_error(f"Failed to create user permission: {e!s}")
			finally:
				frappe.flags.ignore_permissions = False


@frappe.whitelist()
def get_user_shops():
	"""Get list of shops accessible to current user"""
	user = frappe.session.user

	# System Manager and Administrator have access to all shops
	if user == "Administrator" or "System Manager" in frappe.get_roles(user):
		return frappe.get_all("Shop", fields=["name", "shop_name"], order_by="shop_name")

	# Get shops where user is shop_manager
	shops = frappe.get_all(
		"Shop", filters={"shop_manager": user}, fields=["name", "shop_name"], order_by="shop_name"
	)

	return shops


@frappe.whitelist()
def get_stock_for_product(shop, product):
	"""Get stock details for a specific product in a shop"""
	shop_doc = frappe.get_doc("Shop", shop)
	return shop_doc.get_stock_balance(product)


@frappe.whitelist()
def get_stock_for_shop(shop):
	"""Get products with stock for a shop (used by POS Billing)"""
	# Check if user has access to this shop
	user = frappe.session.user
	if user != "Administrator" and "System Manager" not in frappe.get_roles(user):
		# Check if user is shop manager of this shop
		shop_manager = frappe.db.get_value("Shop", shop, "shop_manager")
		if shop_manager != user:
			frappe.throw("You don't have permission to access this shop")

	shop_doc = frappe.get_doc("Shop", shop)

	products = []
	for stock_item in shop_doc.stock_items:
		if stock_item.processed_weight_kg and stock_item.processed_weight_kg > 0:
			product = frappe.get_doc("Product", stock_item.product)
			products.append(
				{
					"product": stock_item.product,
					"product_name": product.item_name,
					"rate_per_kg": product.base_price or 0,
					"processed_weight_kg": stock_item.processed_weight_kg,
					"qty_no": stock_item.qty_no or 0,
				}
			)

	return products


def has_permission(doc, ptype, user):
	"""Check if user has permission to access this shop"""
	from venus_chicken.permissions import has_shop_permission

	return has_shop_permission(doc, ptype, user)


def get_permission_query_conditions(user):
	"""Filter shops based on user assignment"""
	from venus_chicken.permissions import get_permission_query_conditions

	return get_permission_query_conditions(user)
