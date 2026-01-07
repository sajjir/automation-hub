<?php

class Hub_Sender {

	public static function init() {
		// گوش دادن به صف (برای کارهای غیرضروری مثل تغییر وضعیت سفارش)
		add_action( 'hub_process_queue_event', array( __CLASS__, 'handle_queued_event' ), 10, 2 );
	}

    // این متد توسط صف صدا زده می‌شود
	public static function handle_queued_event( $type, $args ) {
        self::dispatch( $type, $args );
	}

    // متد جدید: ارسال آنی (بدون صف)
    public static function send_immediate( $type, $args ) {
        self::dispatch( $type, $args );
    }

    // مغز متفکر ارسال (مشترک بین صف و ارسال آنی)
    private static function dispatch( $type, $args ) {
        switch ( $type ) {
            case 'n8n.send':
                self::send_to_n8n( $args );
                break;
            case 'sms.send':
                self::send_sms( $args );
                break;
            case 'telegram.send':
                self::send_telegram( $args );
                break;
        }
    }

	private static function send_to_n8n( $data ) {
		$url = $data['_webhook_url'] ?? '';
		if ( empty( $url ) ) return;

		unset( $data['_webhook_url'] );

		$args = array(
			'body'        => json_encode( $data ),
			'headers'     => array( 'Content-Type' => 'application/json' ),
			'timeout'     => 15, // کاهش تایم‌اوت برای جلوگیری از کندی سایت در حالت آنی
			'blocking'    => true,
            'sslverify'   => false,
		);

		$res = wp_remote_post( $url, $args );
        
        // لاگ کردن نتیجه
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'error', 'n8n', 'خطا در ارسال: ' . $res->get_error_message() );
        } else {
            // فقط اگر موفق بود لاگ نکنیم که دیتابیس پر نشه، مگر دیباگ فعال باشه
            // Hub_Logger::log( 'info', 'n8n', 'ارسال موفق به وب‌هوک' );
        }
	}

	private static function send_sms( $data ) {
        // اطلاعات حساب
        $user = $data['user'];
        $pass = $data['pass'];
        $from = $data['from'];
        $to   = $data['mobile'];
        $text = $data['message'];

        if(empty($user) || empty($pass) || empty($to)) return;

        // تشخیص پترن (اگر متن با @ شروع شود)
        if ( strpos( $text, '@' ) === 0 ) {
            // فرمت پترن: @Code@Var1;Var2
            // مثال: @12345@Ali;12000
            $parts = explode( '@', substr( $text, 1 ) ); // حذف @ اول
            if ( count( $parts ) >= 2 ) {
                $bodyId = $parts[0]; // کد پترن
                $vars_raw = $parts[1]; // متغیرها
                $vars = explode( ';', $vars_raw );
                
                // ارسال از طریق پترن (SharedLine)
                $api_url = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
                $payload = array(
                    'username' => $user,
                    'password' => $pass,
                    'text' => implode(';', $vars), // مقادیر متغیرها با ; جدا شوند
                    'to' => $to,
                    'bodyId' => intval($bodyId)
                );
            } else {
                return; // فرمت غلط
            }
        } else {
            // ارسال معمولی
            $api_url = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
            $payload = array(
                'username' => $user,
                'password' => $pass,
                'to' => $to,
                'from' => $from,
                'text' => $text,
                'isflash' => false
            );
        }

        $args = array(
            'body'    => $payload,
            'headers' => array('Content-Type' => 'application/x-www-form-urlencoded'), // ملی پیامک معمولا فرم می‌گیرد
            'timeout' => 15
        );

        $res = wp_remote_post( $api_url, $args );
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'error', 'sms', 'خطای اتصال: ' . $res->get_error_message() );
        } else {
            $body = wp_remote_retrieve_body($res);
            $json = json_decode($body, true);
            // لاگ پاسخ ملی پیامک
            if(isset($json['Value']) && strlen($json['Value']) > 15) {
                 Hub_Logger::log( 'info', 'sms', 'ارسال موفق. شناسه: ' . $json['Value'] );
            } elseif(isset($json['RetStatus']) && $json['RetStatus'] != 1) {
                 Hub_Logger::log( 'error', 'sms', 'خطای پنل: ' . $json['StrRetStatus'] );
            }
        }
	}

    private static function send_telegram( $data ) {
        $token = $data['token'];
        $chat_id = $data['chat_id'];
        $text = $data['message'];
        
        if(empty($token) || empty($chat_id)) return;

        // پروکسی (اگر تنظیم شده باشد)
        $proxy = get_option('hub_telegram_proxy'); 
        
        $url = "https://api.telegram.org/bot$token/sendMessage";
        $body = [
            'chat_id' => $chat_id,
            'text' => $text,
            'parse_mode' => 'HTML'
        ];

        $args = [
            'body' => json_encode($body),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 10
        ];

        if(!empty($proxy)) {
            $args['proxy'] = $proxy; 
        }

        $res = wp_remote_post($url, $args);
        
        if ( is_wp_error( $res ) ) {
            Hub_Logger::log( 'error', 'telegram', 'خطا: ' . $res->get_error_message() );
        }
    }
}