<?php

/**
 * Processes the queue and sends data to n8n.
 */
class Hub_Sender {

	/**
	 * Initialize the worker.
	 */
	public static function init() {
		// ثبت اکشن برای پردازش صف
		add_action( 'hub_process_queue_event', array( __CLASS__, 'process_batch' ) );

		// اگر زمان‌بندی وجود ندارد، آن را بساز (هر 1 دقیقه)
		if ( ! as_next_scheduled_action( 'hub_process_queue_event' ) ) {
			as_schedule_recurring_action( time(), 60, 'hub_process_queue_event' );
		}
	}

	/**
	 * Process a batch of pending items.
	 */
	public static function process_batch() {
		// 1. دریافت 5 آیتم از صف
		$items = Hub_Queue::fetch_batch( 5 );

		if ( empty( $items ) ) {
			return; // صف خالی است
		}

		// 2. دریافت URL وبهوک n8n (فعلاً هاردکد یا از آپشن)
		// در فاز بعدی این را از تنظیمات پنل می‌خوانیم
		$n8n_url = get_option( 'hub_n8n_webhook_url' ); 

		if ( empty( $n8n_url ) ) {
			Hub_Logger::log( 'n8n Webhook URL is missing!', 'error', 'sender' );
			return;
		}

		foreach ( $items as $item ) {
			self::send_item( $item, $n8n_url );
		}
	}

	/**
	 * Send a single item to n8n.
	 */
	private static function send_item( $item, $url ) {
		// تغییر وضعیت به "در حال پردازش"
		Hub_Queue::update_status( $item->id, 'processing' );

		// ارسال درخواست
		$response = wp_remote_post( $url, array(
			'headers' => array(
				'Content-Type'  => 'application/json',
				'X-Hub-Event'   => $item->event_type,
				'X-Hub-Version' => HUB_VERSION,
			),
			'body'    => $item->payload, // خود payload جیسون است
			'timeout' => 15,
			'blocking'=> true,
		) );

		if ( is_wp_error( $response ) ) {
			// شکست خورد
			Hub_Queue::update_status( $item->id, 'failed' );
			Hub_Logger::log( "Failed to send event #{$item->id}: " . $response->get_error_message(), 'error', 'sender' );
		} else {
			$code = wp_remote_retrieve_response_code( $response );
			if ( $code >= 200 && $code < 300 ) {
				// موفقیت
				Hub_Queue::update_status( $item->id, 'completed' );
				Hub_Logger::log( "Successfully sent event #{$item->id} to n8n", 'success', 'sender' );
			} else {
				// خطای سرور مقصد (مثلاً 404 یا 500)
				Hub_Queue::update_status( $item->id, 'failed' );
				Hub_Logger::log( "n8n returned error {$code} for event #{$item->id}", 'warning', 'sender' );
			}
		}
	}
}