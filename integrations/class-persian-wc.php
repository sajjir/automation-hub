<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Helper for Persian WooCommerce/SMS integration
 */
class Persian_WC_Helper {
    public static function get_sms_settings() {
        // Example: read options from Persian WC plugin settings
        return get_option( 'persian_wc_sms_settings', array() );
    }
}
