<?php

/**
 * Processes the queue and sends data to n8n.
 */
class Hub_Sender {

	/**
	 * Initialize the worker.
     * اجرا روی init انجام می‌شود.
	 */
	public static function init() {
        // اطمینان نهایی از وجود توابع اسکجولر
        if ( ! function_exists( 'as_next_scheduled_action' ) ) {
            return;
        }

		// هوک کردن تابع پردازش
		add_action( 'hub_process_queue_event', array( __CLASS__, 'process_batch' ) );

		// اگر زمان‌بندی وجود ندارد، بساز (هر ۱ دقیقه)
		if ( ! as_next_scheduled_action( 'hub_process_queue_event' ) ) {
			as_schedule_recurring_action( time(), 60, 'hub_process_queue_event' );
		}
	}

	/**
	 * Process a batch of pending items.
	 */
	public static function process_batch() {
		$items = Hub_Queue::fetch_batch( 5 ); // دریافت ۵ آیتم

		if ( empty( $items ) ) {
			return;
		}

		$n8n_url = get_option( 'hub_n8n_webhook_url' ); 

		if ( empty( $n8n_url ) ) {
			Hub_Logger::log( 'n8n URL not set. Queue paused.', 'warning', 'sender' );
			return;
		}

		foreach ( $items as $item ) {
			self::send_item( $item, $n8n_url );
		}
	}

	/**
	 * Send a single item via HTTP POST
	 */
	private static function send_item( $item, $url ) {
		Hub_Queue::update_status( $item->id, 'processing' );

		$response = wp_remote_post( $url, array(
			'headers' => array(
				'Content-Type'  => 'application/json',
				'X-Hub-Event'   => $item->event_type,
				'X-Hub-Version' => HUB_VERSION,
                'X-Hub-Api-Key' => get_option( 'hub_api_key' ), // امنیت دوطرفه
			),
			'body'    => $item->payload,
			'timeout' => 20,
			'blocking'=> true,
		) );

		if ( is_wp_error( $response ) ) {
			Hub_Queue::update_status( $item->id, 'failed' );
			Hub_Logger::log( "Send Error #{$item->id}: " . $response->get_error_message(), 'error', 'sender' );
		} else {
			$code = wp_remote_retrieve_response_code( $response );
			if ( $code >= 200 && $code < 300 ) {
				Hub_Queue::update_status( $item->id, 'completed' );
				Hub_Logger::log( "Sent #{$item->id} OK ($code)", 'success', 'sender' );
			} else {
				Hub_Queue::update_status( $item->id, 'failed' );
				Hub_Logger::log( "N8N Error #{$item->id}: HTTP $code", 'error', 'sender' );
			}
		}
	}
}