app_name = "venus_chicken"
app_title = "Venus Chicken"
app_publisher = "Gopal"
app_description = "Custom app for Venus chicken stores"
app_email = "ggkr565457123@gmail.com"
app_license = "agpl-3.0"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "venus_chicken",
# 		"logo": "/assets/venus_chicken/logo.png",
# 		"title": "Venus Chicken",
# 		"route": "/venus_chicken",
# 		"has_permission": "venus_chicken.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/venus_chicken/css/venus_chicken.css"
# app_include_js = "/assets/venus_chicken/js/venus_chicken.js"

# include js, css files in header of web template
# web_include_css = "/assets/venus_chicken/css/venus_chicken.css"
# web_include_js = "/assets/venus_chicken/js/venus_chicken.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "venus_chicken/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "venus_chicken/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "venus_chicken.utils.jinja_methods",
# 	"filters": "venus_chicken.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "venus_chicken.install.before_install"
# after_install = "venus_chicken.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "venus_chicken.uninstall.before_uninstall"
# after_uninstall = "venus_chicken.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "venus_chicken.utils.before_app_install"
# after_app_install = "venus_chicken.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "venus_chicken.utils.before_app_uninstall"
# after_app_uninstall = "venus_chicken.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "venus_chicken.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"venus_chicken.tasks.all"
# 	],
# 	"daily": [
# 		"venus_chicken.tasks.daily"
# 	],
# 	"hourly": [
# 		"venus_chicken.tasks.hourly"
# 	],
# 	"weekly": [
# 		"venus_chicken.tasks.weekly"
# 	],
# 	"monthly": [
# 		"venus_chicken.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "venus_chicken.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "venus_chicken.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "venus_chicken.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["venus_chicken.utils.before_request"]
# after_request = ["venus_chicken.utils.after_request"]

# Job Events
# ----------
# before_job = ["venus_chicken.utils.before_job"]
# after_job = ["venus_chicken.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"venus_chicken.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

