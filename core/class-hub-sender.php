<?php

class Hub_Sender {

	public static function init() {
		// گوش دادن به هوک جدید که توسط صف صدا زده می‌شود (Async Worker)
		add_action( 'hub_process_queue_item', array( __CLASS__, 'process_queue_item' ), 10, 1 );
	}

    /**
     * WORKER: این متد توسط Action Scheduler اجرا می‌شود.
     * شناسه صف را می‌گیرد، ارسال می‌کند و وضعیت دیتابیس را آپدیت می‌کند.
     */
    public static function process_queue_item( $queue_id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hub_queue';

        // 1. دریافت آیتم از دیتابیس
        $item = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $queue_id ) );

        // اگر قبلاً تکمیل شده یا وجود ندارد، خارج شو
        if ( ! $item || $item->status === 'completed' ) {
            return;
        }

        // 2. تغییر وضعیت به در حال پردازش
        Hub_Queue::update_status( $queue_id, 'processing' );

        $payload = json_decode( $item->payload, true );
        $type = $item->event_type;

        // 3. تلاش برای ارسال
        $result = self::dispatch( $type, $payload );

        // 4. آپدیت وضعیت نهایی بر اساس نتیجه ارسال
        if ( $result === true ) {
            Hub_Queue::update_status( $queue_id, 'completed' );
        } else {
            Hub_Queue::update_status( $queue_id, 'failed' );
            // اگر نیاز باشد می‌توان اینجا لاجیک "تلاش مجدد" (Retry) را هم اضافه کرد
        }
    }

    // ارسال آنی (بدون صف - مثلا برای دکمه تست)
    public static function send_immediate( $type, $args ) {
        return self::dispatch( $type, $args );
    }

    /**
     * Dispatcher: توزیع‌کننده مرکزی
     * تغییر: حالا مقدار true/false برمی‌گرداند
     */
    private static function dispatch( $type, $args ) {
        switch ( $type ) {
            case 'n8n.send':
                return self::send_to_n8n( $args );
            case 'sms.send':
                return self::send_sms( $args );
            case 'telegram.send':
                return self::send_telegram( $args );
            default:
                return false; 
        }
    }

	private static function send_to_n8n( $data ) {
		$url = $data['_webhook_url'] ?? '';
		if ( empty( $url ) ) return false;

		unset( $data['_webhook_url'] );

        // مدیریت حالت تست
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
            Hub_Logger::log( 'error', 'n8n', 'خطا در ارسال: ' . $res->get_error_message() );
            return false;
        } 
        
        // بررسی کد وضعیت HTTP
        $code = wp_remote_retrieve_response_code($res);
        if ( $code >= 200 && $code < 300 ) {
            if($is_test) Hub_Logger::log( 'info', 'n8n', 'تست موفق n8n' );
            return true;
        } else {
            Hub_Logger::log( 'error', 'n8n', "خطای سرور مقصد ($code): " . wp_remote_retrieve_body($res) );
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
        $payload = array(
            'username' => $user,
            'password' => $pass,
            'to' => $to,
            'from' => $data['from'] ?? '',
            'text' => $text,
            'isflash' => false
        );

        // لاجیک پترن (SharedLine)
        if ( strpos( $text, '@' ) === 0 ) {
            $parts = explode( '@', substr( $text, 1 ) );
            if ( count( $parts ) >= 2 ) {
                $api_url = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
                $payload = array(
                    'username' => $user,
                    'password' => $pass,
                    'text' => implode(';', explode(';', $parts[1])),
                    'to' => $to,
                    'bodyId' => intval($parts[0])
                );
            }
        }

        $res = wp_remote_post( $api_url, array(
            'body'    => $payload,
            'headers' => array('Content-Type' => 'application/x-www-form-urlencoded'),
            'timeout' => 15
        ));
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'error', 'sms', 'خطای اتصال: ' . $res->get_error_message() );
            return false;
        } else {
            $json = json_decode(wp_remote_retrieve_body($res), true);
            // بررسی موفقیت بر اساس پاسخ ملی پیامک
            if( (isset($json['Value']) && strlen($json['Value']) > 5) || (isset($json['RetStatus']) && $json['RetStatus'] == 1) ) {
                 return true;
            } else {
                 Hub_Logger::log( 'error', 'sms', 'خطای پنل: ' . ($json['StrRetStatus'] ?? 'Unknown Error') );
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
            'body' => json_encode([
                'chat_id' => $chat_id,
                'text' => $data['message'],
                'parse_mode' => 'HTML'
            ]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15
        ];

        if(!empty($proxy)) $args['proxy'] = $proxy; 

        $res = wp_remote_post($url, $args);
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'error', 'telegram', 'خطا: ' . $res->get_error_message() );
            return false;
        }
        
        $body = json_decode(wp_remote_retrieve_body($res), true);
        if ( isset($body['ok']) && $body['ok'] == true ) {
            return true;
        } else {
            Hub_Logger::log( 'error', 'telegram', 'خطای API: ' . ($body['description'] ?? 'Unknown') );
            return false;
        }
    }
}