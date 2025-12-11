frappe.pages['pos-billing'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'POS Billing',
		single_column: true
	});

	new POSBilling(wrapper, page);
}

class POSBilling {
	constructor(wrapper, page) {
		this.wrapper = wrapper;
		this.page = page;
		this.cart_items = [];
		this.total_amount = 0;
		
		this.setup_page();
		this.load_shop_data();
	}

	setup_page() {
		this.payment_mode = 'Cash'; // Default payment mode
		
		// Hide Frappe navbar and page head for full-screen POS
		$('header.navbar').hide();
		$('.page-head').hide();
		$('.container.page-body').css({'margin-top': '0', 'padding': '0'});
		$('body').css('overflow', 'hidden');
		
		// Restore on page unload
		$(window).on('beforeunload', function() {
			$('header.navbar').show();
			$('.page-head').show();
		});
		
		// Add custom CSS for enterprise styling with responsive design
		$('head').append(`
			<style>
				/* Base Styles */
				.pos-container * { box-sizing: border-box; }
				
				/* Full Screen Mode */
				body.pos-fullscreen .navbar,
				body.pos-fullscreen .page-head,
				body.pos-fullscreen .page-head-wrapper { display: none !important; }
				body.pos-fullscreen { overflow: hidden !important; }
				body.pos-fullscreen .container.page-body { margin-top: 0 !important; padding: 0 !important; }
				body.pos-fullscreen .layout-main { padding: 0 !important; }
				body.pos-fullscreen .frappe-control { margin: 0 !important; }
				
				/* Main Container */
				.pos-container {
					height: 100vh;
					padding: 16px;
					background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					z-index: 1000;
				}
				
				/* Header Styles */
				.pos-header { 
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					padding: 16px 24px;
					border-radius: 16px;
					margin-bottom: 16px;
					box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
					position: relative;
					overflow: hidden;
				}
				.btn-exit-pos:hover {
					background: rgba(255,255,255,0.35) !important;
					transform: scale(1.05);
				}
				.pos-header::before {
					content: '';
					position: absolute;
					top: -50%;
					right: -50%;
					width: 100%;
					height: 200%;
					background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
					pointer-events: none;
				}
				.pos-header h2 {
					font-size: 1.5rem;
					font-weight: 800;
					letter-spacing: -0.5px;
				}
				
				/* Panel Styles */
				.pos-panel {
					background: white;
					border-radius: 16px;
					box-shadow: 0 4px 24px rgba(0,0,0,0.06);
					border: 1px solid rgba(0,0,0,0.04);
					overflow: hidden;
				}
				
				/* Product Card Styles */
				.product-card {
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					border: 2px solid #e8eaf6 !important;
					cursor: pointer;
					position: relative;
					overflow: hidden;
				}
				.product-card::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					height: 4px;
					background: linear-gradient(90deg, #667eea, #764ba2);
					transform: scaleX(0);
					transition: transform 0.3s ease;
				}
				.product-card:hover::before {
					transform: scaleX(1);
				}
				.product-card:hover {
					transform: translateY(-6px);
					box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2) !important;
					border-color: #667eea !important;
				}
				.product-card:active {
					transform: translateY(-2px) scale(0.98);
				}
				
				/* Cart Item Styles */
				.cart-item {
					transition: all 0.2s ease;
					border-left: 4px solid transparent !important;
					position: relative;
				}
				.cart-item:hover {
					border-left-color: #667eea !important;
					background: linear-gradient(90deg, #f8f9ff 0%, white 100%) !important;
				}
				
				/* Numpad Styles */
				.numpad-btn {
					transition: all 0.15s ease;
					border: 2px solid #e5e7eb !important;
					background: white !important;
					font-weight: 700 !important;
					font-size: 1.25rem !important;
					border-radius: 12px !important;
				}
				.numpad-btn:hover {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
					color: white !important;
					border-color: transparent !important;
					transform: scale(1.08);
					box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
				}
				.numpad-btn:active {
					transform: scale(0.95);
				}
				
				/* Payment Mode Buttons */
				.payment-mode-btn {
					transition: all 0.25s ease;
					border: 2px solid transparent !important;
					font-weight: 600 !important;
					border-radius: 10px !important;
				}
				.payment-mode-btn.active {
					box-shadow: 0 6px 20px rgba(0,0,0,0.15);
					transform: scale(1.03);
				}
				
				/* Checkout Button */
				.checkout-btn {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
					border: none !important;
					transition: all 0.3s ease !important;
					font-weight: 700 !important;
					letter-spacing: 0.3px;
					text-transform: uppercase;
					font-size: 0.95rem !important;
				}
				.checkout-btn:hover:not(:disabled) {
					transform: translateY(-3px);
					box-shadow: 0 12px 28px rgba(102, 126, 234, 0.45) !important;
				}
				.checkout-btn:disabled {
					opacity: 0.5;
					background: #9ca3af !important;
				}
				
				/* Quantity Controls */
				.qty-controls .btn {
					background: #f3f4f6 !important;
					border: 2px solid #e5e7eb !important;
					color: #667eea !important;
					font-weight: 700 !important;
					width: 36px !important;
					height: 36px !important;
					border-radius: 10px !important;
					transition: all 0.2s ease !important;
					padding: 0 !important;
					display: inline-flex !important;
					align-items: center !important;
					justify-content: center !important;
				}
				.qty-controls .btn:hover {
					background: #667eea !important;
					color: white !important;
					border-color: #667eea !important;
					transform: scale(1.15);
				}
				
				/* Cart Badge */
				.cart-count {
					background: linear-gradient(135deg, #f43f5e, #e11d48);
					color: white;
					padding: 4px 12px;
					border-radius: 20px;
					font-size: 13px;
					font-weight: 700;
					min-width: 28px;
					text-align: center;
					box-shadow: 0 2px 8px rgba(244, 63, 94, 0.3);
				}
				
				/* Search Box */
				.search-box {
					border: 2px solid #e8eaf6;
					border-radius: 12px;
					padding: 14px 18px;
					font-size: 15px;
					transition: all 0.3s ease;
					background: #fafbfc;
				}
				.search-box:focus {
					border-color: #667eea;
					box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
					outline: none;
					background: white;
				}
				
				/* Stock Badges */
				.badge-stock {
					background: linear-gradient(135deg, #10b981, #059669);
					color: white;
					padding: 6px 14px;
					border-radius: 20px;
					font-size: 11px;
					font-weight: 700;
					letter-spacing: 0.3px;
					box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
				}
				.badge-out-stock {
					background: linear-gradient(135deg, #ef4444, #dc2626);
					color: white;
					padding: 6px 14px;
					border-radius: 20px;
					font-size: 11px;
					font-weight: 700;
					box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
				}
				
				/* Remove Button */
				.remove-item {
					transition: all 0.2s ease !important;
					border-radius: 8px !important;
				}
				.remove-item:hover {
					transform: scale(1.1);
					background: #dc2626 !important;
					box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
				}
				
				/* Scrollbar Styling */
				.cart-items::-webkit-scrollbar,
				.products-grid-wrapper::-webkit-scrollbar {
					width: 6px;
				}
				.cart-items::-webkit-scrollbar-track,
				.products-grid-wrapper::-webkit-scrollbar-track {
					background: #f1f1f1;
					border-radius: 10px;
				}
				.cart-items::-webkit-scrollbar-thumb,
				.products-grid-wrapper::-webkit-scrollbar-thumb {
					background: linear-gradient(180deg, #667eea, #764ba2);
					border-radius: 10px;
				}
				
				/* Responsive Layout */
				.pos-main-layout {
					display: grid;
					grid-template-columns: 300px 1fr 360px;
					gap: 16px;
					height: calc(100vh - 120px);
				}
				
				/* Large tablets & laptops (1200px - 1400px) */
				@media (max-width: 1400px) {
					.pos-main-layout {
						grid-template-columns: 280px 1fr 340px;
						gap: 12px;
						height: calc(100vh - 110px);
					}
					.pos-header h2 { font-size: 1.3rem; }
					.product-card { padding: 16px !important; }
				}
				
				/* Medium screens (1024px - 1200px) */
				@media (max-width: 1200px) {
					.pos-main-layout {
						grid-template-columns: 240px 1fr 300px;
						gap: 10px;
						height: calc(100vh - 95px);
					}
					.pos-container { padding: 10px; }
					.pos-header { padding: 12px 18px; margin-bottom: 10px; }
					.numpad-btn { padding: 12px !important; font-size: 1rem !important; }
					.product-card { padding: 14px !important; }
					.products-grid { gap: 10px !important; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important; }
				}
				
				/* Tablet landscape (900px - 1024px) */
				@media (max-width: 1024px) {
					.pos-container { padding: 8px; height: 100vh; }
					.pos-header { padding: 10px 14px; margin-bottom: 8px; border-radius: 10px; }
					.pos-header h2 { font-size: 1.1rem; }
					.pos-header p { display: none; }
					.pos-main-layout {
						grid-template-columns: 220px 1fr 280px;
						gap: 8px;
						height: calc(100vh - 70px);
					}
					.pos-panel { padding: 12px !important; border-radius: 10px !important; }
					.numpad-btn { padding: 10px !important; font-size: 0.95rem !important; border-radius: 8px !important; }
					.numpad { gap: 6px !important; }
					.product-card { padding: 10px !important; border-radius: 10px !important; }
					.product-card > div:first-child { font-size: 36px !important; margin-bottom: 6px !important; }
					.product-card h5 { font-size: 12px !important; margin-bottom: 4px !important; }
					.products-grid { gap: 8px !important; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; }
					.cart-items { margin-bottom: 10px !important; }
					.summary-card { padding: 12px !important; margin-bottom: 10px !important; }
					.checkout-btn { padding: 12px !important; font-size: 0.85rem !important; }
					.clear-cart-btn { padding: 10px !important; }
					.payment-amount-input { font-size: 22px !important; padding: 10px !important; }
					.shop-selector, .payment-mode-selector { margin-bottom: 12px !important; }
					.payment-mode-btn { padding: 10px 8px !important; font-size: 12px !important; }
					.change-display { padding: 10px !important; margin-top: 10px !important; }
					.change-display .change-amount { font-size: 18px !important; }
				}
				
				/* Tablet portrait (768px - 900px) */
				@media (max-width: 900px) {
					.pos-container { padding: 6px; }
					.pos-header { padding: 8px 12px; margin-bottom: 6px; }
					.pos-header h2 { font-size: 1rem; }
					.pos-main-layout {
						grid-template-columns: 200px 1fr 240px;
						gap: 6px;
						height: calc(100vh - 60px);
					}
					.pos-panel { padding: 10px !important; }
					.numpad-btn { padding: 8px !important; font-size: 0.9rem !important; }
					.numpad { gap: 4px !important; }
					.product-card { padding: 8px !important; }
					.product-card > div:first-child { font-size: 28px !important; margin-bottom: 4px !important; }
					.product-card h5 { font-size: 11px !important; line-height: 1.2 !important; }
					.product-card .badge-stock, .product-card .badge-out-stock { font-size: 9px !important; padding: 4px 8px !important; }
					.products-grid { gap: 6px !important; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important; }
					.cart-items { margin-bottom: 8px !important; }
					.cart-item { padding: 8px !important; }
					.summary-card { padding: 10px !important; margin-bottom: 8px !important; }
					.checkout-btn { padding: 10px !important; font-size: 0.8rem !important; margin-bottom: 6px !important; }
					.clear-cart-btn { padding: 8px !important; font-size: 12px !important; }
					.payment-amount-input { font-size: 18px !important; padding: 8px !important; }
					.shop-selector, .payment-mode-selector { margin-bottom: 10px !important; }
					.payment-mode-btn { padding: 8px 6px !important; font-size: 11px !important; }
					#shop-select { padding: 8px 10px !important; font-size: 12px !important; }
					.btn-exit-pos { width: 36px !important; height: 36px !important; }
					.change-display { padding: 8px !important; margin-top: 8px !important; }
					.change-display .change-amount { font-size: 16px !important; }
					.search-box { padding: 10px 12px !important; font-size: 13px !important; }
				}
				
				/* Small tablet / Large phone (below 768px) - 2 column layout */
				@media (max-width: 768px) {
					.pos-main-layout {
						grid-template-columns: 1fr 220px;
						grid-template-rows: 1fr;
						height: calc(100vh - 55px);
					}
					.numpad-panel { display: none !important; }
					.cart-panel { grid-row: 1 / -1; }
					.pos-header { padding: 6px 10px; margin-bottom: 5px; }
					.pos-header h2 { font-size: 0.9rem; }
				}
				
				/* Dialog/Modal styles for tablets */
				.modal-dialog.tablet-optimized {
					max-height: 90vh !important;
					margin: 5vh auto !important;
				}
				.modal-dialog.tablet-optimized .modal-body {
					max-height: calc(90vh - 120px) !important;
					overflow-y: auto !important;
					padding: 12px !important;
				}
				@media (max-width: 1024px) {
					.modal-dialog { max-width: 85vw !important; margin: 2vh auto !important; }
					.modal-content { border-radius: 12px !important; }
					.modal-header { padding: 12px 16px !important; }
					.modal-body { padding: 12px 16px !important; max-height: calc(96vh - 130px) !important; overflow-y: auto !important; }
					.modal-footer { padding: 10px 16px !important; }
					.modal-title { font-size: 16px !important; }
					.quick-numpad { gap: 6px !important; }
					.quick-numpad .btn { padding: 10px !important; font-size: 16px !important; }
				}
				@media (max-width: 900px) {
					.modal-dialog { max-width: 90vw !important; margin: 1vh auto !important; }
					.modal-body { padding: 10px !important; max-height: calc(98vh - 110px) !important; }
					.modal-header { padding: 10px 12px !important; }
					.modal-footer { padding: 8px 12px !important; }
					.quick-numpad { gap: 4px !important; }
					.quick-numpad .btn { padding: 8px !important; font-size: 14px !important; }
				}
				
				/* Animation Keyframes */
				@keyframes slideIn {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
				@keyframes pulse {
					0%, 100% { transform: scale(1); }
					50% { transform: scale(1.05); }
				}
				.cart-item {
					animation: slideIn 0.3s ease;
				}
				
				/* Total Amount Highlight */
				.total-amount-display {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
				}
				
				/* Shop Selector */
				#shop-select {
					border: 2px solid #e8eaf6;
					border-radius: 10px;
					padding: 12px 14px;
					font-size: 14px;
					font-weight: 600;
					transition: all 0.3s ease;
					cursor: pointer;
					background: white;
					color: #1f2937;
					-webkit-appearance: none;
					-moz-appearance: none;
					appearance: none;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: right 12px center;
					padding-right: 36px;
				}
				#shop-select option {
					color: #1f2937;
					background: white;
					padding: 10px;
					font-weight: 500;
				}
				#shop-select:focus {
					border-color: #667eea;
					box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
					outline: none;
				}
				
				/* Summary Card */
				.summary-card {
					background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
					border-radius: 14px;
					padding: 18px;
					border: 1px solid #e2e8f0;
				}
				
				/* Change Display */
				.change-display {
					background: linear-gradient(135deg, #10b981 0%, #059669 100%);
					border-radius: 12px;
					padding: 16px;
					color: white;
					box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
				}
			</style>
		`);
		
		// Create main layout with enterprise design
		$(this.wrapper).find('.layout-main-section').html(`
			<div class="pos-container">
				<!-- Header -->
				<div class="pos-header">
					<div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
						<div style="display: flex; align-items: center; gap: 16px;">
							<button class="btn-exit-pos" onclick="frappe.set_route('/')" style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;" title="Exit POS">
								<i class="fa fa-arrow-left" style="color: white; font-size: 18px;"></i>
							</button>
							<div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
								🍗
							</div>
							<div>
								<h2 style="margin: 0; font-weight: 800;">POS Billing</h2>
								<p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 13px; font-weight: 500;">Venus Chicken Management System</p>
							</div>
						</div>
						<div style="display: flex; align-items: center; gap: 24px;">
							<div style="text-align: right;">
								<div style="font-size: 13px; opacity: 0.9; font-weight: 500;">
									<i class="fa fa-user-circle" style="margin-right: 6px;"></i>${frappe.session.user_fullname || frappe.session.user}
								</div>
								<div style="font-size: 12px; opacity: 0.75; margin-top: 4px;">
									<i class="fa fa-calendar" style="margin-right: 6px;"></i>${frappe.datetime.str_to_user(frappe.datetime.now_date())}
								</div>
							</div>
							<div class="live-clock" style="width: 44px; height: 44px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Current Time">
								<i class="fa fa-clock-o" style="font-size: 18px;"></i>
							</div>
						</div>
					</div>
				</div>

				<!-- Main Grid Layout -->
				<div class="pos-main-layout">
					<!-- Left Panel - Payment & Numpad -->
					<div class="pos-panel numpad-panel" style="padding: 20px; display: flex; flex-direction: column;">
						<div class="shop-selector" style="margin-bottom: 20px;">
							<label style="font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
								<i class="fa fa-store" style="color: #667eea;"></i> Select Shop
							</label>
							<select class="form-control" id="shop-select">
								<option value="">Choose a shop...</option>
							</select>
						</div>
						
						<div class="payment-mode-selector" style="margin-bottom: 20px; display: none;">
							<label style="font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
								<i class="fa fa-credit-card" style="color: #667eea;"></i> Payment Mode
							</label>
							<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
								<button class="btn btn-success payment-mode-btn active" data-mode="Cash" style="padding: 14px 12px; font-size: 13px;">
									<i class="fa fa-money" style="margin-right: 6px;"></i>Cash
								</button>
								<button class="btn btn-info payment-mode-btn" data-mode="UPI" style="padding: 14px 12px; font-size: 13px;">
									<i class="fa fa-mobile" style="margin-right: 6px;"></i>UPI
								</button>
							</div>
						</div>
						
						<div class="payment-input-section" style="display: none; flex: 1; display: flex; flex-direction: column;">
							<div style="margin-bottom: 16px;">
								<label style="font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
									<i class="fa fa-inr" style="color: #667eea;"></i> Amount Received
								</label>
								<input type="text" class="form-control payment-amount-input" placeholder="₹ 0.00" 
									style="font-size: 28px; padding: 14px; text-align: right; font-weight: 800; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e8eaf6; border-radius: 12px; color: #667eea;" readonly>
							</div>
							
							<!-- Numpad -->
							<div class="numpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; flex: 1;">
								<button class="btn numpad-btn" data-value="7" style="padding: 16px;">7</button>
								<button class="btn numpad-btn" data-value="8" style="padding: 16px;">8</button>
								<button class="btn numpad-btn" data-value="9" style="padding: 16px;">9</button>
								<button class="btn numpad-btn" data-value="4" style="padding: 16px;">4</button>
								<button class="btn numpad-btn" data-value="5" style="padding: 16px;">5</button>
								<button class="btn numpad-btn" data-value="6" style="padding: 16px;">6</button>
								<button class="btn numpad-btn" data-value="1" style="padding: 16px;">1</button>
								<button class="btn numpad-btn" data-value="2" style="padding: 16px;">2</button>
								<button class="btn numpad-btn" data-value="3" style="padding: 16px;">3</button>
								<button class="btn numpad-btn" data-value="0" style="padding: 16px;">0</button>
								<button class="btn numpad-btn" data-value="00" style="padding: 16px; font-size: 1rem !important;">00</button>
								<button class="btn btn-warning numpad-clear" style="padding: 16px; border-radius: 12px !important; font-weight: 700;">
									<i class="fa fa-backspace"></i>
								</button>
							</div>
							
							<div class="change-display" style="margin-top: 16px; display: none;">
								<div style="display: flex; justify-content: space-between; align-items: center;">
									<span style="font-weight: 600; font-size: 14px;"><i class="fa fa-exchange" style="margin-right: 8px;"></i>Change to Return</span>
									<span class="change-amount" style="font-weight: 800; font-size: 24px;">₹0.00</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Middle Panel - Products -->
					<div class="pos-panel products-panel" style="padding: 20px; display: flex; flex-direction: column; min-width: 0;">
						<div style="margin-bottom: 16px;">
							<input type="text" class="form-control search-box" id="product-search" placeholder="🔍 Search products by name...">
						</div>
						<div class="products-grid-wrapper" style="flex: 1; overflow-y: auto; padding-right: 6px;">
							<div class="products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px;">
								<!-- Products will be loaded here -->
							</div>
						</div>
					</div>

					<!-- Right Panel - Cart -->
					<div class="pos-panel cart-panel" style="padding: 20px; display: flex; flex-direction: column;">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
							<h3 style="margin: 0; font-weight: 800; color: #1f2937; font-size: 18px; display: flex; align-items: center; gap: 10px;">
								<span style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
									<i class="fa fa-shopping-cart" style="color: white; font-size: 14px;"></i>
								</span>
								Shopping Cart
							</h3>
							<span class="cart-count">0</span>
						</div>
						
						<div class="cart-items" style="flex: 1; overflow-y: auto; margin-bottom: 16px;">
							<div class="empty-cart" style="text-align: center; padding: 50px 20px; color: #9ca3af;">
								<div style="width: 80px; height: 80px; background: #f3f4f6; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
									<span style="font-size: 36px; opacity: 0.5;">🛒</span>
								</div>
								<p style="font-size: 15px; margin: 0; font-weight: 600; color: #6b7280;">Your cart is empty</p>
								<p style="font-size: 13px; margin-top: 6px; opacity: 0.7;">Click on products to add them</p>
							</div>
						</div>
						
						<div class="cart-summary">
							<div class="summary-card" style="margin-bottom: 14px;">
								<div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #64748b;">
									<span>Subtotal</span>
									<span class="subtotal-amount" style="font-weight: 600;">₹0.00</span>
								</div>
								<div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px dashed #e2e8f0;">
									<span style="font-size: 16px; font-weight: 700; color: #1e293b;">Total Amount</span>
									<span class="total-amount total-amount-display" style="font-size: 24px; font-weight: 800;">₹0.00</span>
								</div>
							</div>
							<button class="btn btn-primary btn-lg btn-block checkout-btn" disabled style="padding: 16px; border-radius: 12px; margin-bottom: 10px;">
								<i class="fa fa-check-circle" style="margin-right: 8px;"></i>COMPLETE CHECKOUT
							</button>
							<button class="btn btn-outline-secondary btn-block clear-cart-btn" disabled style="padding: 12px; font-weight: 600; border-radius: 10px; border-width: 2px; color: #64748b;">
								<i class="fa fa-trash-o" style="margin-right: 6px;"></i>Clear Cart
							</button>
						</div>
					</div>
				</div>
			</div>
		`);

		this.bind_events();
	}	load_shop_data() {
		// Load shops for dropdown using custom method
		frappe.call({
			method: 'venus_chicken.venus_chicken.doctype.shop.shop.get_user_shops',
			callback: (r) => {
				if (r.message) {
					const select = $(this.wrapper).find('#shop-select');
					r.message.forEach(shop => {
						select.append(`<option value="${shop.name}">${shop.shop_name}</option>`);
					});

					// Auto-select if only one shop
					if (r.message.length === 1) {
						select.val(r.message[0].name).trigger('change');
					}
				}
			}
		});
	}

