<?php

class Hub_Persian_WC {

	public static function is_active() {
		return class_exists( 'Woocommerce_IR_SMS' ) || defined( 'PW_VERSION' );
	}

	public static function get_sms_config() {
		if ( ! self::is_active() ) return false;

		$options = get_option( 'pw_sms_options', array() );
		if ( empty( $options ) ) $options = get_option( 'woocommerce_persian_sms_options', array() );

		if ( empty( $options ) || ! is_array( $options ) ) {
			return array( 'provider' => 'تنظیم نشده', 'username' => '-', 'number' => '-' );
		}

		return array(
			'provider' => isset( $options['sms_gateway'] ) ? $options['sms_gateway'] : 'unknown',
			'username' => isset( $options['sms_username'] ) ? $options['sms_username'] : '',
			'password' => isset( $options['sms_password'] ) ? $options['sms_password'] : '',
			'number'   => isset( $options['sms_number'] )   ? $options['sms_number']   : '',
		);
	}

	public static function send_sms( $mobile, $message ) {
		if ( ! self::is_active() ) return false;
		try {
			if ( function_exists( 'pw_send_sms' ) ) return pw_send_sms( $mobile, $message );
			if ( class_exists( 'Woocommerce_IR_SMS_Bulk' ) ) {
				$sender = new Woocommerce_IR_SMS_Bulk();
				return $sender->send_sms( $mobile, $message );
			}
			return false;
		} catch ( Exception $e ) {
			Hub_Logger::log( 'SMS Failed: ' . $e->getMessage(), 'error', 'sms' );
			return false;
		}
	}
}