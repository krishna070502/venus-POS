# Copyright (c) 2025, Gopal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Supplier(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		address: DF.SmallText | None
		city: DF.Data | None
		contact_person: DF.Data | None
		credit_days: DF.Int
		email: DF.Data | None
		gstin: DF.Data | None
		mobile_no: DF.Data | None
		pan: DF.Data | None
		payment_terms: DF.Literal["", "Cash", "Credit", "Advance"]
		pincode: DF.Data | None
		state: DF.Data | None
		supplier_name: DF.Data
	# end: auto-generated types

	pass
