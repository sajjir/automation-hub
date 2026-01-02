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

                // 2. SMS (DIRECT Melipayamak) 📩
                elseif ( $item->event_type === 'sms.send' ) {
                    if ( class_exists('SoapClient') ) {
                        $client = new SoapClient("http://api.payamak-panel.com/post/send.asmx?wsdl");
                        
                        $params = array(
                            'username' => $payload['user'],
                            'password' => $payload['pass'],
                            'from' => $payload['from'],
                            'to' => array($payload['mobile']),
                            'text' => $payload['message'],
                            'isflash' => false,
                            'udh' => "",
                            'recId' => array(0),
                            'status' => 0
                        );
                        
                        $result = $client->SendSms($params);
                        
                        // ملی پیامک اگر موفق باشد یک عدد (RecId) برمی‌گرداند
                        // اگر خطا باشد عدد کوچک یا ارور برمی‌گرداند. معمولاً اگر طولش > 1 باشد یعنی موفق
                        if ( isset($result->SendSmsResult) && strlen($result->SendSmsResult) > 1 ) {
                            $success = true;
                            $log_msg = "SMS Sent to {$payload['mobile']} (ID: {$result->SendSmsResult})";
                        } else {
                            $log_msg = "Melipayamak Error: " . json_encode($result);
                        }
                    } else {
                        $log_msg = "SOAP Client not enabled on server";
                    }
                }

                // 3. Telegram
                elseif ( $item->event_type === 'telegram.send' ) {
                    $args = [ 'body' => [ 'chat_id' => $payload['chat_id'], 'text' => $payload['message'], 'parse_mode' => 'HTML' ], 'timeout'=>15 ];
                    $api_url = "https://api.telegram.org/bot{$payload['token']}/sendMessage";
                    $res = wp_remote_post( $api_url, $args );
                    if(!is_wp_error($res) && wp_remote_retrieve_response_code($res) < 300) { $success = true; $log_msg = "Telegram sent to {$payload['chat_id']}"; }
                    else { $log_msg = is_wp_error($res) ? $res->get_error_message() : 'Telegram API Error'; }
                }

            } catch (Exception $e) { $log_msg = $e->getMessage(); }

            Hub_Queue::update_status( $item->id, $success ? 'completed' : 'failed' );
            Hub_Logger::log( $log_msg, $success ? 'success' : 'error', 'sender' );
		}
	}
}