# Venus Chicken - Poultry Shop Management System

A complete Frappe v15 application for managing retail poultry meat shop chains.

## Features

### 1. **Multi-Shop Management**
- Manage multiple retail shops from a central system
- Shop-specific stock tracking and management
- Configurable wastage percentage per shop
- Shop manager assignment

### 2. **Product Management**
- Product master with pricing controls
- Base price and purchase price tracking
- Admin-only price editing for profit protection

### 3. **Point of Sale (POS)**
- Quick invoice creation for walk-in customers
- Real-time stock availability checks
- Automatic calculations for totals
- Support for processed weight (Kg) based sales

### 4. **Stock Management**
- Track quantity (number of hens)
- Track raw weight and processed weight separately
- Automatic wastage calculation on sales
- Stock deduction with validation (no negative stock)
- Daily stock alerts for low inventory

### 5. **Day Settlement**
- Daily cash reconciliation
- Automatic sales totals from POS invoices
- Variance tracking (cash collected vs sales)
- Sales summary with invoice details

### 6. **Role-Based Access Control**
- **System Manager**: Full access to all features
- **Shop Manager**: Access to assigned shop only, view-only prices
- **Cashier**: POS access for assigned shop
- **Stock Keeper**: Stock management for assigned shop

### 7. **Reports**
- **Daily Sales Report**: Invoice-wise sales summary with filters
- **Stock Summary**: Current stock levels across shops with valuation

### 8. **Wastage Calculation**
The system automatically calculates wastage when processing sales:
- Formula: `raw_weight_used = sold_kg / (1 - wastage_pct / 100)`
- Default wastage: 30% (configurable per shop)
- Example: Selling 7 kg processed meat = 10 kg raw weight used (30% wastage)

## Installation

### Prerequisites
- Frappe v15 installed
- Bench initialized with a site

### Install Steps

1. **Get the app** (if not already in apps folder):
   ```bash
   cd /workspace/frappe-bench
   ```

2. **Install on your site**:
   ```bash
   bench --site dev1.frappesite install-app venus_chicken
   ```

3. **Run migrations**:
   ```bash
   bench --site dev1.frappesite migrate
   ```

4. **Build assets**:
   ```bash
   bench build
   ```

5. **Start the server**:
   ```bash
   bench start
   ```

## Setup

### 1. Create Custom Roles
The installation automatically creates three custom roles:
- Shop Manager
- Cashier
- Stock Keeper

### 2. Setup Sample Data
Sample products and shops are automatically created during installation:
- 5 sample products (Chicken Breast, Legs, Wings, Whole, Mince)
- 2 sample shops with initial stock

To manually trigger demo data setup:
```python
bench --site dev1.frappesite console
>>> frappe.call("venus_chicken.install.setup_demo_data")
```

### 3. Create Users and Assign Roles

1. Go to **User** DocType
2. Create users for shop managers, cashiers, stock keepers
3. Assign appropriate roles

### 4. Setup User Permissions

For shop-level access restriction:

1. Go to **User Permissions**
2. Create permission for user:
   - User: [username]
   - Allow: Shop
   - For Value: [Shop Name]

This ensures users can only access their assigned shop.

### 5. Access the Workspace

Navigate to: **Poultry Shop** workspace

## Usage Guide

### Daily Operations

#### 1. **Morning Stock Check**
- Shop Manager/Stock Keeper logs in
- Views **Stock Summary** report
- Checks inventory levels

#### 2. **POS Sales**
- Cashier creates **POS Invoice**
- Selects shop (auto-filtered to their shop)
- Adds products with quantity in Kg
- System shows available stock
- Rate auto-populates from product master
- Submit invoice to update stock

#### 3. **Stock Management**
- Stock Keeper updates stock in **Shop** form
- Uses `update_stock()` method for additions
- System prevents negative stock

#### 4. **End of Day Settlement**
- Shop Manager creates **Day Settlement**
- Selects shop and date
- System calculates total sales from submitted invoices
- Enter cash collected
- System calculates variance
- Review sales summary

### Reports

#### Daily Sales Report
- Filter by date range and shop
- Shows all submitted POS invoices
- Total Kg and Amount per invoice
- Grand totals at bottom

#### Stock Summary
- Real-time stock levels
- Filter by shop or product
- Shows qty, raw weight, processed weight
- Calculated stock value

## API Methods

### Get Stock for Product
```javascript
frappe.call({
    method: "venus_chicken.venus_chicken.doctype.shop.shop.get_stock_for_product",
    args: {
        shop: "Shop Name",
        product: "Product Code"
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

### Get Day Sales Summary
```javascript
frappe.call({
    method: "venus_chicken.venus_chicken.doctype.day_settlement.day_settlement.get_day_sales_summary",
    args: {
        shop: "Shop Name",
        date: "2025-12-08"
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

### Get Product Rate
```javascript
frappe.call({
    method: "venus_chicken.venus_chicken.doctype.pos_invoice.pos_invoice.get_product_rate",
    args: {
        product: "Product Code"
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

## Business Logic

### Stock Update on Sale
When a POS Invoice is submitted:
1. Calculate raw weight used: `raw_weight = sold_kg / (1 - wastage_pct/100)`
2. Deduct processed weight from stock
3. Deduct raw weight from stock
4. Validate sufficient stock exists
5. Throw error if stock insufficient

### Stock Restoration on Cancellation
When a POS Invoice is cancelled:
1. Calculate original raw weight used
2. Add back processed weight to stock
3. Add back raw weight to stock

## Scheduled Tasks

### Daily Stock Alerts
Runs daily to check stock levels:
- Checks all shops for low stock (< 10 kg processed weight)
- Sends email to shop manager with low stock items
- Includes product name and available quantity

## Development

### DocTypes Created
1. **Shop** - Shop master with stock items child table
2. **Shop Stock Item** - Child table for stock tracking
3. **Product** - Product master with pricing
4. **POS Invoice** - Sales invoice with items
5. **POS Invoice Item** - Child table for invoice items
6. **Day Settlement** - Daily cash reconciliation

### File Structure
```
venus_chicken/
├── venus_chicken/
│   ├── doctype/
│   │   ├── shop/
│   │   ├── shop_stock_item/
│   │   ├── product/
│   │   ├── pos_invoice/
│   │   ├── pos_invoice_item/
│   │   └── day_settlement/
│   ├── report/
│   │   ├── daily_sales_report/
│   │   └── stock_summary/
│   ├── workspace/
│   │   └── poultry_shop/
│   └── fixtures/
│       ├── custom_roles.json
│       ├── sample_products.json
│       └── sample_shops.json
├── hooks.py
├── install.py
└── tasks.py
```

## Testing

Run tests:
```bash
bench --site dev1.frappesite run-tests --app venus_chicken
```

Run specific doctype tests:
```bash
bench --site dev1.frappesite run-tests --doctype "POS Invoice"
```

## Troubleshooting

### Stock Not Updating
- Check if invoice is submitted (docstatus = 1)
- Verify wastage percentage is set in shop
- Check browser console for errors

### Permission Issues
- Verify user has correct role assigned
- Check User Permissions for shop access
- Ensure shop is assigned to user

### Reports Not Showing Data
- Check date filters
- Verify invoices are submitted
- Ensure user has permission to view shop

## License

AGPL-3.0

## Credits

Developed for Venus Chicken retail chain by Gopal.
