# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class ShopStockItem(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		processed_weight_kg: DF.Float
		product: DF.Link
		qty_no: DF.Float
		raw_weight_kg: DF.Float
	# end: auto-generated types

	pass