	load_products(shop) {
		if (!shop) {
			$(this.wrapper).find('.products-grid').html('<p style="padding: 20px; text-align: center;">Please select a shop</p>');
			return;
		}

		frappe.call({
			method: 'venus_chicken.venus_chicken.doctype.shop.shop.get_stock_for_shop',
			args: { shop: shop },
			callback: (r) => {
				this.render_products(r.message || []);
			}
		});
	}

	render_products(products) {
		const grid = $(this.wrapper).find('.products-grid');
		
		if (products.length === 0) {
			grid.html('<div style="grid-column: 1/-1; padding: 60px 20px; text-align: center; color: #9ca3af;"><div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">📦</div><p style="font-size: 16px;">No products available</p></div>');
			return;
		}

		grid.empty();
		this.all_products = products;
		
		products.forEach(product => {
			const stock = product.processed_weight_kg || 0;
			const available = stock > 0;
			
			const card = $(`
				<div class="product-card" data-product="${product.product}" data-name="${(product.product_name || product.product).toLowerCase()}" style="
					border-radius: 12px;
					padding: 20px;
					text-align: center;
					cursor: ${available ? 'pointer' : 'not-allowed'};
					background: ${available ? 'white' : '#f5f5f5'};
					opacity: ${available ? '1' : '0.6'};
					position: relative;
				">
					${available ? '' : '<div style="position: absolute; top: 12px; right: 12px; background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700;">OUT</div>'}
					<div style="font-size: 56px; margin-bottom: 12px; filter: ${available ? 'none' : 'grayscale(100%)'};">🍗</div>
					<h5 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #1f2937; line-height: 1.3;">${product.product_name || product.product}</h5>
					<div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 10px;">
						<span style="font-size: 18px; font-weight: 700; color: #667eea;">₹${product.rate_per_kg || 0}</span>
						<span style="font-size: 12px; color: #9ca3af;">/kg</span>
					</div>
					<span class="${available ? 'badge-stock' : 'badge-out-stock'}">
						${available ? '✓ ' + stock.toFixed(2) + ' kg' : 'Out of Stock'}
					</span>
				</div>
			`);

			if (available) {
				card.click(() => {
					this.show_add_to_cart_dialog(product);
					// Visual feedback
					card.css('transform', 'scale(0.95)');
					setTimeout(() => card.css('transform', ''), 150);
				});
			}

			grid.append(card);
		});
	}

