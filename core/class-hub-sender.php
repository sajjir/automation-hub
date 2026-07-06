<?php

class Hub_Sender {

	public static function init() {
		add_action( 'hub_process_queue_item', array( __CLASS__, 'process_queue_item' ), 10, 1 );
	}

    public static function process_queue_item( $args ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hub_queue';

        $queue_id = ( is_array($args) && isset($args['id']) ) ? $args['id'] : $args;
        if ( empty($queue_id) ) return;

        $item = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $queue_id ) );

        if ( ! $item || $item->status === 'completed' || $item->status === 'cancelled' ) {
            return;
        }

        Hub_Queue::update_status( $queue_id, 'processing' );

        $payload = json_decode( $item->payload, true );
        $type = $item->event_type;
        $entity_id = intval($item->entity_id);
        $rule_id = intval($item->rule_id);
        
        $trigger_type = $payload['trigger_type'] ?? '';
        $action_conf  = $payload['action_config'] ?? [];
        $entity = null;

        // بازیابی Fresh Entity و بررسی مجدد شرط‌ها برای سفارش‌ها
        if ( in_array($trigger_type, ['order_status', 'order_created']) && $entity_id > 0 ) {
            $entity = wc_get_order( $entity_id );
            
            if ( $entity ) {
                $rules = get_option( 'hub_rules', [] );
                $rule = $rules[$rule_id] ?? null;

                if ( $rule && ! Hub_Condition::evaluate( $entity, $trigger_type, $rule ) ) {
                    Hub_Logger::log( "Action Aborted: Order #{$entity_id} no longer matches conditions.", 'warning', 'sender' );
                    Hub_Queue::cancel_pending_for_order( $entity_id, $rule_id );
                    return; // توقف پردازش
                }
            }
        } elseif ( $trigger_type === 'user_register' && $entity_id > 0 ) {
            $entity = get_userdata( $entity_id );
        } else {
            // برای CF7 و Auth
            $entity = (object) $payload['entity_data'];
        }

        // پردازش شورت‌کدها با دیتای تازه
        $raw_message = $action_conf['message'] ?? '';
        $raw_target  = $action_conf['target'] ?? '';
        
        $processed_msg = Hub_Bridge::parse_shortcodes( $raw_message, $entity );
        $processed_target = Hub_Bridge::parse_shortcodes( $raw_target, $entity );

        // گرفتن تنظیمات اتصال
        $conn_id = $action_conf['connection_id'] ?? '';
        $webhooks = get_option('hub_webhooks', []);
        $conn = null;
        foreach($webhooks as $wh) { if($wh['id'] === $conn_id) { $conn = $wh; break; } }

        $dispatch_args = [];
        $send_type = $action_conf['type'] ?? 'webhook';

        if ( $send_type === 'webhook' && $conn ) {
            // n8n
            if ( is_a($entity, 'WC_Order') ) {
                // تابع ساخت پی‌لود اختصاصی (باید در Bridge آپدیت شده وجود داشته باشد یا همینجا دستی بسازیم)
                $data = [ 
                    'id' => $entity->get_id(), 
                    'total' => $entity->get_total(), 
                    'status' => $entity->get_status(), 
                    'billing' => $entity->get_address('billing'),
                ];
                $dispatch_args = [ 'json_data' => $data, 'message' => $processed_msg, '_webhook_url' => $conn['url'] ];
            } elseif ( isset($entity->form_id) ) {
                $dispatch_args = [ 'json_data' => $entity, 'message' => $processed_msg, '_webhook_url' => $conn['url'] ];
            }
        } elseif ( $send_type === 'sms' && $conn ) {
            $processed_target = Hub_Bridge::normalize_number($processed_target);
            $dispatch_args = [
                'mobile' => $processed_target, 'message' => $processed_msg,
                'user' => $conn['sms_user'], 'pass' => $conn['sms_pass'], 'from' => $conn['sms_from']
            ];
        } elseif ( $send_type === 'telegram' && $conn ) {
            $dispatch_args = [ 'token' => $conn['url'], 'chat_id' => $processed_target, 'message' => $processed_msg ];
        } elseif ( $send_type === 'email' ) {
            $dispatch_args = [ 'email' => $processed_target, 'message' => $processed_msg, 'subject' => 'اطلاع رسانی اتوماسیون' ];
        }

        $result = self::dispatch( $send_type . '.send', $dispatch_args );

        if ( $result === true ) {
            Hub_Queue::update_status( $queue_id, 'completed' );
        } else {
            Hub_Queue::update_status( $queue_id, 'failed' );
        }
    }

    public static function send_immediate( $type, $args ) {
        return self::dispatch( $type, $args );
    }

    private static function dispatch( $type, $args ) {
        switch ( $type ) {
            case 'webhook.send':
            case 'n8n.send':
                return self::send_to_n8n( $args );
            case 'sms.send':
                return self::send_sms( $args );
            case 'telegram.send':
                return self::send_telegram( $args );
            case 'email.send':
                return wp_mail($args['email'] ?? '', $args['subject'] ?? '', $args['message'] ?? '');
            default:
                return false; 
        }
    }

	private static function send_to_n8n( $data ) {
		$url = $data['_webhook_url'] ?? '';
		if ( empty( $url ) ) return false;
		unset( $data['_webhook_url'] );

        $is_test = !empty($data['is_test_run']);
        if(isset($data['is_test_run'])) unset($data['is_test_run']);

		$args = array(
			'body'        => json_encode( $data ),
			'headers'     => array( 'Content-Type' => 'application/json' ),
			'timeout'     => 20,
			'blocking'    => true,
            'sslverify'   => false,
		);
		$res = wp_remote_post( $url, $args );
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'خطا در ارسال n8n: ' . $res->get_error_message(), 'error', 'n8n' );
            return false;
        } 
        $code = wp_remote_retrieve_response_code($res);
        if ( $code >= 200 && $code < 300 ) {
            if($is_test) Hub_Logger::log( 'تست موفق n8n', 'info', 'n8n' );
            return true;
        } else {
            Hub_Logger::log( "خطای سرور مقصد ($code): " . wp_remote_retrieve_body($res), 'error', 'n8n' );
            return false;
        }
	}

	private static function send_sms( $data ) {
        $user = $data['user'] ?? '';
        $pass = $data['pass'] ?? '';
        $to   = $data['mobile'] ?? '';
        $text = $data['message'] ?? '';
        if(empty($user) || empty($pass) || empty($to)) return false;

        $api_url = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
        $payload = array( 'username' => $user, 'password' => $pass, 'to' => $to, 'from' => $data['from'] ?? '', 'text' => $text, 'isflash' => false );

        if ( strpos( $text, '@' ) === 0 ) {
            $parts = explode( '@', substr( $text, 1 ) );
            if ( count( $parts ) >= 2 ) {
                $api_url = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
                $payload = array( 'username' => $user, 'password' => $pass, 'text' => implode(';', explode(';', $parts[1])), 'to' => $to, 'bodyId' => intval($parts[0]) );
            }
        }

        $res = wp_remote_post( $api_url, array( 'body' => $payload, 'headers' => array('Content-Type' => 'application/x-www-form-urlencoded'), 'timeout' => 15 ));
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'خطای اتصال پیامک: ' . $res->get_error_message(), 'error', 'sms' );
            return false;
        } else {
            $json = json_decode(wp_remote_retrieve_body($res), true);
            if( (isset($json['Value']) && strlen($json['Value']) > 5) || (isset($json['RetStatus']) && $json['RetStatus'] == 1) ) {
                 return true;
            } else {
                 Hub_Logger::log( 'خطای پنل پیامک: ' . ($json['StrRetStatus'] ?? 'Unknown'), 'error', 'sms' );
                 return false;
            }
        }
	}

    private static function send_telegram( $data ) {
        $token = $data['token'] ?? '';
        $chat_id = $data['chat_id'] ?? '';
        if(empty($token) || empty($chat_id)) return false;

        $proxy = get_option('hub_telegram_proxy'); 
        $url = "https://api.telegram.org/bot$token/sendMessage";
        $args = [
            'body' => json_encode(['chat_id' => $chat_id, 'text' => $data['message'], 'parse_mode' => 'HTML']),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15
        ];

        if(!empty($proxy)) $args['proxy'] = $proxy; 
        $res = wp_remote_post($url, $args);
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'خطای اتصال تلگرام: ' . $res->get_error_message(), 'error', 'telegram' );
            return false;
        }
        
        $body = json_decode(wp_remote_retrieve_body($res), true);
        if ( isset($body['ok']) && $body['ok'] == true ) {
            return true;
        } else {
            Hub_Logger::log( 'خطای API تلگرام: ' . ($body['description'] ?? 'Unknown'), 'error', 'telegram' );
            return false;
        }
    }
}