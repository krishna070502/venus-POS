# Venus Chicken - Quick Start Guide

## 🎯 What's Been Created

A complete, production-ready Frappe v15 app for managing a chain of poultry retail shops with:

✅ **6 DocTypes** (Shop, Product, POS Invoice, Day Settlement + child tables)
✅ **Role-based permissions** (Shop Manager, Cashier, Stock Keeper)
✅ **Automated stock management** with wastage calculation
✅ **POS system** with real-time stock validation
✅ **2 Reports** (Daily Sales, Stock Summary)
✅ **Workspace** with shortcuts and charts
✅ **Sample data** (5 products, 2 shops with stock)
✅ **Scheduled tasks** (daily stock alerts)
✅ **Complete business logic** for sales and settlements

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Build Assets
```bash
cd /workspace/frappe-bench
bench build --app venus_chicken
```

### Step 2: Start Development Server
```bash
bench start
```

### Step 3: Access the Application
Open your browser to: **http://localhost:8000**

Login with Administrator credentials.

### Step 4: Navigate to Workspace
Go to: **Desk → Poultry Shop** workspace

---

## 📊 Initial Setup

### Create Sample Data (Optional)
The app automatically creates sample data on installation, including:
- 5 Products (Chicken Breast, Legs, Wings, Whole, Mince)
- 2 Shops with initial stock

To manually trigger sample data setup:
```bash
bench --site dev1.frappesite console
```
Then run:
```python
frappe.call("venus_chicken.install.setup_demo_data")
frappe.db.commit()
```

---

## 👥 User Setup

### 1. Create Shop Manager User
1. Go to **User List**
2. Create new user: `shopmanager1@example.com`
3. Assign role: **Shop Manager**
4. Set up **User Permission**:
   - Allow: **Shop**
   - For Value: **Venus Main Branch**

### 2. Create Cashier User
1. Create user: `cashier1@example.com`
2. Assign role: **Cashier**
3. Set up **User Permission** for their shop

### 3. Create Stock Keeper User
1. Create user: `stockkeeper1@example.com`
2. Assign role: **Stock Keeper**
3. Set up **User Permission** for their shop

---

## 🛒 Daily Workflow

### Morning: Check Stock
1. Login as **Shop Manager** or **Stock Keeper**
2. Navigate to **Poultry Shop** workspace
3. Click **Stock Summary** report
4. Filter by your shop
5. Review inventory levels

### During Day: POS Sales
1. Login as **Cashier**
2. Create new **POS Invoice**
3. Select shop (auto-filtered to assigned shop)
4. Add items:
   - Select product
   - Enter quantity in Kg
   - Rate auto-populates
   - Stock availability shown in real-time
5. Submit invoice
6. Stock automatically deducted with wastage calculation

### Evening: Day Settlement
1. Login as **Shop Manager**
2. Create **Day Settlement**
3. Select shop and date
4. System calculates total sales
5. Enter cash collected
6. View variance
7. Click "Sales Summary" for detailed breakdown

---

## 🧮 How Wastage Works

**Formula**: `raw_weight_used = sold_kg / (1 - wastage_pct / 100)`

**Example** (30% wastage):
- Customer buys: **7 kg** processed meat
- Raw weight used: 7 / (1 - 0.30) = **10 kg**
- Wastage: 10 - 7 = **3 kg** (30%)

Stock deduction:
- ✅ Processed weight: -7 kg
- ✅ Raw weight: -10 kg

---

## 📈 Reports & Analytics

### Daily Sales Report
**Path**: Reports → Daily Sales Report

**Features**:
- Filter by date range
- Filter by shop
- Shows all submitted invoices
- Total Kg and Amount
- Export to Excel/PDF

**Usage**:
```
From Date: 2025-12-01
To Date: 2025-12-08
Shop: Venus Main Branch
```

### Stock Summary
**Path**: Reports → Stock Summary

**Features**:
- Real-time stock levels
- Filter by shop/product
- Shows qty, raw weight, processed weight
- Calculated stock value
- Low stock highlighting

---

## 🎨 Key Features Demo

### 1. Test POS Invoice
```
Shop: Venus Main Branch
Product: CHK-BREAST
Qty: 2.5 kg
Rate: ₹280 (auto-filled)
Amount: ₹700 (auto-calculated)
```

Submit → Stock updated automatically!

### 2. Test Stock Validation
Try selling more than available stock:
- System will show error
- "Insufficient stock for CHK-BREAST. Available: X kg, Required: Y kg"

### 3. Test Day Settlement
```
Shop: Venus Main Branch
Date: Today
Total Sales: ₹5,000 (auto-calculated)
Cash Collected: ₹4,950
Variance: ₹50 (highlighted in red)
```