	show_add_to_cart_dialog(product) {
		const rate_per_kg = product.rate_per_kg || 0;
		const available_stock = product.processed_weight_kg || 0;
		
		// Create dialog for selecting sale mode
		const dialog = new frappe.ui.Dialog({
			title: `Add ${product.product_name || product.product}`,
			fields: [
				{
					fieldtype: 'HTML',
					fieldname: 'product_info',
					options: `
						<div class="dialog-product-info" style="text-align: center; padding: 8px 0 12px 0; border-bottom: 2px dashed #e5e7eb; margin-bottom: 12px;">
							<div style="font-size: 36px; margin-bottom: 4px;">🍗</div>
							<div style="font-size: 16px; font-weight: 700; color: #1f2937;">${product.product_name || product.product}</div>
							<div style="color: #667eea; font-weight: 600; font-size: 14px;">₹${rate_per_kg} /kg</div>
							<div style="color: #6b7280; font-size: 12px;">Available: ${available_stock.toFixed(2)} kg</div>
						</div>
					`
				},
				{
					fieldtype: 'HTML',
					fieldname: 'mode_selector',
					options: `
						<div style="margin-bottom: 12px;">
							<label style="font-weight: 600; display: block; margin-bottom: 8px; color: #374151; font-size: 13px;">Select Entry Mode</label>
							<div style="display: flex; gap: 8px;">
								<button class="btn btn-default sale-mode-btn active" data-mode="weight" style="flex: 1; padding: 10px; font-weight: 600; border-radius: 8px; border: 2px solid #667eea; background: #667eea; color: white; font-size: 13px;">
									<i class="fa fa-balance-scale"></i> By Weight
								</button>
								<button class="btn btn-default sale-mode-btn" data-mode="amount" style="flex: 1; padding: 10px; font-weight: 600; border-radius: 8px; border: 2px solid #e5e7eb; font-size: 13px;">
									<i class="fa fa-inr"></i> By Amount
								</button>
							</div>
						</div>
					`
				},
				{
					fieldtype: 'HTML',
					fieldname: 'input_section',
					options: `
						<div class="weight-input-section">
							<label style="font-weight: 600; display: block; margin-bottom: 6px; color: #374151; font-size: 13px;">Enter Weight (Kg)</label>
							<input type="text" id="weight-input" class="form-control" value="0.5"
								style="font-size: 20px; padding: 10px; text-align: center; font-weight: 700; border: 2px solid #e8eaf6; border-radius: 8px;">
							<div style="margin-top: 8px; padding: 8px; background: #f0fdf4; border-radius: 8px; text-align: center;">
								<span style="color: #6b7280; font-size: 12px;">Amount:</span>
								<span id="calculated-amount" style="font-weight: 700; color: #10b981; font-size: 16px; margin-left: 6px;">₹${(0.5 * rate_per_kg).toFixed(2)}</span>
							</div>
						</div>
						<div class="amount-input-section" style="display: none;">
							<label style="font-weight: 600; display: block; margin-bottom: 6px; color: #374151; font-size: 13px;">Enter Amount (₹)</label>
							<input type="text" id="amount-input" class="form-control" value="100"
								style="font-size: 20px; padding: 10px; text-align: center; font-weight: 700; border: 2px solid #e8eaf6; border-radius: 8px;">
							<div style="margin-top: 8px; padding: 8px; background: #eff6ff; border-radius: 8px; text-align: center;">
								<span style="color: #6b7280; font-size: 12px;">Weight:</span>
								<span id="calculated-weight" style="font-weight: 700; color: #3b82f6; font-size: 16px; margin-left: 6px;">${(100 / rate_per_kg).toFixed(3)} kg</span>
							</div>
						</div>
					`
				},
				{
					fieldtype: 'HTML',
					fieldname: 'numpad_section',
					options: `
						<div style="margin-top: 10px;">
							<div class="quick-numpad" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
								<button class="btn btn-default quick-num" data-value="1" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">1</button>
								<button class="btn btn-default quick-num" data-value="2" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">2</button>
								<button class="btn btn-default quick-num" data-value="3" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">3</button>
								<button class="btn btn-default quick-num" data-value="0.5" style="padding: 10px; font-size: 12px; font-weight: 600; border-radius: 6px; background: #f0fdf4; color: #10b981;">+0.5</button>
								<button class="btn btn-default quick-num" data-value="4" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">4</button>
								<button class="btn btn-default quick-num" data-value="5" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">5</button>
								<button class="btn btn-default quick-num" data-value="6" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">6</button>
								<button class="btn btn-default quick-num" data-value="100" style="padding: 10px; font-size: 12px; font-weight: 600; border-radius: 6px; background: #eff6ff; color: #3b82f6;">+100</button>
								<button class="btn btn-default quick-num" data-value="7" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">7</button>
								<button class="btn btn-default quick-num" data-value="8" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">8</button>
								<button class="btn btn-default quick-num" data-value="9" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">9</button>
								<button class="btn btn-default quick-num" data-value="50" style="padding: 10px; font-size: 12px; font-weight: 600; border-radius: 6px; background: #eff6ff; color: #3b82f6;">+50</button>
								<button class="btn btn-default quick-num" data-value="." style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">.</button>
								<button class="btn btn-default quick-num" data-value="0" style="padding: 10px; font-size: 16px; font-weight: 600; border-radius: 6px;">0</button>
								<button class="btn btn-warning quick-clear" style="padding: 10px; font-size: 14px; font-weight: 600; border-radius: 6px;"><i class="fa fa-backspace"></i></button>
								<button class="btn btn-default quick-num" data-value="200" style="padding: 10px; font-size: 12px; font-weight: 600; border-radius: 6px; background: #eff6ff; color: #3b82f6;">+200</button>
							</div>
						</div>
					`
				}
			],
			primary_action_label: 'Add to Cart',
			primary_action: () => {
				const mode = dialog.$wrapper.find('.sale-mode-btn.active').data('mode');
				let qty_kg;
				
				if (mode === 'weight') {
					qty_kg = parseFloat(dialog.$wrapper.find('#weight-input').val()) || 0.5;
				} else {
					const amount = parseFloat(dialog.$wrapper.find('#amount-input').val()) || 100;
					qty_kg = amount / rate_per_kg;
				}
				
				// Validate against available stock
				if (qty_kg > available_stock) {
					frappe.msgprint(`Not enough stock! Available: ${available_stock.toFixed(2)} kg`);
					return;
				}
				
				if (qty_kg <= 0) {
					frappe.msgprint('Please enter a valid quantity');
					return;
				}
				
				// Round to 3 decimal places
				qty_kg = Math.round(qty_kg * 1000) / 1000;
				
				this.add_to_cart_with_qty(product, qty_kg);
				dialog.hide();
			}
		});
		
		dialog.show();
		
		// Set up mode switching
		let current_mode = 'weight';
		dialog.$wrapper.find('.sale-mode-btn').click(function() {
			dialog.$wrapper.find('.sale-mode-btn').removeClass('active').css({
				'background': 'white',
				'color': '#374151',
				'border-color': '#e5e7eb'
			});
			$(this).addClass('active').css({
				'background': '#667eea',
				'color': 'white',
				'border-color': '#667eea'
			});
			
			current_mode = $(this).data('mode');
			if (current_mode === 'weight') {
				dialog.$wrapper.find('.weight-input-section').show();
				dialog.$wrapper.find('.amount-input-section').hide();
				dialog.$wrapper.find('#weight-input').focus().select();
			} else {
				dialog.$wrapper.find('.weight-input-section').hide();
				dialog.$wrapper.find('.amount-input-section').show();
				dialog.$wrapper.find('#amount-input').focus().select();
			}
		});
		
		// Weight input change - calculate amount
		dialog.$wrapper.find('#weight-input').on('input', function() {
			const weight = parseFloat($(this).val()) || 0;
			const amount = weight * rate_per_kg;
			dialog.$wrapper.find('#calculated-amount').text(`₹${amount.toFixed(2)}`);
		});
		
		// Amount input change - calculate weight
		dialog.$wrapper.find('#amount-input').on('input', function() {
			const amount = parseFloat($(this).val()) || 0;
			const weight = rate_per_kg > 0 ? amount / rate_per_kg : 0;
			dialog.$wrapper.find('#calculated-weight').text(`${weight.toFixed(3)} kg`);
		});
		
		// Quick numpad buttons
		dialog.$wrapper.find('.quick-num').click(function() {
			const value = $(this).data('value').toString();
			const input_selector = current_mode === 'weight' ? '#weight-input' : '#amount-input';
			const input = dialog.$wrapper.find(input_selector);
			let current = input.val() || '';
			
			// Check if it's a quick add button (+0.5, +50, +100, +200)
			if (value === '0.5' || value === '50' || value === '100' || value === '200') {
				const currentNum = parseFloat(current) || 0;
				input.val((currentNum + parseFloat(value)).toString());
			} else if (value === '.') {
				// Handle dot - only add if no dot exists
				if (!current.includes('.')) {
					if (current === '' || current === '0') {
						input.val('0.');
					} else {
						input.val(current + '.');
					}
				}
			} else {
				// Regular number input (0-9)
				if (current === '0' || current === '0.5' || current === '100') {
					// Replace default values when user starts typing
					current = '';
				}
				input.val(current + value);
			}
			input.trigger('input');
		});
		
		// Clear button
		dialog.$wrapper.find('.quick-clear').click(function() {
			const input_selector = current_mode === 'weight' ? '#weight-input' : '#amount-input';
			const input = dialog.$wrapper.find(input_selector);
			let current = input.val() || '';
			input.val(current.slice(0, -1) || '0');
			input.trigger('input');
		});
		
		// Focus on weight input initially
		setTimeout(() => {
			dialog.$wrapper.find('#weight-input').focus().select();
		}, 100);
		
		// Style the primary button
		dialog.$wrapper.find('.btn-primary').css({
			'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			'border': 'none',
			'padding': '12px 24px',
			'font-weight': '600'
		});
	}

