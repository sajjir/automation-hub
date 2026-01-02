<?php

/**
 * Processes the queue and sends data to n8n.
 */
class Hub_Sender {

	/**
	 * Initialize the worker.
	 */
	public static function init() {
        // اطمینان از وجود اکشن اسکجولر
        if ( ! function_exists( 'as_next_scheduled_action' ) ) {
            return;
        }

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
		// دریافت ۵ آیتم از صف
		$items = Hub_Queue::fetch_batch( 5 );

		if ( empty( $items ) ) {
			return; // صف خالی است
		}

        // نکته مهم: در نسخه جدید، آدرس مقصد داخل هر آیتم ذخیره شده است
        // پس نیازی نیست اینجا آدرس کلی را چک کنیم.
		foreach ( $items as $item ) {
			self::send_item( $item );
		}
	}

	/**
	 * Send a single item via HTTP POST
	 */
	private static function send_item( $item ) {
		// تغییر وضعیت به "در حال پردازش"
		Hub_Queue::update_status( $item->id, 'processing' );

        // 1. استخراج اطلاعات از JSON
        $payload_data = json_decode($item->payload, true);
        
        // اگر جیسون خراب بود یا خالی بود
        if ( ! is_array($payload_data) ) {
            Hub_Queue::update_status( $item->id, 'failed' );
            Hub_Logger::log( "Event #{$item->id} has invalid JSON payload.", 'error', 'sender' );
            return;
        }

        // 2. پیدا کردن آدرس وب‌هوک مقصد (که Bridge آن را اضافه کرده بود)
        $target_url = '';
        if ( isset( $payload_data['_webhook_url'] ) && ! empty( $payload_data['_webhook_url'] ) ) {
            $target_url = $payload_data['_webhook_url'];
            
            // مهم: آدرس را از دیتای ارسالی حذف می‌کنیم که به n8n نرود (چون نیازی ندارد)
            unset( $payload_data['_webhook_url'] );
        } else {
            // اگر آدرس پیدا نشد (خطای سناریو)
            Hub_Queue::update_status( $item->id, 'failed' );
            Hub_Logger::log( "No Webhook URL found inside payload for event #{$item->id}", 'error', 'sender' );
            return;
        }

        // 3. آماده‌سازی نهایی داده‌ها برای ارسال
        $final_body = json_encode( $payload_data, JSON_UNESCAPED_UNICODE );

        // 4. شلیک به n8n 🚀
		$response = wp_remote_post( $target_url, array(
			'headers' => array(
				'Content-Type'  => 'application/json',
				'X-Hub-Event'   => $item->event_type,
				'X-Hub-Version' => HUB_VERSION,
                'X-Hub-Api-Key' => get_option( 'hub_api_key' ), // هدر امنیتی
			),
			'body'    => $final_body,
			'timeout' => 20,
			'blocking'=> true,
		) );

		if ( is_wp_error( $response ) ) {
			// خطای ارتباطی (اینترنت یا سرور)
			Hub_Queue::update_status( $item->id, 'failed' );
			Hub_Logger::log( "Send Error #{$item->id}: " . $response->get_error_message(), 'error', 'sender' );
		} else {
			$code = wp_remote_retrieve_response_code( $response );
			if ( $code >= 200 && $code < 300 ) {
				// موفقیت کامل ✅
				Hub_Queue::update_status( $item->id, 'completed' );
				Hub_Logger::log( "Sent #{$item->id} to n8n OK ($code)", 'success', 'sender' );
			} else {
				// n8n خطا داد (مثلاً 404 یا 500)
				Hub_Queue::update_status( $item->id, 'failed' );
				Hub_Logger::log( "N8N Error #{$item->id}: HTTP $code", 'error', 'sender' );
			}
		}
	}
}