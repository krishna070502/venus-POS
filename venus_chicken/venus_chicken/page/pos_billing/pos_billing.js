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
		
		// Add custom CSS for enterprise styling
		$('head').append(`
			<style>
				.pos-container * { box-sizing: border-box; }
				.pos-header { 
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					color: white;
					padding: 20px 25px;
					border-radius: 12px;
					margin-bottom: 20px;
					box-shadow: 0 4px 20px rgba(0,0,0,0.1);
				}
				.pos-panel {
					background: white;
					border-radius: 12px;
					box-shadow: 0 2px 12px rgba(0,0,0,0.08);
					overflow: hidden;
				}
				.product-card {
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					border: 2px solid #e8eaf6 !important;
				}
				.product-card:hover {
					transform: translateY(-4px);
					box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15) !important;
					border-color: #667eea !important;
				}
				.cart-item {
					transition: all 0.2s ease;
					border-left: 4px solid transparent !important;
				}
				.cart-item:hover {
					border-left-color: #667eea !important;
					background: #f8f9fa !important;
				}
				.numpad-btn {
					transition: all 0.15s ease;
					border: 2px solid #e0e0e0 !important;
					background: white !important;
					font-weight: 600 !important;
				}
				.numpad-btn:hover {
					background: #667eea !important;
					color: white !important;
					border-color: #667eea !important;
					transform: scale(1.05);
				}
				.numpad-btn:active {
					transform: scale(0.95);
				}
				.payment-mode-btn {
					transition: all 0.2s ease;
					border: 2px solid transparent !important;
				}
				.payment-mode-btn.active {
					box-shadow: 0 4px 12px rgba(0,0,0,0.15);
					transform: scale(1.02);
				}
				.checkout-btn {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
					border: none !important;
					transition: all 0.3s ease !important;
				}
				.checkout-btn:hover:not(:disabled) {
					transform: translateY(-2px);
					box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
				}
				.qty-controls .btn {
					background: #f3f4f6 !important;
					border: 2px solid #e5e7eb !important;
					color: #667eea !important;
					font-weight: 700 !important;
					min-width: 36px !important;
					height: 36px !important;
					border-radius: 8px !important;
					transition: all 0.2s ease !important;
				}
				.qty-controls .btn:hover {
					background: #667eea !important;
					color: white !important;
					border-color: #667eea !important;
					transform: scale(1.1);
				}
				.qty-controls .btn:active {
					transform: scale(0.95);
				}
				.cart-count {
					background: linear-gradient(135deg, #f43f5e, #e11d48);
					color: white;
					padding: 4px 10px;
					border-radius: 12px;
					font-size: 12px;
					font-weight: 700;
					min-width: 24px;
					text-align: center;
				}
				#product-search {
					transition: all 0.3s ease;
				}
				#product-search:focus {
					border-color: #667eea !important;
					box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
					outline: none;
				}
				.remove-item {
					transition: all 0.2s ease !important;
				}
				.remove-item:hover {
					transform: scale(1.1);
					background: #dc2626 !important;
				}
				.qty-controls button {
					width: 32px;
					height: 32px;
					padding: 0 !important;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border-radius: 6px !important;
					transition: all 0.2s ease;
				}
				.qty-controls button:hover {
					background: #667eea !important;
					color: white !important;
					border-color: #667eea !important;
				}
				.search-box {
					border: 2px solid #e8eaf6;
					border-radius: 8px;
					padding: 12px 16px;
					font-size: 15px;
					transition: all 0.3s ease;
				}
				.search-box:focus {
					border-color: #667eea;
					box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
					outline: none;
				}
				.badge-stock {
					background: #10b981;
					color: white;
					padding: 4px 12px;
					border-radius: 12px;
					font-size: 11px;
					font-weight: 600;
				}
				.badge-out-stock {
					background: #ef4444;
					color: white;
					padding: 4px 12px;
					border-radius: 12px;
					font-size: 11px;
					font-weight: 600;
				}
			</style>
		`);
		
		// Create main layout with enterprise design
		$(this.wrapper).find('.layout-main-section').html(`
			<div class="pos-container" style="height: calc(100vh - 100px); padding: 20px; background: #f5f7fa;">
				<!-- Header -->
				<div class="pos-header">
					<div style="display: flex; justify-content: space-between; align-items: center;">
						<div>
							<h2 style="margin: 0 0 5px 0; font-weight: 700;">🍗 POS Billing</h2>
							<p style="margin: 0; opacity: 0.9; font-size: 14px;">Venus Chicken Management System</p>
						</div>
						<div style="text-align: right;">
							<div style="font-size: 14px; opacity: 0.9;">
								<i class="fa fa-user"></i> <span id="current-user">${frappe.session.user}</span>
							</div>
							<div style="font-size: 13px; opacity: 0.8; margin-top: 2px;">
								<i class="fa fa-calendar"></i> <span id="current-date">${frappe.datetime.now_date()}</span>
							</div>
						</div>
					</div>
				</div>

				<div style="display: flex; gap: 20px; height: calc(100% - 110px);">
					<!-- Left Panel - Numpad & Payment -->
					<div class="pos-panel numpad-panel" style="flex: 0 0 320px; padding: 24px; display: flex; flex-direction: column;">
						<div class="shop-selector" style="margin-bottom: 20px;">
							<label style="font-weight: 600; display: block; margin-bottom: 8px; color: #374151; font-size: 14px;">
								<i class="fa fa-store"></i> Select Shop
							</label>
							<select class="form-control" id="shop-select" style="border-radius: 8px; padding: 10px; border: 2px solid #e8eaf6; font-size: 14px;">
								<option value="">Choose a shop...</option>
							</select>
						</div>
						
						<div class="payment-mode-selector" style="margin-bottom: 20px; display: none;">
							<label style="font-weight: 600; display: block; margin-bottom: 8px; color: #374151; font-size: 14px;">
								<i class="fa fa-credit-card"></i> Payment Mode
							</label>
							<div style="display: flex; gap: 10px;">
								<button class="btn btn-success payment-mode-btn active" data-mode="Cash" style="flex: 1; padding: 12px; font-weight: 600; border-radius: 8px; font-size: 13px;">
									<i class="fa fa-money"></i> Cash
								</button>
								<button class="btn btn-info payment-mode-btn" data-mode="UPI" style="flex: 1; padding: 12px; font-weight: 600; border-radius: 8px; font-size: 13px;">
									<i class="fa fa-mobile"></i> UPI
								</button>
							</div>
						</div>
						
						<div class="payment-input-section" style="display: none; flex: 1; display: flex; flex-direction: column;">
							<div style="margin-bottom: 16px;">
								<label style="font-weight: 600; display: block; margin-bottom: 8px; color: #374151; font-size: 14px;">
									Amount Received
								</label>
								<input type="text" class="form-control payment-amount-input" placeholder="₹ 0.00" 
									style="font-size: 32px; padding: 16px; text-align: right; font-weight: 700; background: #f9fafb; border: 2px solid #e8eaf6; border-radius: 8px; color: #667eea;" readonly>
							</div>
							
							<!-- Numpad -->
							<div class="numpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
								<button class="btn numpad-btn" data-value="7" style="padding: 18px; font-size: 22px; border-radius: 8px;">7</button>
								<button class="btn numpad-btn" data-value="8" style="padding: 18px; font-size: 22px; border-radius: 8px;">8</button>
								<button class="btn numpad-btn" data-value="9" style="padding: 18px; font-size: 22px; border-radius: 8px;">9</button>
								<button class="btn numpad-btn" data-value="4" style="padding: 18px; font-size: 22px; border-radius: 8px;">4</button>
								<button class="btn numpad-btn" data-value="5" style="padding: 18px; font-size: 22px; border-radius: 8px;">5</button>
								<button class="btn numpad-btn" data-value="6" style="padding: 18px; font-size: 22px; border-radius: 8px;">6</button>
								<button class="btn numpad-btn" data-value="1" style="padding: 18px; font-size: 22px; border-radius: 8px;">1</button>
								<button class="btn numpad-btn" data-value="2" style="padding: 18px; font-size: 22px; border-radius: 8px;">2</button>
								<button class="btn numpad-btn" data-value="3" style="padding: 18px; font-size: 22px; border-radius: 8px;">3</button>
								<button class="btn numpad-btn" data-value="0" style="padding: 18px; font-size: 22px; border-radius: 8px;">0</button>
								<button class="btn numpad-btn" data-value="00" style="padding: 18px; font-size: 20px; border-radius: 8px;">00</button>
								<button class="btn btn-warning numpad-clear" style="padding: 18px; font-size: 20px; border-radius: 8px; font-weight: 600;">
									<i class="fa fa-backspace"></i>
								</button>
							</div>
							
							<div class="change-display" style="padding: 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; margin-bottom: 16px; display: none; color: white;">
								<div style="display: flex; justify-content: space-between; font-size: 18px;">
									<span style="font-weight: 600;"><i class="fa fa-exchange"></i> Change</span>
									<span class="change-amount" style="font-weight: 700; font-size: 22px;">₹0.00</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Middle Panel - Products -->
					<div class="pos-panel products-panel" style="flex: 2; padding: 24px; display: flex; flex-direction: column;">
						<div style="margin-bottom: 20px;">
							<input type="text" class="form-control search-box" id="product-search" placeholder="🔍 Search products...">
						</div>
						<div style="flex: 1; overflow-y: auto; padding-right: 8px;">
							<div class="products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
								<!-- Products will be loaded here -->
							</div>
						</div>
					</div>

					<!-- Right Panel - Cart -->
					<div class="pos-panel cart-panel" style="flex: 0 0 380px; padding: 24px; display: flex; flex-direction: column;">
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
							<h3 style="margin: 0; font-weight: 700; color: #1f2937; font-size: 20px;">
								<i class="fa fa-shopping-cart"></i> Cart
							</h3>
							<span class="badge badge-primary" style="font-size: 14px; padding: 6px 12px; border-radius: 12px;">
								<span class="cart-count">0</span> items
							</span>
						</div>
						<div class="cart-items" style="flex: 1; overflow-y: auto; margin-bottom: 20px; padding-right: 8px;">
							<div class="empty-cart" style="text-align: center; padding: 60px 20px; color: #9ca3af;">
								<div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">🛒</div>
								<p style="font-size: 16px; margin: 0;">Your cart is empty</p>
								<p style="font-size: 13px; margin-top: 8px; opacity: 0.7;">Add products to get started</p>
							</div>
						</div>
						
						<div class="cart-summary" style="border-top: 3px solid #e5e7eb; padding-top: 20px;">
							<div style="background: #f9fafb; padding: 16px; border-radius: 10px; margin-bottom: 16px;">
								<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
									<span>Subtotal</span>
									<span class="subtotal-amount">₹0.00</span>
								</div>
								<div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px dashed #e5e7eb; font-size: 22px; font-weight: 700; color: #1f2937;">
									<span>Total</span>
									<span class="total-amount" style="color: #667eea;">₹0.00</span>
								</div>
							</div>
							<button class="btn btn-primary btn-lg btn-block checkout-btn" disabled style="padding: 16px; font-size: 17px; font-weight: 600; border-radius: 10px; margin-bottom: 10px;">
								<i class="fa fa-check-circle"></i> Complete Checkout
							</button>
							<button class="btn btn-outline-danger btn-block clear-cart-btn" disabled style="padding: 12px; font-weight: 600; border-radius: 8px; border-width: 2px;">
								<i class="fa fa-trash-o"></i> Clear Cart
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
					this.add_to_cart(product);
					// Visual feedback
					card.css('transform', 'scale(0.95)');
					setTimeout(() => card.css('transform', ''), 150);
				});
			}

			grid.append(card);
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