	add_to_cart_with_qty(product, qty_kg) {
		// Check if already in cart
		const existing = this.cart_items.find(item => item.product === product.product);
		
		if (existing) {
			// Add to existing quantity
			existing.qty_kg += qty_kg;
			// Ensure doesn't exceed stock
			if (existing.qty_kg > existing.available_stock) {
				existing.qty_kg = existing.available_stock;
				frappe.show_alert({
					message: 'Quantity limited to available stock',
					indicator: 'orange'
				});
			}
		} else {
			// Add new item
			this.cart_items.push({
				product: product.product,
				product_name: product.product_name || product.product,
				rate_per_kg: product.rate_per_kg || 0,
				qty_kg: qty_kg,
				available_stock: product.processed_weight_kg || 0
			});
		}
		
		this.render_cart();
		frappe.show_alert({
			message: `Added ${qty_kg.toFixed(3)} kg to cart`,
			indicator: 'green'
		});
	}

	add_to_cart(product) {
		// Check if already in cart
		const existing = this.cart_items.find(item => item.product === product.product);
		
		if (existing) {
			// Increment quantity
			existing.qty_kg += 0.5;
		} else {
			// Add new item
			this.cart_items.push({
				product: product.product,
				product_name: product.product_name || product.product,
				rate_per_kg: product.rate_per_kg || 0,
				qty_kg: 0.5,
				available_stock: product.processed_weight_kg || 0
			});
		}
		
		this.render_cart();
	}

