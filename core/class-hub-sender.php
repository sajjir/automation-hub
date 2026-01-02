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
                    else { $log_msg = is_wp_error($res) ? $res->get_error_message() : 'HTTP Error ' . wp_remote_retrieve_response_code($res); }
                }

                // 2. SMS (Melipayamak Smart Sender) 📩
                elseif ( $item->event_type === 'sms.send' ) {
                    
                    $username = $payload['user'];
                    $password = $payload['pass'];
                    $to       = $payload['mobile'];
                    $text     = $payload['message'];
                    
                    // تشخیص هوشمند: آیا پترن است؟ (مثلاً @12345@علی;سفارش)
                    if ( strpos( trim($text), '@' ) === 0 ) {
                        // --- روش ارسال پترن (Shared Line) ---
                        // فرمت باید این باشد: @کد_پترن@مقداری1;مقدار2;مقدار3
                        $parts = explode('@', $text);
                        // $parts[0] خالی است، $parts[1] کد پترن، $parts[2] متغیرها
                        
                        if ( isset($parts[1]) && is_numeric($parts[1]) ) {
                            $bodyId = $parts[1];
                            $args_str = isset($parts[2]) ? $parts[2] : '';
                            $args = explode(';', $args_str); // جدا کردن متغیرها با ;
                            
                            $url = 'https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber';
                            $body = [
                                'username' => $username,
                                'password' => $password,
                                'text'     => implode(';', $args), // ملی پیامک متن‌ها را با ; می‌گیرد
                                'to'       => $to,
                                'bodyId'   => (int)$bodyId
                            ];
                            
                            $log_mode = "Pattern ($bodyId)";
                        } else {
                            // فرمت غلط بود، تلاش برای ارسال عادی
                            $url = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
                            $body = ['username'=>$username, 'password'=>$password, 'to'=>$to, 'from'=>$payload['from'], 'text'=>$text, 'isFlash'=>false];
                            $log_mode = "Normal (Fallback)";
                        }
                    } else {
                        // --- روش ارسال معمولی (تبلیغاتی) ---
                        $url = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
                        $body = ['username'=>$username, 'password'=>$password, 'to'=>$to, 'from'=>$payload['from'], 'text'=>$text, 'isFlash'=>false];
                        $log_mode = "Normal";
                    }

                    // ارسال درخواست
                    $res = wp_remote_post( $url, [ 
                        'body' => json_encode($body), 
                        'headers' => ['Content-Type' => 'application/json'], 
                        'timeout' => 15 
                    ]);

                    if ( is_wp_error($res) ) {
                        $log_msg = "SMS Connect Error: " . $res->get_error_message();
                    } else {
                        $json = json_decode(wp_remote_retrieve_body($res), true);
                        // بررسی موفقیت (Value طولانی یعنی ID پیام)
                        if ( isset($json['Value']) && strlen($json['Value']) > 5 ) {
                            $success = true;
                            $log_msg = "SMS Sent ($log_mode)! ID: " . $json['Value'];
                        } else {
                            $log_msg = "Melipayamak Error ($log_mode): " . wp_remote_retrieve_body($res);
                        }
                    }
                }

                // 3. Telegram
                elseif ( $item->event_type === 'telegram.send' ) {
                    $api_url = "https://api.telegram.org/bot{$payload['token']}/sendMessage";
                    $res = wp_remote_post( $api_url, [ 'body' => [ 'chat_id' => $payload['chat_id'], 'text' => $payload['message'], 'parse_mode' => 'HTML' ], 'timeout'=>15 ] );
                    if(!is_wp_error($res) && wp_remote_retrieve_response_code($res) < 300) { $success = true; $log_msg = "Telegram sent"; }
                    else { $log_msg = is_wp_error($res) ? $res->get_error_message() : 'Telegram Error'; }
                }

            } catch (Exception $e) { $log_msg = $e->getMessage(); }

            Hub_Queue::update_status( $item->id, $success ? 'completed' : 'failed' );
            Hub_Logger::log( $log_msg, $success ? 'success' : 'error', 'sender' );
		}
	}
}