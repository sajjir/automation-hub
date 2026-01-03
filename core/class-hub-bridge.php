<?php

class Hub_Bridge {

	public static function init() {
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'handle_order_status' ), 10, 4 );
		add_action( 'woocommerce_new_order', array( __CLASS__, 'handle_new_order' ), 10, 1 );
		add_action( 'user_register', array( __CLASS__, 'handle_user_register' ), 10, 1 );
        
        // --- هوک جدید برای لاگین ---
        add_action( 'hub_auth_request', array( __CLASS__, 'handle_auth_request' ), 10, 2 );
	}

    // --- هندلرهای رویداد ---
	public static function handle_order_status( $order_id, $from, $to, $order ) { self::process_rules( 'order_status', $order, 'wc-' . $to ); }
	public static function handle_new_order( $order_id ) { $order = wc_get_order( $order_id ); self::process_rules( 'order_created', $order ); }
	public static function handle_user_register( $user_id ) { $user = get_userdata( $user_id ); self::process_rules( 'user_register', $user ); }
    
    // هندلر جدید: وقتی کسی کد OTP خواست
    public static function handle_auth_request( $phone, $otp ) {
        // ساخت یک شیء ساختگی برای ارسال به پارسر
        $data = (object) [ 'phone' => $phone, 'otp' => $otp ];
        self::process_rules( 'auth_request', $data );
    }

	// --- هسته پردازش ---
	private static function process_rules( $trigger_type, $entity, $sub_trigger = null ) {
		$rules = get_option( 'hub_rules', [] );
		$webhooks = get_option( 'hub_webhooks', [] );
		$wh_map = []; foreach($webhooks as $wh) $wh_map[$wh['id']] = $wh;

		foreach ( $rules as $rule ) {
			if ( $rule['trigger'] !== $trigger_type ) continue;
			if ( $trigger_type === 'order_status' && !empty($rule['sub_trigger']) && $rule['sub_trigger'] !== $sub_trigger ) continue;

            $msg_n8n = self::parse_shortcodes( $rule['message_n8n'] ?? '', $entity );
            $msg_sms = !empty($rule['active_sms']) ? self::parse_shortcodes( $rule['message_sms'] ?? '', $entity ) : '';
            $msg_tg  = !empty($rule['active_tg']) ? self::parse_shortcodes( $rule['message_tg'] ?? '', $entity ) : '';

			// 1. n8n
			if ( !empty($rule['active_n8n']) && !empty($rule['webhook_id']) && isset($wh_map[$rule['webhook_id']]) ) {
				$payload = self::build_payload_n8n( $entity, $msg_n8n );
                $payload['sms_message_preview'] = $msg_sms;
                $payload['telegram_message_preview'] = $msg_tg;
                $payload['scenario_execution_log'] = [
                    'rule_trigger' => $trigger_type,
                    'sms_action' => ['active'=>!empty($rule['active_sms']), 'message'=>$msg_sms],
                    'telegram_action' => ['active'=>!empty($rule['active_tg']), 'message'=>$msg_tg]
                ];
				$payload['_webhook_url'] = $wh_map[$rule['webhook_id']]['url'];
				Hub_Queue::push( 'n8n.send', $payload );
			}

			// 2. SMS (مخصوص Auth: گیرنده همیشه شماره موبایل درخواست کننده است)
			if ( !empty($rule['active_sms']) && !empty($msg_sms) && !empty($rule['sms_provider_id']) ) {
                $target_num = '';
                
                // در حالت Auth، شماره گیرنده همان شماره‌ای است که کاربر وارد کرده
                if ( $trigger_type === 'auth_request' && isset($entity->phone) ) {
                    $target_num = $entity->phone;
                } 
                // در حالت‌های دیگر (سفارش و...)
                else {
                    if ( ($rule['sms_target'] ?? 'customer') === 'customer' ) {
                        if ( is_a($entity, 'WC_Order') ) $target_num = $entity->get_billing_phone();
                        elseif ( is_a($entity, 'WP_User') ) $target_num = get_user_meta($entity->ID, 'billing_phone', true);
                    } else {
                        $target_num = $rule['sms_custom_num'] ?? '';
                    }
                }

                $target_num = self::normalize_number($target_num);

                if ( !empty($target_num) && isset($wh_map[$rule['sms_provider_id']]) ) {
                    $provider = $wh_map[$rule['sms_provider_id']];
                    Hub_Queue::push( 'sms.send', [ 
                        'mobile' => $target_num, 'message' => $msg_sms,
                        'user' => $provider['sms_user'], 'pass' => $provider['sms_pass'], 'from' => $provider['sms_from']
                    ]);
                }
			}

            // 3. Telegram
            if ( !empty($rule['active_tg']) && !empty($rule['tg_bot_id']) && isset($wh_map[$rule['tg_bot_id']]) && !empty($msg_tg) ) {
                $bot_token = $wh_map[$rule['tg_bot_id']]['url']; 
                $chat_id = $rule['tg_chat_id'] ?? '';
                if ( !empty($chat_id) ) {
                    Hub_Queue::push( 'telegram.send', [ 'token' => $bot_token, 'chat_id' => $chat_id, 'message' => $msg_tg ] );
                }
            }
		}
	}

	private static function build_payload_n8n( $entity, $processed_msg ) {
        $data = [];
        // پشتیبانی از آبجکت Auth
        if ( isset($entity->otp) ) {
            $data = [ 'event' => 'auth_request', 'phone' => $entity->phone, 'otp' => $entity->otp ];
        } elseif ( is_a( $entity, 'WC_Order' ) ) {
            $data = [ 'id' => $entity->get_id(), 'total' => $entity->get_total(), 'status' => $entity->get_status(), 'billing' => $entity->get_address('billing') ];
            foreach($entity->get_items() as $item) $data['items'][] = [ 'name' => $item->get_name(), 'qty' => $item->get_quantity(), 'total' => $item->get_total() ];
        } elseif ( is_a( $entity, 'WP_User' ) ) {
            $data = [ 'id' => $entity->ID, 'email' => $entity->user_email ];
        }
        return [ 'json_data' => $data, 'message' => $processed_msg ];
	}

    private static function normalize_number($number) {
        if(empty($number)) return '';
        $number = preg_replace('/[^0-9]/', '', $number);
        // اگر پترن شروع با @ باشد، نیازی به تبدیل نیست (چون پترن است)
        // اما اگر شماره است:
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str_replace($persian, $english, $number);
    }

    private static function parse_shortcodes($text, $entity) {
        if (empty($text)) return '';
        
        // --- 1. اگر مربوط به OTP است ---
        if ( isset($entity->otp) ) {
            $vars = [
                '{otp}' => $entity->otp,
                '{phone}' => $entity->phone,
            ];
            return str_replace(array_keys($vars), array_values($vars), $text);
        }

        // --- 2. اگر مربوط به سفارش است ---
        if ( is_a( $entity, 'WC_Order' ) ) {
            $order = $entity;
            $clean_price = function($html_price) { return trim(strip_tags(html_entity_decode($html_price))); };
            $fname = $order->get_billing_first_name();
            $lname = $order->get_billing_last_name();

            $vars = [
                '{order_id}' => $order->get_id(),
                '{status}' => wc_get_order_status_name($order->get_status()),
                '{full_name}' => $fname . ' ' . $lname,
                '{first_name}' => $fname,
                '{b_first_name}' => $fname,
                '{phone}' => $order->get_billing_phone(),
                '{total}' => $clean_price(wc_price($order->get_total())),
            ];
            // ... (بقیه کدهای اسکرپر قبلی را اینجا بگذارید) ...
            if (strpos($text, '{_scrape_raw_result_}') !== false) { /* ... کد اسکرپر ... */ }

            return str_replace(array_keys($vars), array_values($vars), $text);
        }
        return $text;
    }
}