<?php

/**
 * Helper class to integrate with Persian WooCommerce & MeliWoo.
 */
class Hub_Persian_WC {

	/**
	 * Check if Persian WooCommerce or MeliWoo is active.
	 */
	public static function is_active() {
		return class_exists( 'Woocommerce_IR_SMS' ) || defined( 'PW_VERSION' ) || class_exists( 'MeliWoo' );
	}

	/**
	 * Get SMS Gateway configuration.
	 * Tries to find settings from various Persian WC versions.
	 */
	public static function get_sms_config() {
		if ( ! self::is_active() ) {
			return false;
		}

		// 1. تلاش برای خواندن تنظیمات استاندارد (Persian Woocommerce SMS)
		$options = get_option( 'pw_sms_options', array() );
		if ( empty( $options ) ) {
			$options = get_option( 'woocommerce_persian_sms_options', array() );
		}

		if ( ! empty( $options ) && is_array( $options ) ) {
			return array(
				'provider' => isset( $options['sms_gateway'] ) ? $options['sms_gateway'] : 'Default',
				'username' => isset( $options['sms_username'] ) ? $options['sms_username'] : '',
				'password' => isset( $options['sms_password'] ) ? $options['sms_password'] : '',
				'number'   => isset( $options['sms_number'] )   ? $options['sms_number']   : '',
			);
		}

		// 2. تلاش برای خواندن تنظیمات MeliWoo (اختصاصی ملی پیامک)
        // این پلاگین تنظیمات را جداگانه ذخیره می‌کند
		$mp_username = get_option( 'melipayamak_username' );
		if ( ! empty( $mp_username ) ) {
			return array(
				'provider' => 'Melipayamak (MeliWoo)',
				'username' => $mp_username,
				'password' => '***', // امنیت
				'number'   => get_option( 'melipayamak_from', 'Unknown' ),
			);
		}

		return false;
	}

	/**
	 * Send SMS using available handlers.
	 */
	public static function send_sms( $mobile, $message ) {
		if ( ! self::is_active() ) {
			return false;
		}

		try {
			// روش ۱: استفاده از تابع استاندارد ووکامرس فارسی
			if ( function_exists( 'pw_send_sms' ) ) {
				return pw_send_sms( $mobile, $message );
			} 
			
			// روش ۲: استفاده از کلاس ارسال گروهی
			if ( class_exists( 'Woocommerce_IR_SMS_Bulk' ) ) {
				$sender = new Woocommerce_IR_SMS_Bulk();
				return $sender->send_sms( $mobile, $message );
			}

            // روش ۳: پشتیبانی مستقیم از MeliWoo (اگر توابع بالا نبودند)
            $mp_username = get_option( 'melipayamak_username' );
            if ( ! empty( $mp_username ) && class_exists('SoapClient') ) {
                $password = get_option( 'melipayamak_password' );
                $from = get_option( 'melipayamak_from' );
                
                // ارسال مستقیم با SOAP (کد استاندارد ملی پیامک)
                $client = new SoapClient("http://api.payamak-panel.com/post/send.asmx?wsdl");
                $params = array(
                    'username' => $mp_username,
                    'password' => $password,
                    'from' => $from,
                    'to' => array($mobile),
                    'text' => $message,
                    'isflash' => false,
                    'udh' => "",
                    'recId' => array(0),
                    'status' => 0
                );
                $result = $client->SendSms($params);
                
                // بررسی نتیجه (معمولاً یک عدد طولانی برمی‌گرداند که ID پیام است)
                if ( !is_soap_fault($result) && (is_numeric($result->SendSmsResult) && strlen($result->SendSmsResult) > 1) ) {
                    return true;
                }
            }

			return false;
		} catch ( Exception $e ) {
			Hub_Logger::log( 'SMS Send Failed: ' . $e->getMessage(), 'error', 'sms' );
			return false;
		}
	}
}