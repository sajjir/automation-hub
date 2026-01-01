<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Custom logger to DB (uses table created on activation)
 */
class Hub_Logger {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'automation_hub_logs';
    }

    public function log( $level, $message, $meta = null ) {
        global $wpdb;
        $wpdb->insert( $this->table, array(
            'created_at' => current_time( 'mysql' ),
            'level'      => $level,
            'message'    => $message,
            'meta'       => is_scalar( $meta ) ? $meta : maybe_serialize( $meta ),
        ) );
    }
}
