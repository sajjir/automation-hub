<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * API Key generation & validation
 */
class Hub_Security {
    public static function generate_api_key() {
        return wp_hash_password( wp_generate_password( 32, true, true ) );
    }

    public static function verify_api_key( $api_key ) {
        // Placeholder - implement your verification strategy (DB lookup, option, etc.)
        $stored = get_option( 'automation_hub_api_key' );
        if ( ! $stored ) {
            return false;
        }
        return wp_check_password( $api_key, $stored );
    }
}
