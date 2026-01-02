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
		
		// تبدیل لیست وب‌هوک به فرمت Key-Value برای دسترسی سریع
		$webhook_map = [];
		foreach($webhooks as $wh) $webhook_map[$wh['id']] = $wh;

		foreach ( $rules as $rule ) {
			// 1. بررسی تریگر اصلی
			if ( $rule['trigger'] !== $trigger_type ) continue;

			// 2. بررسی ساب-تریگر (مثلاً وضعیت خاص سفارش)
			if ( $trigger_type === 'order_status' && !empty($rule['sub_trigger']) ) {
				if ( $rule['sub_trigger'] !== $sub_trigger ) continue;
			}

			// 3. بررسی شرط‌های پیشرفته (Advanced Conditions)
			if ( !empty($rule['condition_active']) ) {
				if ( !self::check_complex_condition( $rule, $entity ) ) continue;
			}

			// 4. یافتن وب‌هوک مقصد
			$webhook_id = $rule['webhook_id'] ?? '';
			if ( empty($webhook_id) || !isset($webhook_map[$webhook_id]) ) continue;

			$target_webhook = $webhook_map[$webhook_id];

			// 5. آماده‌سازی داده‌ها (Hybrid Payload)
			$payload = self::build_payload( $entity, $rule['message'] );

			// 6. افزودن به صف
			Hub_Queue::push( $trigger_type, $payload );
		}
	}

	// --- بررسی شرط‌های پیچیده ---
	private static function check_complex_condition( $rule, $entity ) {
		// فعلاً فقط برای سفارش پیاده‌سازی شده (طبق درخواست شما)
		if ( !is_a( $entity, 'WC_Order' ) ) return true;

		$key = $rule['condition_key'] ?? ''; // مثلاً pa_guarantee
		$val = $rule['condition_val'] ?? ''; // مثلاً طلایی

		if ( empty($key) || empty($val) ) return true; // شرط ناقص است، رد شویم (یا سخت بگیریم؟)

		// حلقه روی اقلام سفارش
		foreach ( $entity->get_items() as $item ) {
			$product = $item->get_product();
			if ( $product ) {
				// دریافت ویژگی
				$attr_val = $product->get_attribute( $key );
				// بررسی "شامل بودن" (Contains)
				if ( strpos( $attr_val, $val ) !== false ) {
					return true; // شرط برقرار شد!
				}
			}
		}

		return false; // هیچ محصولی شرط را نداشت
	}

	// --- ساخت Payload هیبریدی ---
	private static function build_payload( $entity, $raw_message ) {
		$data = [];
		$parsed_message = '';

		if ( is_a( $entity, 'WC_Order' ) ) {
			// داده‌های خام سفارش (برای n8n)
			$data = [
				'id' => $entity->get_id(),
				'total' => $entity->get_total(),
				'currency' => $entity->get_currency(),
				'status' => $entity->get_status(),
				'customer_id' => $entity->get_customer_id(),
				'billing' => $entity->get_address('billing'),
                'items' => []
			];
            // افزودن آیتم‌ها به جیسون
            foreach($entity->get_items() as $item) {
                $data['items'][] = [
                    'name' => $item->get_name(),
                    'qty' => $item->get_quantity(),
                    'total' => $item->get_total()
                ];
            }
			
			// پارس کردن پیام متنی (برای تلگرام)
			// اینجا از تابع sajj_parse_shortcodes که قبلاً داشتید استفاده می‌کنیم (یا بازنویسی شده‌اش)
			$parsed_message = self::parse_order_shortcodes( $raw_message, $entity );

		} elseif ( is_a( $entity, 'WP_User' ) ) {
			// داده‌های کاربر
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
			'json_data' => $data,       // دیتای فنی برای n8n
			'message'   => $parsed_message // پیام آماده برای تلگرام
		];
	}

    // نسخه داخلی پارسر شورت‌کد سفارش (خلاصه شده برای این فایل)
    private static function parse_order_shortcodes($text, $order) {
        // ... (کد پارسر شورت‌کد که قبلاً نوشتیم اینجا قرار می‌گیرد)
        // برای جلوگیری از شلوغی، فرض می‌کنیم تابع sajj_parse_shortcodes شما در دسترس است
        // یا کدش را اینجا کپی می‌کنید.
        if(function_exists('sajj_parse_shortcodes')) {
            return sajj_parse_shortcodes($text, $order);
        }
        return $text;
    }
}