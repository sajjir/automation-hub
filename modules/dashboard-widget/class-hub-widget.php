<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Admin dashboard widget to show queue stats
 */
class Hub_Widget {
    public function __construct() {
        add_action( 'wp_dashboard_setup', array( $this, 'register_widget' ) );
    }

    public function register_widget() {
        wp_add_dashboard_widget( 'hub_widget', 'Automation Hub', array( $this, 'render' ) );
    }

    public function render() {
        $queue = get_option( 'automation_hub_queue', array() );
        echo '<p>Queued items: ' . intval( count( $queue ) ) . '</p>';
    }
}
