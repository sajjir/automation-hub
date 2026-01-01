<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Simple queue management: push/pop events (backed by options or transient for demo)
 */
class Hub_Queue {
    protected $option_key = 'automation_hub_queue';

    public function push( $payload ) {
        $queue = get_option( $this->option_key, array() );
        $queue[] = array( 'payload' => $payload, 'created_at' => current_time( 'mysql' ) );
        update_option( $this->option_key, $queue );
    }

    public function pop() {
        $queue = get_option( $this->option_key, array() );
        if ( empty( $queue ) ) {
            return null;
        }
        $item = array_shift( $queue );
        update_option( $this->option_key, $queue );
        return $item;
    }
}
