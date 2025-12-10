# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import add_days, today


def send_daily_stock_alerts():
	"""Send daily stock alerts for low inventory"""
	shops = frappe.get_all("Shop", fields=["name", "shop_manager"])

	for shop in shops:
		low_stock_items = []
		shop_doc = frappe.get_doc("Shop", shop.name)

		for item in shop_doc.stock_items:
			# Alert if processed weight is less than 10 kg
			if item.processed_weight_kg < 10:
				low_stock_items.append({"product": item.product, "available": item.processed_weight_kg})

		if low_stock_items and shop.shop_manager:
			# Send email notification
			message = f"<h3>Low Stock Alert for {shop.name}</h3>"
			message += "<table border='1' cellpadding='5'>"
			message += "<tr><th>Product</th><th>Available Stock (Kg)</th></tr>"

			for item in low_stock_items:
				message += f"<tr><td>{item['product']}</td><td>{item['available']:.2f}</td></tr>"

			message += "</table>"
			message += "<p>Please restock these items.</p>"

			frappe.sendmail(
				recipients=[shop.shop_manager], subject=f"Low Stock Alert - {shop.name}", message=message
			)