	render_cart() {
		const container = $(this.wrapper).find('.cart-items');
		const cart_count = $(this.wrapper).find('.cart-count');
		
		cart_count.text(this.cart_items.length);
		
		if (this.cart_items.length === 0) {
			container.html(`
				<div class="empty-cart" style="text-align: center; padding: 60px 20px; color: #9ca3af;">
					<div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">🛒</div>
					<p style="font-size: 16px; margin: 0;">Your cart is empty</p>
					<p style="font-size: 13px; margin-top: 8px; opacity: 0.7;">Add products to get started</p>
				</div>
			`);
			$(this.wrapper).find('.checkout-btn, .clear-cart-btn').prop('disabled', true);
			$(this.wrapper).find('.total-amount, .subtotal-amount').text('₹0.00');
			$(this.wrapper).find('.payment-mode-selector, .payment-input-section').hide();
			return;
		}

		container.empty();
		this.total_amount = 0;

		this.cart_items.forEach((item, index) => {
			const amount = item.qty_kg * item.rate_per_kg;
			this.total_amount += amount;

			const row = $(`
				<div class="cart-item" style="
					background: white;
					padding: 14px;
					margin-bottom: 12px;
					border-radius: 10px;
					border: 2px solid #f3f4f6;
				">
					<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
						<div style="flex: 1;">
							<div style="font-weight: 700; margin-bottom: 4px; color: #1f2937; font-size: 14px;">${item.product_name}</div>
							<div style="color: #667eea; font-size: 13px; font-weight: 600;">₹${item.rate_per_kg} /kg</div>
						</div>
						<button class="btn btn-sm btn-danger remove-item" style="padding: 4px 10px; border-radius: 6px; font-size: 12px;">
							<i class="fa fa-times"></i>
						</button>
					</div>
					<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px dashed #e5e7eb;">
						<div class="qty-controls" style="display: flex; align-items: center; gap: 8px;">
							<button class="btn btn-sm qty-minus"><i class="fa fa-minus"></i></button>
							<input type="number" class="qty-input" value="${item.qty_kg}" 
								style="width: 70px; text-align: center; border: 2px solid #e8eaf6; padding: 6px; border-radius: 6px; font-weight: 600; font-size: 13px;" 
								step="0.1" min="0.1" max="${item.available_stock}">
							<button class="btn btn-sm qty-plus"><i class="fa fa-plus"></i></button>
						</div>
						<div style="font-weight: 700; color: #10b981; font-size: 16px;">₹${amount.toFixed(2)}</div>
					</div>
				</div>
			`);

			// Bind quantity controls
			row.find('.qty-minus').click(() => {
				if (item.qty_kg > 0.1) {
					item.qty_kg = Math.max(0.1, item.qty_kg - 0.5);
					this.render_cart();
				}
			});

			row.find('.qty-plus').click(() => {
				if (item.qty_kg < item.available_stock) {
					item.qty_kg = Math.min(item.available_stock, item.qty_kg + 0.5);
					this.render_cart();
				}
			});

			row.find('.qty-input').on('change', (e) => {
				const val = parseFloat(e.target.value);
				if (val > 0 && val <= item.available_stock) {
					item.qty_kg = val;
					this.render_cart();
				} else {
					e.target.value = item.qty_kg;
				}
			});

			row.find('.remove-item').click(() => {
				this.cart_items.splice(index, 1);
				this.render_cart();
			});

			container.append(row);
		});

		$(this.wrapper).find('.total-amount').text(`₹${this.total_amount.toFixed(2)}`);
		$(this.wrapper).find('.checkout-btn, .clear-cart-btn').prop('disabled', false);
		
		// Show payment mode selector
		$(this.wrapper).find('.payment-mode-selector').show();
		$(this.wrapper).find('.payment-input-section').show();
		
		// Reset payment based on mode
		this.update_payment_display();
	}
	
