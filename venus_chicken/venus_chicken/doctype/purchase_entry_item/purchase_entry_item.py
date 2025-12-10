# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class PurchaseEntryItem(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		product: DF.Link
		quantity_nos: DF.Int
		rate_per_kg: DF.Currency
		weight_kg: DF.Float
	# end: auto-generated types

	pass