### 4. View Sales Summary
Click "Sales Summary" button in Day Settlement to see:
- All invoices for the day
- Time-wise breakdown
- Customer names
- Total Kg sold

---

## 🔒 Permissions Matrix

| Feature | System Manager | Shop Manager | Cashier | Stock Keeper |
|---------|---------------|--------------|---------|--------------|
| Create Products | ✅ | ❌ | ❌ | ❌ |
| Edit Prices | ✅ | ❌ | ❌ | ❌ |
| Create POS Invoice | ✅ | ✅ | ✅ | ❌ |
| View All Shops | ✅ | ❌ | ❌ | ❌ |
| Manage Stock | ✅ | ✅ | ❌ | ✅ |
| Day Settlement | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ❌ | ✅ |

---

## 🔧 Customization

### Change Wastage Percentage
1. Open **Shop** document
2. Update "Default Wastage %" field
3. Save
4. New sales will use updated percentage

### Add New Products
1. Go to **Product** list
2. Create new product
3. Set item code, name, prices
4. Products immediately available in POS

### Add Stock
1. Open **Shop** document
2. In "Stock Items" table, add row:
   - Product: Select product
   - Qty: Number of hens
   - Raw Weight: Total raw kg
   - Processed Weight: Total processed kg
3. Save

---

## 📧 Scheduled Alerts

**Daily Stock Alert** runs every day at configured time:
- Checks all shops for low stock (< 10 kg)
- Sends email to shop manager
- Lists products with available quantity
- Action: Restock items

To test manually:
```python
bench --site dev1.frappesite console
>>> from venus_chicken.tasks import send_daily_stock_alerts
>>> send_daily_stock_alerts()
```

---

## 🐛 Troubleshooting

### Stock Not Updating
**Issue**: POS Invoice submitted but stock not deducted
**Solution**:
- Check invoice docstatus = 1 (submitted)
- Verify wastage % is set in shop
- Check console for errors

### Permission Denied
**Issue**: User can't access shop
**Solution**:
- Verify role assigned to user
- Check User Permission is created:
  - User: username
  - Allow: Shop
  - For Value: Shop Name
- Logout and login again

### Reports Empty
**Issue**: No data in reports
**Solution**:
- Ensure invoices are submitted (not draft)
- Check date filters
- Verify user has permission to view shop

### Import Error After Migration
**Issue**: Cannot import DocTypes
**Solution**:
```bash
bench --site dev1.frappesite clear-cache
bench restart
```

---

## 📂 File Structure

```
venus_chicken/
├── venus_chicken/
│   ├── doctype/
│   │   ├── shop/                    # Shop master
│   │   ├── shop_stock_item/         # Stock tracking
│   │   ├── product/                 # Product master
│   │   ├── pos_invoice/             # POS sales
│   │   ├── pos_invoice_item/        # Invoice line items
│   │   └── day_settlement/          # Daily reconciliation
│   ├── report/
│   │   ├── daily_sales_report/      # Sales analytics
│   │   └── stock_summary/           # Inventory report
│   ├── workspace/
│   │   └── poultry_shop/            # Main workspace
│   └── fixtures/                    # Sample data
├── hooks.py                         # App configuration
├── install.py                       # Setup scripts
└── tasks.py                         # Scheduled jobs
```

---

## 🎓 Next Steps

### Production Deployment
1. Set `developer_mode: 0` in site_config.json
2. Run `bench build --production`
3. Configure production database
4. Set up SSL certificates
5. Configure email settings for alerts

### Advanced Features to Add
- **Barcode scanning** for products
- **Customer loyalty program**
- **Supplier management**
- **Purchase orders**
- **Delivery tracking**
- **Mobile POS app**

### Integration Options
- Payment gateway for digital payments
- SMS alerts for low stock
- WhatsApp notifications
- Accounting system integration

---

## 📞 Support

For issues or questions:
1. Check error logs: `bench --site dev1.frappesite logs`
2. Review Frappe documentation: https://frappeframework.com/docs
3. Check this README and SETUP_GUIDE.md

---

## ✅ Success Checklist

- [ ] App installed: `bench list-apps` shows venus_chicken
- [ ] DocTypes created: Can access Shop, Product, POS Invoice
- [ ] Sample data loaded: 5 products and 2 shops exist
- [ ] Workspace accessible: "Poultry Shop" appears in desk
- [ ] POS works: Can create and submit invoice
- [ ] Stock updates: Inventory reduces after sale
- [ ] Reports work: Can view Daily Sales and Stock Summary
- [ ] Permissions work: Shop-level access restricted
- [ ] Settlement works: Can reconcile daily cash

**Status**: ✅ ALL SYSTEMS READY!

---

**Built with ❤️ for Venus Chicken retail chain**