	bind_events() {
		// Shop selection
		$(this.wrapper).find('#shop-select').change((e) => {
			this.selected_shop = e.target.value;
			this.cart_items = [];
			this.render_cart();
			this.load_products(this.selected_shop);
		});

		// Product search
		$(this.wrapper).find('#product-search').on('input', (e) => {
			const search_term = e.target.value.toLowerCase().trim();
			const product_cards = $(this.wrapper).find('.product-card');
			
			if (!search_term) {
				// Show all products if search is empty
				product_cards.show();
				$(this.wrapper).find('.no-results').remove();
				return;
			}
			
			let visible_count = 0;
			product_cards.each(function() {
				const product_name = $(this).data('name').toLowerCase();
				if (product_name.includes(search_term)) {
					$(this).show();
					visible_count++;
				} else {
					$(this).hide();
				}
			});
			
			// Show no results message
			$(this.wrapper).find('.no-results').remove();
			if (visible_count === 0) {
				$(this.wrapper).find('.products-grid').after(`
					<div class="no-results" style="text-align: center; padding: 40px; color: #9ca3af;">
						<div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
						<p style="font-size: 15px; margin: 0;">No products found</p>
						<p style="font-size: 13px; margin-top: 6px; opacity: 0.7;">Try a different search term</p>
					</div>
				`);
			}
		});

		// Payment mode selection
		$(this.wrapper).find('.payment-mode-btn').click((e) => {
			$(this.wrapper).find('.payment-mode-btn').removeClass('active');
			$(e.currentTarget).addClass('active');
			this.payment_mode = $(e.currentTarget).data('mode');
			this.update_payment_display();
		});

		// Numpad buttons
		$(this.wrapper).find('.numpad-btn').click((e) => {
			if (this.payment_mode === 'UPI') return; // Disable numpad for UPI
			
			const value = $(e.currentTarget).data('value');
			const input = $(this.wrapper).find('.payment-amount-input');
			let current = input.val() || '0';
			
			// Remove leading zero
			if (current === '0' || current === '0.00') {
				current = '';
			}
			
			input.val(current + value);
			this.update_cash_display();
		});

		// Clear button
		$(this.wrapper).find('.numpad-clear').click(() => {
			if (this.payment_mode === 'UPI') return; // Disable for UPI
			
			const input = $(this.wrapper).find('.payment-amount-input');
			let current = input.val() || '';
			input.val(current.slice(0, -1));
			this.update_cash_display();
		});

		// Checkout button
		$(this.wrapper).find('.checkout-btn').click(() => {
			this.process_checkout();
		});

		// Clear cart button
		$(this.wrapper).find('.clear-cart-btn').click(() => {
			this.cart_items = [];
			this.render_cart();
		});
	}

