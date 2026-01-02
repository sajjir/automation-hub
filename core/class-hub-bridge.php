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
			if ( $rule['trigger'] !== $trigger_type ) continue;
			if ( $trigger_type === 'order_status' && !empty($rule['sub_trigger']) && $rule['sub_trigger'] !== $sub_trigger ) continue;

			// 1. n8n
			if ( !empty($rule['active_n8n']) && !empty($rule['webhook_id']) && isset($wh_map[$rule['webhook_id']]) ) {
				$payload = self::build_payload_n8n( $entity, $rule['message_n8n'] ?? '' );
				$payload['_webhook_url'] = $wh_map[$rule['webhook_id']]['url'];
				Hub_Queue::push( 'n8n.send', $payload );
			}

			// 2. SMS
			if ( !empty($rule['active_sms']) ) {
                $target_num = '';
                if ( ($rule['sms_target'] ?? 'customer') === 'customer' ) {
                    if ( is_a($entity, 'WC_Order') ) $target_num = $entity->get_billing_phone();
                    elseif ( is_a($entity, 'WP_User') ) $target_num = get_user_meta($entity->ID, 'billing_phone', true);
                } else {
                    $target_num = $rule['sms_custom_num'] ?? '';
                }

                if ( !empty($target_num) ) {
                    $msg = self::parse_shortcodes( $rule['message_sms'] ?? '', $entity );
                    Hub_Queue::push( 'sms.send', [ 'mobile' => $target_num, 'message' => $msg ] );
                }
			}

            // 3. Telegram
            if ( !empty($rule['active_tg']) && !empty($rule['tg_bot_id']) && isset($wh_map[$rule['tg_bot_id']]) ) {
                $bot_token = $wh_map[$rule['tg_bot_id']]['url']; 
                $chat_id = $rule['tg_chat_id'] ?? '';
                
                if ( !empty($chat_id) ) {
                    $msg = self::parse_shortcodes( $rule['message_tg'] ?? '', $entity );
                    Hub_Queue::push( 'telegram.send', [ 'token' => $bot_token, 'chat_id' => $chat_id, 'message' => $msg ] );
                }
            }
		}
	}

	private static function build_payload_n8n( $entity, $raw_msg ) {
        $data = [];
        if ( is_a( $entity, 'WC_Order' ) ) {
            $data = [ 'id' => $entity->get_id(), 'total' => $entity->get_total(), 'status' => $entity->get_status(), 'billing' => $entity->get_address('billing') ];
            foreach($entity->get_items() as $item) $data['items'][] = [ 'name' => $item->get_name(), 'qty' => $item->get_quantity(), 'total' => $item->get_total() ];
        }
        return [ 'json_data' => $data, 'message' => self::parse_shortcodes( $raw_msg, $entity ) ];
	}

    private static function parse_shortcodes($text, $entity) {
        if (empty($text)) return '';
        if ( is_a( $entity, 'WC_Order' ) ) {
            $date_created = $entity->get_date_created();
            $vars = [
                '{order_id}' => $entity->get_id(),
                '{status}' => wc_get_order_status_name($entity->get_status()),
                '{date}' => $date_created ? $date_created->date_i18n('Y/m/d') : '',
                '{full_name}' => $entity->get_billing_first_name() . ' ' . $entity->get_billing_last_name(),
                '{total}' => strip_tags(wc_price($entity->get_total())),
                '{_scrape_raw_result_}' => '' // Logic for scraper would go here or be simplified
            ];
            // Simplified scraper logic for brevity - ensure full logic is kept if you have the parsing function
            return str_replace(array_keys($vars), array_values($vars), $text);
        }
        return $text;
    }
}