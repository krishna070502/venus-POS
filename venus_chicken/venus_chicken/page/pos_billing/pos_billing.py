# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import now, today


@frappe.whitelist()
def create_pos_invoice(shop, items, payment_mode, cash_received=0, change_amount=0):
	# Get shop details for receipt
	shop_doc = frappe.get_doc("Shop", shop)
	shop_info = {
		"phone": shop_doc.get("phone_number") or "",
		"address": shop_doc.get("address") or "",
		"location": shop_doc.get("location") or "",
	}
	"""Create POS Invoice from POS Billing page"""
	items = frappe.parse_json(items)

	# Create POS Invoice
	invoice = frappe.get_doc(
		{
			"doctype": "POS Invoice",
			"shop": shop,
			"posting_date": today(),
			"posting_time": now(),
			"items": items,
			"payment_mode": payment_mode,
			"cash_received": float(cash_received),
			"change_amount": float(change_amount),
		}
	)

	invoice.insert()
	invoice.submit()

	return {
		"name": invoice.name,
		"shop": invoice.shop,
		"items": invoice.items,
		"total_amount": invoice.total_amount,
		"payment_mode": invoice.payment_mode,
		"shop_info": shop_info,
	}


def get_stock_for_shop(shop):
	"""Get products with stock for a shop"""
	shop_doc = frappe.get_doc("Shop", shop)

	products = []
	for stock_item in shop_doc.stock_items:
		if stock_item.processed_weight_kg and stock_item.processed_weight_kg > 0:
			product = frappe.get_doc("Product", stock_item.product)
			products.append(
				{
					"product": stock_item.product,
					"product_name": product.item_name,
					"rate_per_kg": product.rate_per_kg,
					"processed_weight_kg": stock_item.processed_weight_kg,
					"qty_no": stock_item.qty_no,
				}
			)

	return products
