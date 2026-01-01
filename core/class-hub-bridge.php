<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Webhook sender & Event listener
 */
class Hub_Bridge {
    public function __construct() {
        add_action( 'init', array( $this, 'maybe_handle_incoming' ) );
    }

    public function send_webhook( $url, $payload ) {
        wp_remote_post( $url, array( 'body' => wp_json_encode( $payload ), 'headers' => array( 'Content-Type' => 'application/json' ) ) );
    }

    public function maybe_handle_incoming() {
        // Example: simple endpoint via query param ?automation_hub=1?action=...
        if ( isset( $_GET['automation_hub'] ) ) {
            // Process incoming event securely
            status_header( 200 );
            echo 'OK';
            exit;
        }
    }
}
