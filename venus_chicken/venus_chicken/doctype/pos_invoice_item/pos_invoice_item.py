# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class POSInvoiceItem(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		amount: DF.Currency
		product: DF.Link
		qty_kg: DF.Float
		rate: DF.Currency
	# end: auto-generated types

	pass