	update_payment_display() {
		const input = $(this.wrapper).find('.payment-amount-input');
		
		if (this.payment_mode === 'UPI') {
			// For UPI, set exact amount and disable numpad visually
			input.val(this.total_amount.toFixed(2));
			$(this.wrapper).find('.numpad-btn, .numpad-clear').css('opacity', '0.4').css('pointer-events', 'none');
			$(this.wrapper).find('.change-display').hide();
			$(this.wrapper).find('.checkout-btn').prop('disabled', false);
		} else {
			// For Cash, enable numpad and reset
			input.val('');
			$(this.wrapper).find('.numpad-btn, .numpad-clear').css('opacity', '1').css('pointer-events', 'auto');
			$(this.wrapper).find('.change-display').show();
			$(this.wrapper).find('.change-amount').text('₹0.00');
			$(this.wrapper).find('.checkout-btn').prop('disabled', true);
		}
	}

	update_cash_display() {
		const input = $(this.wrapper).find('.payment-amount-input');
		const cash = parseFloat(input.val()) || 0;
		const change = cash - this.total_amount;
		$(this.wrapper).find('.change-amount').text(`₹${Math.max(0, change).toFixed(2)}`);
		
		// Enable checkout only if sufficient cash
		if (cash >= this.total_amount) {
			$(this.wrapper).find('.checkout-btn').prop('disabled', false);
		} else {
			$(this.wrapper).find('.checkout-btn').prop('disabled', true);
		}
	}

	process_checkout() {
		if (!this.selected_shop) {
			frappe.msgprint('Please select a shop');
			return;
		}

		if (this.cart_items.length === 0) {
			frappe.msgprint('Cart is empty');
			return;
		}

		const payment_amount = parseFloat($(this.wrapper).find('.payment-amount-input').val()) || 0;
		
		if (this.payment_mode === 'Cash' && payment_amount < this.total_amount) {
			frappe.msgprint('Insufficient cash received');
			return;
		}

		const change = this.payment_mode === 'Cash' ? payment_amount - this.total_amount : 0;

		// Create POS Invoice
		const items = this.cart_items.map(item => ({
			product: item.product,
			qty_kg: item.qty_kg,
			rate: item.rate_per_kg,
			amount: item.qty_kg * item.rate_per_kg
		}));

		frappe.call({
			method: 'venus_chicken.venus_chicken.page.pos_billing.pos_billing.create_pos_invoice',
			args: {
				shop: this.selected_shop,
				items: items,
				payment_mode: this.payment_mode,
				cash_received: payment_amount,
				change_amount: change
			},
			freeze: true,
			freeze_message: 'Creating invoice...',
			callback: (r) => {
				if (r.message) {
					// Show POS receipt with print option
					this.show_receipt(r.message, payment_amount, change);
					
					// Clear cart and reload products
					this.cart_items = [];
					this.render_cart();
					this.load_products(this.selected_shop);
				}
			}
		});
	}

