<?php

class Hub_Bridge {

	public static function init() {
		// 1. هوک‌های سفارش
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'handle_order_status' ), 10, 4 );
		add_action( 'woocommerce_new_order', array( __CLASS__, 'handle_new_order' ), 10, 1 );
		
		// 2. هوک‌های کاربر
		add_action( 'user_register', array( __CLASS__, 'handle_user_register' ), 10, 1 );
	}

	// --- Handlers ---
	public static function handle_order_status( $order_id, $from, $to, $order ) {
		self::process_rules( 'order_status', $order, 'wc-' . $to );
	}

	public static function handle_new_order( $order_id ) {
		$order = wc_get_order( $order_id );
		self::process_rules( 'order_created', $order );
	}

	public static function handle_user_register( $user_id ) {
		$user = get_userdata( $user_id );
		self::process_rules( 'user_register', $user );
	}

	// --- هسته پردازش قوانین ---
	private static function process_rules( $trigger_type, $entity, $sub_trigger = null ) {
		$rules = get_option( 'hub_rules', [] );
		$webhooks = get_option( 'hub_webhooks', [] );
		
		// تبدیل لیست وب‌هوک به فرمت Key-Value
		$webhook_map = [];
		foreach($webhooks as $wh) $webhook_map[$wh['id']] = $wh;

		foreach ( $rules as $rule ) {
			// 1. بررسی تریگر اصلی
			if ( $rule['trigger'] !== $trigger_type ) continue;

			// 2. بررسی ساب-تریگر (وضعیت سفارش)
			if ( $trigger_type === 'order_status' && !empty($rule['sub_trigger']) ) {
				if ( $rule['sub_trigger'] !== $sub_trigger ) continue;
			}

			// 3. بررسی شرط‌های پیشرفته
			if ( !empty($rule['condition_active']) ) {
				if ( !self::check_complex_condition( $rule, $entity ) ) continue;
			}

			// 4. یافتن وب‌هوک مقصد
			$webhook_id = $rule['webhook_id'] ?? '';
			if ( empty($webhook_id) || !isset($webhook_map[$webhook_id]) ) continue;

			$target_webhook = $webhook_map[$webhook_id];

			// 5. آماده‌سازی داده‌ها
			$payload = self::build_payload( $entity, $rule['message'] );
            
            // اضافه کردن URL وب‌هوک مقصد به payload
            $payload['_webhook_url'] = $target_webhook['url'];

			// 6. افزودن به صف
			Hub_Queue::push( $trigger_type, $payload );
		}
	}

	// --- بررسی شرط‌های پیچیده ---
	private static function check_complex_condition( $rule, $entity ) {
		if ( !is_a( $entity, 'WC_Order' ) ) return true;

		$key = $rule['condition_key'] ?? ''; 
		$val = $rule['condition_val'] ?? ''; 

		if ( empty($key) || empty($val) ) return true;

		foreach ( $entity->get_items() as $item ) {
			$product = $item->get_product();
			if ( $product ) {
				$attr_val = $product->get_attribute( $key );
				if ( strpos( $attr_val, $val ) !== false ) {
					return true; 
				}
			}
		}
		return false; 
	}

	// --- ساخت Payload ---
	private static function build_payload( $entity, $raw_message ) {
		$data = [];
		$parsed_message = '';

		if ( is_a( $entity, 'WC_Order' ) ) {
			// داده‌های خام سفارش
			$data = [
				'id' => $entity->get_id(),
				'total' => $entity->get_total(),
				'currency' => $entity->get_currency(),
				'status' => $entity->get_status(),
				'customer_id' => $entity->get_customer_id(),
				'billing' => $entity->get_address('billing'),
                'items' => []
			];
            foreach($entity->get_items() as $item) {
                $data['items'][] = [
                    'name' => $item->get_name(),
                    'qty' => $item->get_quantity(),
                    'total' => $item->get_total()
                ];
            }
			
			// تبدیل شورت‌کدها (اینجا تابع جدید را صدا می‌زنیم)
			$parsed_message = self::parse_order_shortcodes( $raw_message, $entity );

		} elseif ( is_a( $entity, 'WP_User' ) ) {
			$data = [
				'id' => $entity->ID,
				'email' => $entity->user_email,
				'username' => $entity->user_login,
				'roles' => $entity->roles
			];
			$parsed_message = str_replace(
				['{user_id}', '{user_email}', '{user_name}'],
				[$entity->ID, $entity->user_email, $entity->display_name],
				$raw_message
			);
		}

		return [
			'json_data' => $data,
			'message'   => $parsed_message
		];
	}

    /**
     * پارسر قدرتمند شورت‌کدها (ادغام شده داخل کلاس)
     */
    private static function parse_order_shortcodes($text, $order) {
        if (empty($text)) return '';

        // تاریخ و ساعت
        $date_created = $order->get_date_created();
        $formatted_date = $date_created ? $date_created->date_i18n('Y/m/d') : '';
        $formatted_time = $date_created ? $date_created->date_i18n('H:i') : '';

        // تمیزکننده قیمت
        $clean_price = function($html_price) {
            return trim(strip_tags(html_entity_decode($html_price)));
        };

        $vars = [
            '{order_id}' => $order->get_id(),
            '{status}'   => wc_get_order_status_name($order->get_status()),
            '{date}'     => $formatted_date,
            '{time}'     => $formatted_time,
            '{total}'    => $clean_price(wc_price($order->get_total())), 
            '{total_raw}'=> $order->get_total(),
            '{payment_method}' => $order->get_payment_method_title(),
            '{transaction_id}' => $order->get_transaction_id(),
            '{full_name}' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            '{phone}'     => $order->get_billing_phone(),
            '{city}'      => $order->get_billing_city(),
            '{state}'     => $order->get_billing_state(),
            '{address}'   => $order->get_billing_address_1() . ' ' . $order->get_billing_address_2(),
            '{customer_note}' => $order->get_customer_note(),
            '{shipping_method}' => $order->get_shipping_method(),
            '{shipping_cost}'   => $clean_price(wc_price($order->get_shipping_total())),
        ];

        // ۱. لیست خلاصه
        if (strpos($text, '{items_summary}') !== false) {
            $lines = [];
            foreach ($order->get_items() as $item) {
                $lines[] = "▪️ " . $item->get_name() . " (×" . $item->get_quantity() . ")";
            }
            $vars['{items_summary}'] = implode("\n", $lines);
        }

        // ۲. لیست کامل
        if (strpos($text, '{items_detailed}') !== false) {
            $lines = [];
            foreach ($order->get_items() as $item) {
                $price_clean = $clean_price(wc_price($item->get_total()));
                $lines[] = "🛒 " . $item->get_name() . "\n   تعداد: " . $item->get_quantity() . " | قیمت کل: " . $price_clean;
            }
            $vars['{items_detailed}'] = implode("\n----------------\n", $lines);
        }

        // ۳. اسکرپر هوشمند (شامل تطبیق واریشن)
        if (strpos($text, '{_scrape_raw_result_}') !== false) {
            $scrape_list = "";

            foreach ($order->get_items() as $item) {
                $product = $item->get_product(); 
                
                if ($product) {
                    $price_display = "قیمت مبدا ندارد ❌";
                    $found_row = null;

                    // شناسایی والد
                    $parent_id = $product->is_type('variation') ? $product->get_parent_id() : $product->get_id();
                    
                    // دریافت دیتای خام
                    $raw_json = get_post_meta($parent_id, '_last_scrape_raw_result', true);
                    $scraped_rows = [];

                    if ($raw_json) {
                         $decoded = json_decode($raw_json, true);
                         if (!$decoded && is_string($raw_json)) $decoded = json_decode(stripslashes($raw_json), true);
                         
                         if ($decoded) {
                             if (!isset($decoded[0])) $scraped_rows = [$decoded];
                             else $scraped_rows = $decoded;
                         }
                    }

                    // موتور تطبیق (Matching Engine)
                    if (!empty($scraped_rows) && is_array($scraped_rows)) {
                        
                        if (!$product->is_type('variation')) {
                            $found_row = reset($scraped_rows);
                        } else {
                            foreach ($scraped_rows as $row) {
                                $is_match = true;
                                foreach ($row as $key => $val) {
                                    if (strpos($key, 'pa_') === 0) {
                                        $wc_attr_val = $product->get_attribute($key);
                                        $v1 = trim((string)$wc_attr_val);
                                        $v2 = trim((string)$val);
                                        if ($v1 !== $v2) {
                                            $is_match = false;
                                            break; 
                                        }
                                    }
                                }
                                if ($is_match) {
                                    $found_row = $row;
                                    break; 
                                }
                            }
                        }
                    }

                    // استخراج قیمت
                    if ($found_row) {
                        $p = null;
                        if (isset($found_row['price'])) $p = $found_row['price'];
                        elseif (isset($found_row['amount'])) $p = $found_row['amount'];
                        elseif (isset($found_row['lowest_price'])) $p = $found_row['lowest_price'];

                        if ($p) {
                            $price_display = number_format((float)$p) . " تومان ✅";
                        }
                    }
                    
                    $scrape_list .= "📦 " . $product->get_name() . "\n   💰 قیمت خرید: " . $price_display . "\n";
                }
            }
            
            if (empty($scrape_list)) $scrape_list = "هیچ داده اسکرپی یافت نشد.";
            $vars['{_scrape_raw_result_}'] = $scrape_list;
        }

        return str_replace(array_keys($vars), array_values($vars), $text);
    }
}