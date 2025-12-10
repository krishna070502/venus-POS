# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

"""
Permission queries for shop-based access control
"""

import frappe


def get_user_shops(user=None):
	"""Get list of shops assigned to a user"""
	if not user:
		user = frappe.session.user

	# System Manager and Administrator have access to all shops
	if "System Manager" in frappe.get_roles(user) or user == "Administrator":
		return None  # None means access to all

	# Get shops where user is shop_manager
	shops = frappe.get_all("Shop", filters={"shop_manager": user}, pluck="name")

	return shops if shops else []


@frappe.whitelist()
def has_shop_permission(doc, ptype, user):
	"""
	Check if user has permission to access a shop-related document
	"""
	if not user:
		user = frappe.session.user

	# System Manager and Administrator have full access
	if "System Manager" in frappe.get_roles(user) or user == "Administrator":
		return True

	# Get user's assigned shops
	user_shops = get_user_shops(user)

	# If user has no shops assigned, deny access
	if user_shops == []:
		return False

	# If doc is a string (DocType name), allow if user has any shops
	# The query conditions will handle filtering
	if isinstance(doc, str):
		return len(user_shops) > 0

	# If doc has a shop field, check if it's in user's shops
	if hasattr(doc, "shop"):
		shop = doc.shop
		return shop in user_shops if user_shops else False

	# If doc is Shop itself, check if user is the manager
	if hasattr(doc, "doctype") and doc.doctype == "Shop":
		return doc.name in user_shops if user_shops else False

	return False


def get_permission_query_conditions(user):
	"""
	Return SQL conditions for filtering Shop documents based on user assignment
	"""
	if not user:
		user = frappe.session.user

	# System Manager and Administrator see everything
	if "System Manager" in frappe.get_roles(user) or user == "Administrator":
		return ""

	# Get user's assigned shops
	user_shops = get_user_shops(user)

	# If no shops assigned, show nothing
	if not user_shops:
		return "1=0"

	# Return condition to filter by shop
	shops_str = ", ".join([f"'{shop}'" for shop in user_shops])
	return f"`tabShop`.`name` in ({shops_str})"


def get_shop_based_permission_query_conditions(doctype):
	"""
	Generate permission query for doctypes with shop field
	"""

	def permission_query(user):
		if not user:
			user = frappe.session.user

		# System Manager and Administrator see everything
		if "System Manager" in frappe.get_roles(user) or user == "Administrator":
			return ""

		# Get user's assigned shops
		user_shops = get_user_shops(user)

		# If no shops assigned, show nothing
		if not user_shops:
			return "1=0"

		# Return condition to filter by shop field
		shops_str = ", ".join([f"'{shop}'" for shop in user_shops])
		return f"`tab{doctype}`.`shop` in ({shops_str})"

	return permission_query