	show_receipt(invoice, cash_received, change_amount) {
		const current_date = new Date();
		const formatted_date = current_date.toLocaleDateString('en-IN', { 
			day: '2-digit', 
			month: 'short', 
			year: 'numeric' 
		});
		const formatted_time = current_date.toLocaleTimeString('en-IN', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: true 
		});

		// Get shop info from invoice
		const shop_info = invoice.shop_info || {};
		const phone = shop_info.phone || '';
		const address = shop_info.address || shop_info.location || '';
		const display_address = address ? address.replace(/\n/g, '<br>') : '';

		// Build items list
		let items_html = '';
		invoice.items.forEach(item => {
			items_html += `
				<tr>
					<td style="padding: 4px 0; font-size: 11px;">${item.product}</td>
					<td style="padding: 4px 0; text-align: center; font-size: 11px;">${item.qty_kg} kg</td>
					<td style="padding: 4px 0; text-align: right; font-size: 11px;">₹${item.amount.toFixed(2)}</td>
				</tr>
			`;
		});

		const receipt_html = `
			<div class="pos-receipt-container" style="display: flex; justify-content: center; padding: 20px;">
				<div id="receipt-content" style="
					width: 280px;
					background: white;
					padding: 20px;
					font-family: 'Courier New', monospace;
					border: 2px dashed #999;
					box-shadow: 0 4px 20px rgba(0,0,0,0.15);
				">
					<div style="text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #333; padding-bottom: 12px;">
						<div style="font-size: 18px; font-weight: bold; letter-spacing: 1px;">VENUS CHICKEN</div>
						<div style="font-size: 10px; margin-top: 4px; color: #666;">Fresh Chicken & Meat Shop</div>
						${display_address ? `<div style="font-size: 9px; margin-top: 3px; color: #666; line-height: 1.3;">${display_address}</div>` : ''}
						${phone ? `<div style="font-size: 9px; margin-top: 2px; color: #666;">Ph: ${phone}</div>` : ''}
					</div>

					<div style="font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
							<span>Date:</span>
							<span style="font-weight: bold;">${formatted_date}</span>
						</div>
						<div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
							<span>Time:</span>
							<span style="font-weight: bold;">${formatted_time}</span>
						</div>
						<div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
							<span>Invoice No:</span>
							<span style="font-weight: bold;">${invoice.name}</span>
						</div>
						<div style="display: flex; justify-content: space-between;">
							<span>Shop:</span>
							<span style="font-weight: bold;">${invoice.shop}</span>
						</div>
					</div>

					<div style="margin-bottom: 10px;">
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="border-bottom: 1px solid #333;">
									<th style="text-align: left; padding: 4px 0; font-size: 10px; font-weight: bold;">ITEM</th>
									<th style="text-align: center; padding: 4px 0; font-size: 10px; font-weight: bold;">QTY</th>
									<th style="text-align: right; padding: 4px 0; font-size: 10px; font-weight: bold;">AMOUNT</th>
								</tr>
							</thead>
							<tbody>
								${items_html}
							</tbody>
						</table>
					</div>

					<div style="border-top: 2px dashed #333; padding-top: 8px; margin-bottom: 10px;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
							<span style="font-weight: bold;">TOTAL:</span>
							<span style="font-weight: bold;">₹${invoice.total_amount.toFixed(2)}</span>
						</div>
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
							<span>Payment Mode:</span>
							<span style="font-weight: bold;">${invoice.payment_mode}</span>
						</div>
						${invoice.payment_mode === 'Cash' ? `
							<div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
								<span>Cash Received:</span>
								<span>₹${cash_received.toFixed(2)}</span>
							</div>
							${change_amount > 0 ? `
								<div style="display: flex; justify-content: space-between; font-size: 11px;">
									<span>Change:</span>
									<span style="font-weight: bold; color: #28a745;">₹${change_amount.toFixed(2)}</span>
								</div>
							` : ''}
						` : `
							<div style="display: flex; justify-content: space-between; font-size: 11px;">
								<span>UPI Amount:</span>
								<span style="font-weight: bold; color: #2e7d32;">₹${invoice.total_amount.toFixed(2)}</span>
							</div>
						`}
					</div>

					<div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 9px; color: #666;">
						<div style="margin-bottom: 4px;">THANK YOU FOR YOUR PURCHASE!</div>
						<div>Visit Again Soon</div>
					</div>
				</div>
			</div>
		`;

		// Show receipt in dialog with print button
		const dialog = new frappe.ui.Dialog({
			title: 'Receipt',
			size: 'small',
			fields: [{
				fieldtype: 'HTML',
				fieldname: 'receipt',
				options: receipt_html
			}],
			primary_action_label: '🖨️ Print Receipt',
			primary_action: () => {
				this.print_receipt();
			},
			secondary_action_label: 'View Invoice',
			secondary_action: () => {
				frappe.set_route('Form', 'POS Invoice', invoice.name);
				dialog.hide();
			}
		});

		dialog.show();

		// Add custom CSS for print button
		dialog.$wrapper.find('.btn-primary').css({
			'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			'border': 'none',
			'font-weight': '600'
		});
	}

	print_receipt() {
		// Get the receipt content
		const receipt_content = document.getElementById('receipt-content');
		if (!receipt_content) return;

		// Create a print window
		const print_window = window.open('', '_blank', 'width=400,height=600');
		
		print_window.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Receipt - Print</title>
				<style>
					@media print {
						@page {
							size: 80mm auto;
							margin: 0;
						}
						body {
							margin: 0;
							padding: 10px;
						}
					}
					body {
						font-family: 'Courier New', monospace;
						margin: 0;
						padding: 10px;
						background: white;
					}
				</style>
			</head>
			<body>
				${receipt_content.innerHTML}
			</body>
			</html>
		`);

		print_window.document.close();
		
		// Wait for content to load, then print
		print_window.onload = function() {
			print_window.focus();
			print_window.print();
			// Close print window after printing
			setTimeout(() => {
				print_window.close();
			}, 100);
		};
	}
}

