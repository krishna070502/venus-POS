# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


@frappe.whitelist()
def get_available_stock(shop, product, stock_type):
	"""Get available stock for a product in a shop"""
	# Get stock from Shop's child table
	stock = frappe.db.sql(
		"""
		SELECT qty_no, raw_weight_kg, processed_weight_kg
		FROM `tabShop Stock Item`
		WHERE parent = %s AND product = %s
	""",
		(shop, product),
		as_dict=1,
	)

	if stock:
		stock_item = stock[0]
		if stock_type == "Raw Meat":
			return {"quantity_nos": stock_item.qty_no or 0, "quantity_kg": stock_item.raw_weight_kg or 0}
		else:
			return {"quantity_kg": stock_item.processed_weight_kg or 0}
	else:
		if stock_type == "Raw Meat":
			return {"quantity_nos": 0, "quantity_kg": 0}
		else:
			return {"quantity_kg": 0}


class StockTransfer(Document):
	def validate(self):
		"""Validate stock transfer"""
		# Ensure from_shop and to_shop are different
		if self.from_shop == self.to_shop:
			frappe.throw(_("From Shop and To Shop cannot be the same"))

		# Validate stock availability in from_shop
		self.validate_stock_availability()

		# Set transferred_by
		if not self.transferred_by:
			self.transferred_by = frappe.session.user

	def validate_stock_availability(self):
		"""Check if sufficient stock is available in from_shop"""
		for item in self.items:
			# Get stock from Shop Stock Item
			stock = frappe.db.sql(
				"""
				SELECT qty_no, raw_weight_kg, processed_weight_kg
				FROM `tabShop Stock Item`
				WHERE parent = %s AND product = %s
			""",
				(self.from_shop, item.product),
				as_dict=1,
			)

			if not stock:
				frappe.throw(_(f"No stock found for {item.product} in {self.from_shop}"))

			stock_item = stock[0]

			if item.stock_type == "Raw Meat":
				# Check raw stock
				available_kg = stock_item.raw_weight_kg or 0
				available_nos = stock_item.qty_no or 0

				if available_kg < item.quantity_kg:
					frappe.throw(
						_(
							f"Insufficient raw stock for {item.product} in {self.from_shop}. "
							f"Available: {available_kg:.2f} kg, Required: {item.quantity_kg:.2f} kg"
						)
					)

				if item.quantity_nos and available_nos < item.quantity_nos:
					frappe.throw(
						_(
							f"Insufficient raw stock for {item.product} in {self.from_shop}. "
							f"Available: {available_nos} nos, Required: {item.quantity_nos} nos"
						)
					)
			else:
				# Check processed stock
				available_kg = stock_item.processed_weight_kg or 0

				if available_kg < item.quantity_kg:
					frappe.throw(
						_(
							f"Insufficient processed stock for {item.product} in {self.from_shop}. "
							f"Available: {available_kg:.2f} kg, Required: {item.quantity_kg:.2f} kg"
						)
					)

	def on_submit(self):
		"""Transfer stock on submit"""
		self.transfer_stock()
		# Update status using db_set to avoid validation after submit
		self.db_set("status", "Completed")

	def on_cancel(self):
		"""Reverse stock transfer on cancel"""
		self.reverse_stock_transfer()
		# Update status using db_set to avoid validation after cancel
		self.db_set("status", "Cancelled")

	def transfer_stock(self):
		"""Transfer stock from one shop to another"""
		for item in self.items:
			if item.stock_type == "Raw Meat":
				# Transfer Raw Stock
				self.update_raw_stock(
					shop=self.from_shop,
					product=item.product,
					quantity_nos=-item.quantity_nos if item.quantity_nos else 0,
					quantity_kg=-item.quantity_kg,
					operation="Transfer Out",
				)
				self.update_raw_stock(
					shop=self.to_shop,
					product=item.product,
					quantity_nos=item.quantity_nos if item.quantity_nos else 0,
					quantity_kg=item.quantity_kg,
					operation="Transfer In",
				)
			else:
				# Transfer Processed Stock
				self.update_processed_stock(
					shop=self.from_shop,
					product=item.product,
					quantity_kg=-item.quantity_kg,
					operation="Transfer Out",
				)
				self.update_processed_stock(
					shop=self.to_shop,
					product=item.product,
					quantity_kg=item.quantity_kg,
					operation="Transfer In",
				)

	def reverse_stock_transfer(self):
		"""Reverse stock transfer (on cancel)"""
		for item in self.items:
			if item.stock_type == "Raw Meat":
				# Reverse Raw Stock transfer
				self.update_raw_stock(
					shop=self.from_shop,
					product=item.product,
					quantity_nos=item.quantity_nos if item.quantity_nos else 0,
					quantity_kg=item.quantity_kg,
					operation="Transfer Reversal - In",
				)
				self.update_raw_stock(
					shop=self.to_shop,
					product=item.product,
					quantity_nos=-item.quantity_nos if item.quantity_nos else 0,
					quantity_kg=-item.quantity_kg,
					operation="Transfer Reversal - Out",
				)
			else:
				# Reverse Processed Stock transfer
				self.update_processed_stock(
					shop=self.from_shop,
					product=item.product,
					quantity_kg=item.quantity_kg,
					operation="Transfer Reversal - In",
				)
				self.update_processed_stock(
					shop=self.to_shop,
					product=item.product,
					quantity_kg=-item.quantity_kg,
					operation="Transfer Reversal - Out",
				)

	def update_raw_stock(self, shop, product, quantity_nos, quantity_kg, operation):
		"""Update raw stock in Shop Stock Item"""
		# Get shop document
		shop_doc = frappe.get_doc("Shop", shop)

		# Find the stock item
		stock_item = None
		for item in shop_doc.stock_items:
			if item.product == product:
				stock_item = item
				break

		if stock_item:
			# Update existing stock
			new_qty_no = (stock_item.qty_no or 0) + quantity_nos
			new_raw_weight = (stock_item.raw_weight_kg or 0) + quantity_kg

			if new_raw_weight < 0 or new_qty_no < 0:
				frappe.throw(_(f"Cannot {operation}: Insufficient raw stock for {product} in {shop}"))

			stock_item.qty_no = new_qty_no
			stock_item.raw_weight_kg = new_raw_weight
		else:
			# Create new stock item (only for transfer in)
			if quantity_kg > 0:
				shop_doc.append(
					"stock_items",
					{
						"product": product,
						"qty_no": quantity_nos,
						"raw_weight_kg": quantity_kg,
						"processed_weight_kg": 0,
					},
				)
			else:
				frappe.throw(_(f"Cannot {operation}: No stock record found for {product} in {shop}"))

		shop_doc.save(ignore_permissions=True)

	def update_processed_stock(self, shop, product, quantity_kg, operation):
		"""Update processed stock in Shop Stock Item"""
		# Get shop document
		shop_doc = frappe.get_doc("Shop", shop)

		# Find the stock item
		stock_item = None
		for item in shop_doc.stock_items:
			if item.product == product:
				stock_item = item
				break

		if stock_item:
			# Update existing stock
			new_processed_weight = (stock_item.processed_weight_kg or 0) + quantity_kg

			if new_processed_weight < 0:
				frappe.throw(_(f"Cannot {operation}: Insufficient processed stock for {product} in {shop}"))

			stock_item.processed_weight_kg = new_processed_weight
		else:
			# Create new stock item (only for transfer in)
			if quantity_kg > 0:
				shop_doc.append(
					"stock_items",
					{"product": product, "qty_no": 0, "raw_weight_kg": 0, "processed_weight_kg": quantity_kg},
				)
			else:
				frappe.throw(_(f"Cannot {operation}: No stock record found for {product} in {shop}"))

		shop_doc.save(ignore_permissions=True)
