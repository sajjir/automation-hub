<?php

class Hub_Bridge {

	public static function init() {
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'handle_order_status' ), 10, 4 );
		add_action( 'woocommerce_new_order', array( __CLASS__, 'handle_new_order' ), 10, 1 );
		add_action( 'user_register', array( __CLASS__, 'handle_user_register' ), 10, 1 );
	}

	public static function handle_order_status( $order_id, $from, $to, $order ) { self::process_rules( 'order_status', $order, 'wc-' . $to ); }
	public static function handle_new_order( $order_id ) { $order = wc_get_order( $order_id ); self::process_rules( 'order_created', $order ); }
	public static function handle_user_register( $user_id ) { $user = get_userdata( $user_id ); self::process_rules( 'user_register', $user ); }

	private static function process_rules( $trigger_type, $entity, $sub_trigger = null ) {
		$rules = get_option( 'hub_rules', [] );
		$webhooks = get_option( 'hub_webhooks', [] );
		$wh_map = []; foreach($webhooks as $wh) $wh_map[$wh['id']] = $wh;

		foreach ( $rules as $rule ) {
			// بررسی شرایط اجرا
			if ( $rule['trigger'] !== $trigger_type ) continue;
			if ( $trigger_type === 'order_status' && !empty($rule['sub_trigger']) && $rule['sub_trigger'] !== $sub_trigger ) continue;

            // --- مرحله ۱: محاسبه داده‌های SMS (قبل از ارسال) ---
            $sms_info = [ 'active' => false, 'target_role' => 'none', 'number' => '', 'message' => '' ];
            if ( !empty($rule['active_sms']) ) {
                $sms_info['active'] = true;
                $sms_info['target_role'] = $rule['sms_target'] ?? 'customer';
                
                // پیدا کردن شماره
                if ( $sms_info['target_role'] === 'customer' ) {
                    if ( is_a($entity, 'WC_Order') ) $sms_info['number'] = $entity->get_billing_phone();
                    elseif ( is_a($entity, 'WP_User') ) $sms_info['number'] = get_user_meta($entity->ID, 'billing_phone', true);
                } else {
                    $sms_info['number'] = $rule['sms_custom_num'] ?? '';
                }

                // ساخت متن نهایی
                $sms_info['message'] = self::parse_shortcodes( $rule['message_sms'] ?? '', $entity );
            }

            // --- مرحله ۲: محاسبه داده‌های تلگرام (قبل از ارسال) ---
            $tg_info = [ 'active' => false, 'bot_name' => '', 'chat_id' => '', 'message' => '' ];
            if ( !empty($rule['active_tg']) && !empty($rule['tg_bot_id']) && isset($wh_map[$rule['tg_bot_id']]) ) {
                $tg_info['active'] = true;
                $tg_info['bot_name'] = $wh_map[$rule['tg_bot_id']]['name'];
                $tg_info['chat_id'] = $rule['tg_chat_id'] ?? '';
                $tg_info['message'] = self::parse_shortcodes( $rule['message_tg'] ?? '', $entity );
            }

            // --- مرحله ۳: ارسال به n8n (شامل گزارش کامل SMS و تلگرام) ---
			if ( !empty($rule['active_n8n']) && !empty($rule['webhook_id']) && isset($wh_map[$rule['webhook_id']]) ) {
				$msg_n8n = self::parse_shortcodes( $rule['message_n8n'] ?? '', $entity );
				$payload = self::build_payload_n8n( $entity, $msg_n8n );
                
                // تزریق گزارش کامل سناریو برای ایجنت
                $payload['scenario_execution_log'] = [
                    'rule_index' => 'dynamic', // می‌توان ایندکس را هم پاس داد
                    'trigger_matched' => $trigger_type,
                    'sms_action' => $sms_info, // آبجکت کامل اس‌ام‌اس
                    'telegram_action' => $tg_info // آبجکت کامل تلگرام
                ];
                
				$payload['_webhook_url'] = $wh_map[$rule['webhook_id']]['url'];
				Hub_Queue::push( 'n8n.send', $payload );
			}

			// --- مرحله ۴: ارسال واقعی به صف SMS ---
			if ( $sms_info['active'] && !empty($sms_info['number']) ) {
                Hub_Queue::push( 'sms.send', [ 'mobile' => $sms_info['number'], 'message' => $sms_info['message'] ] );
			}

            // --- مرحله ۵: ارسال واقعی به صف تلگرام ---
            if ( $tg_info['active'] && !empty($tg_info['chat_id']) && !empty($tg_info['message']) ) {
                // نیاز به توکن داریم که در wh_map است
                $bot_token = $wh_map[$rule['tg_bot_id']]['url'];
                Hub_Queue::push( 'telegram.send', [ 'token' => $bot_token, 'chat_id' => $tg_info['chat_id'], 'message' => $tg_info['message'] ] );
            }
		}
	}

	private static function build_payload_n8n( $entity, $processed_msg ) {
        $data = [];
        if ( is_a( $entity, 'WC_Order' ) ) {
            $data = [ 
                'id' => $entity->get_id(), 
                'total' => $entity->get_total(), 
                'status' => $entity->get_status(), 
                'billing' => $entity->get_address('billing'),
                'shipping_address' => $entity->get_address('shipping')
            ];
            foreach($entity->get_items() as $item) $data['items'][] = [ 'name' => $item->get_name(), 'qty' => $item->get_quantity(), 'total' => $item->get_total() ];
        } elseif ( is_a( $entity, 'WP_User' ) ) {
            $data = [ 'id' => $entity->ID, 'email' => $entity->user_email ];
        }
        return [ 'json_data' => $data, 'message' => $processed_msg ];
	}

    // پارسر داخلی شورت‌کدها
    private static function parse_shortcodes($text, $entity) {
        if (empty($text)) return '';
        
        if ( is_a( $entity, 'WC_Order' ) ) {
            $order = $entity;
            $date_created = $order->get_date_created();
            
            $clean_price = function($html_price) { return trim(strip_tags(html_entity_decode($html_price))); };

            $vars = [
                '{order_id}' => $order->get_id(),
                '{status}' => wc_get_order_status_name($order->get_status()),
                '{date}' => $date_created ? $date_created->date_i18n('Y/m/d') : '',
                '{full_name}' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                '{phone}' => $order->get_billing_phone(),
                '{address}' => $order->get_billing_address_1() . ' ' . $order->get_billing_address_2(),
                '{city}' => $order->get_billing_city(),
                '{customer_note}' => $order->get_customer_note(),
                '{shipping_method}' => $order->get_shipping_method(),
                '{shipping_cost}' => $clean_price(wc_price($order->get_shipping_total())),
                '{total}' => $clean_price(wc_price($order->get_total())),
            ];

            if (strpos($text, '{items_detailed}') !== false) {
                $lines = [];
                foreach ($order->get_items() as $item) $lines[] = "🛒 " . $item->get_name() . " (×" . $item->get_quantity() . ")";
                $vars['{items_detailed}'] = implode("\n", $lines);
            }

            if (strpos($text, '{_scrape_raw_result_}') !== false) {
                $scrape_list = "";
                foreach ($order->get_items() as $item) {
                    $product = $item->get_product(); 
                    if ($product) {
                        $parent_id = $product->is_type('variation') ? $product->get_parent_id() : $product->get_id();
                        $raw_json = get_post_meta($parent_id, '_last_scrape_raw_result', true);
                        $price_display = "❌";
                        
                        if($raw_json) {
                            $decoded = json_decode($raw_json, true);
                            if(!$decoded && is_string($raw_json)) $decoded = json_decode(stripslashes($raw_json), true);
                            $rows = $decoded ? (isset($decoded[0]) ? $decoded : [$decoded]) : [];
                            
                            $found = null;
                            if(!$product->is_type('variation')) { $found = reset($rows); }
                            else {
                                foreach($rows as $r) {
                                    $match = true;
                                    foreach($r as $k=>$v) { if(strpos($k,'pa_')===0 && trim((string)$product->get_attribute($k)) !== trim((string)$v)) { $match=false; break; } }
                                    if($match) { $found=$r; break; }
                                }
                            }
                            if($found) {
                                $p = $found['price'] ?? $found['amount'] ?? $found['lowest_price'] ?? null;
                                if($p) $price_display = number_format((float)$p) . " تومان";
                            }
                        }
                        $scrape_list .= "📦 " . $product->get_name() . "\n💰 خرید: " . $price_display . "\n";
                    }
                }
                $vars['{_scrape_raw_result_}'] = $scrape_list;
            }

            return str_replace(array_keys($vars), array_values($vars), $text);
        }
        
        if ( is_a( $entity, 'WP_User' ) ) {
            return str_replace(['{user_id}', '{user_email}', '{user_name}'], [$entity->ID, $entity->user_email, $entity->display_name], $text);
        }

        return $text;
    }
}