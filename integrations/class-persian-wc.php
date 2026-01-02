<?php

/**
 * Helper class to integrate with Persian WooCommerce SMS.
 */
class Hub_Persian_WC {

	/**
	 * Check if Persian WooCommerce SMS is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		// بررسی وجود کلاس اصلی پیامک ووکامرس فارسی
		return class_exists( 'Woocommerce_IR_SMS' ) || defined( 'PW_VERSION' );
	}

	/**
	 * Get SMS Gateway configuration from Persian WooCommerce options.
	 *
	 * @return array|false Returns config array or false if not found.
	 */
	public static function get_sms_config() {
		if ( ! self::is_active() ) {
			return false;
		}

		// دریافت تنظیمات ذخیره شده در دیتابیس
		// ووکامرس فارسی معمولاً در آپشن 'sms_options' یا مشابه آن ذخیره می‌کند
		$options = get_option( 'pw_sms_options', array() ); // نام آپشن رایج

		// اگر پیدا نشد، شاید فرمت قدیمی باشد
		if ( empty( $options ) ) {
			$options = get_option( 'woocommerce_persian_sms_options', array() );
		}

		if ( empty( $options ) ) {
			return false;
		}

		return array(
			'provider' => isset( $options['sms_gateway'] ) ? $options['sms_gateway'] : 'unknown',
			'username' => isset( $options['sms_username'] ) ? $options['sms_username'] : '',
			'password' => isset( $options['sms_password'] ) ? $options['sms_password'] : '',
			'number'   => isset( $options['sms_number'] )   ? $options['sms_number']   : '',
		);
	}

	/**
	 * Send SMS using Persian WooCommerce Handler (Reuse Logic).
	 *
	 * @param string $mobile
	 * @param string $message
	 * @return bool
	 */
	public static function send_sms( $mobile, $message ) {
		if ( ! self::is_active() ) {
			return false;
		}

		try {
			// تلاش برای استفاده از توابع استاندارد ووکامرس فارسی
			if ( function_exists( 'pw_send_sms' ) ) {
				return pw_send_sms( $mobile, $message );
			} 
			
			// اگر تابع نبود، شاید نیاز به نمونه‌سازی باشد (بسته به نسخه افزونه)
			if ( class_exists( 'Woocommerce_IR_SMS_Bulk' ) ) {
				$sender = new Woocommerce_IR_SMS_Bulk();
				return $sender->send_sms( $mobile, $message );
			}

			return false;
		} catch ( Exception $e ) {
			Hub_Logger::log( 'SMS Send Failed: ' . $e->getMessage(), 'error', 'sms' );
			return false;
		}
	}
}