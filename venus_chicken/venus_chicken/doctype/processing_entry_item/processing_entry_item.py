# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class ProcessingEntryItem(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		processed_weight_out_kg: DF.Float
		product: DF.Link
		qty_in_nos: DF.Int
		raw_weight_in_kg: DF.Float
		wastage_kg: DF.Float
		wastage_pct: DF.Percent
		wastage_status: DF.Data | None
	# end: auto-generated types

	pass
