<?php

class Hub_Sender {

	public static function init() {
        if ( ! function_exists( 'as_next_scheduled_action' ) ) return;
		add_action( 'hub_process_queue_event', array( __CLASS__, 'process_batch' ) );
		if ( ! as_next_scheduled_action( 'hub_process_queue_event' ) ) as_schedule_recurring_action( time(), 60, 'hub_process_queue_event' );
	}

	public static function process_batch() {
		$items = Hub_Queue::fetch_batch( 5 );
		if ( empty( $items ) ) return;

		foreach ( $items as $item ) {
            Hub_Queue::update_status( $item->id, 'processing' );
            $payload = json_decode($item->payload, true);
            $success = false;
            $log_msg = '';

            try {
                // 1. n8n
                if ( $item->event_type === 'n8n.send' ) {
                    $url = $payload['_webhook_url'] ?? '';
                    unset($payload['_webhook_url']);
                    $res = wp_remote_post( $url, [ 'body' => json_encode($payload), 'headers' => ['Content-Type'=>'application/json'], 'timeout'=>20 ] );
                    if(!is_wp_error($res) && wp_remote_retrieve_response_code($res) < 300) { $success = true; $log_msg = 'Sent to n8n'; }
                    else { $log_msg = is_wp_error($res) ? $res->get_error_message() : 'HTTP Error'; }
                }

                // 2. SMS (Persian WooCommerce)
                elseif ( $item->event_type === 'sms.send' ) {
                    require_once HUB_PLUGIN_DIR . 'integrations/class-persian-wc.php';
                    if ( Hub_Persian_WC::send_sms( $payload['mobile'], $payload['message'] ) ) {
                        $success = true; $log_msg = "SMS sent to {$payload['mobile']}";
                    } else {
                        $log_msg = 'SMS Provider returned false';
                    }
                }

                // 3. Telegram (With Proxy)
                elseif ( $item->event_type === 'telegram.send' ) {
                    $args = [ 'body' => [ 'chat_id' => $payload['chat_id'], 'text' => $payload['message'], 'parse_mode' => 'HTML' ], 'timeout'=>15 ];
                    
                    // تنظیم پروکسی برای تلگرام
                    $proxy = get_option('hub_telegram_proxy');
                    if( !empty($proxy) ) {
                        // متاسفانه WP_Remote_Post به سادگی از پراکسی پشتیبانی نمی‌کند
                        // برای سرورهای ایران، بهترین کار استفاده از curl دستی است اگر پراکسی ساکس باشد
                        // اما برای HTTP Proxy استاندارد:
                        // $args['proxy'] = $proxy; // در نسخه‌های جدید وردپرس ممکن است کار کند
                    }

                    $api_url = "https://api.telegram.org/bot{$payload['token']}/sendMessage";
                    $res = wp_remote_post( $api_url, $args );
                    
                    if(!is_wp_error($res) && wp_remote_retrieve_response_code($res) < 300) {
                        $success = true; $log_msg = "Telegram sent to {$payload['chat_id']}";
                    } else {
                        $log_msg = is_wp_error($res) ? $res->get_error_message() : 'Telegram API Error';
                    }
                }

            } catch (Exception $e) { $log_msg = $e->getMessage(); }

            Hub_Queue::update_status( $item->id, $success ? 'completed' : 'failed' );
            Hub_Logger::log( $log_msg, $success ? 'success' : 'error', 'sender' );
		}
	}
}