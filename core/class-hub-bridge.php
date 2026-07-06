<?php

class Hub_Bridge {

	public static function init() {
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'handle_order_status' ), 10, 4 );
		add_action( 'woocommerce_new_order', array( __CLASS__, 'handle_new_order' ), 10, 1 );
		add_action( 'user_register', array( __CLASS__, 'handle_user_register' ), 10, 1 );
        add_action( 'hub_auth_request', array( __CLASS__, 'handle_auth_request' ), 10, 2 );
        add_action( 'wpcf7_mail_sent', array( __CLASS__, 'handle_cf7_submission' ), 10, 1 );
	}

    public static function handle_cf7_submission( $contact_form ) {
        $submission = WPCF7_Submission::get_instance();
        if ( ! $submission ) return;

        $posted_data = $submission->get_posted_data();
        $uploaded_files = $submission->uploaded_files(); 
        
        $data = (object) [
            'form_id' => $contact_form->id(),
            'form_title' => $contact_form->title(),
            'fields' => $posted_data,
            'files' => $uploaded_files
        ];

        self::process_rules( 'cf7_submit', $data, (string)$contact_form->id() );
    }

    public static function handle_order_status( $order_id, $from, $to, $order ) { 
        $status_slug = str_replace('wc-', '', $to); 
        self::process_rules( 'order_status', $order, $status_slug ); 
    }
    
	public static function handle_new_order( $order_id ) { 
        $order = wc_get_order( $order_id ); 
        if($order) self::process_rules( 'order_created', $order ); 
    }
    
	public static function handle_user_register( $user_id ) { 
        $user = get_userdata( $user_id ); 
        if($user) self::process_rules( 'user_register', $user ); 
    }
    
    public static function handle_auth_request( $phone, $otp ) {
        $data = (object) [ 'phone' => $phone, 'otp' => $otp ];
        self::process_rules( 'auth_request', $data );
    }

	private static function process_rules( $trigger_type, $entity, $sub_trigger = null ) {
		$rules = get_option( 'hub_rules', [] );
        Hub_Logger::log("Trigger: $trigger_type" . ($sub_trigger ? " ($sub_trigger)" : ""), 'info', 'bridge_debug');

		foreach ( $rules as $rule_id => $rule ) {
			if ( ($rule['trigger'] ?? '') !== $trigger_type ) continue;
			
            if ( $trigger_type === 'order_status' ) {
                $saved_sub = str_replace('wc-', '', $rule['sub_trigger'] ?? '');
                $current_sub = str_replace('wc-', '', $sub_trigger ?? '');
                if ( !empty($saved_sub) && $saved_sub !== $current_sub ) continue;
            }
            if ( $trigger_type === 'cf7_submit' ) {
                if ( !empty($rule['cf7_form_id']) && (string)$rule['cf7_form_id'] !== (string)$sub_trigger ) continue;
            }

            // چک کردن شرط‌ها در لحظه رخداد (ارزیابی اولیه)
            if ( ! Hub_Condition::evaluate( $entity, $trigger_type, $rule ) ) {
                continue;
            }

            // جلوگیری از خطای دیتای قدیمی
            if ( ! isset( $rule['actions'] ) || ! is_array( $rule['actions'] ) ) {
                Hub_Logger::log("Rule skipped (Old format): " . ($rule['name'] ?? 'Unnamed'), 'warning', 'bridge');
                continue;
            }

            Hub_Logger::log("Matched Rule (Passed conditions): " . ($rule['name'] ?? 'Unnamed'), 'success', 'bridge');

            $entity_id = 0;
            $entity_data = null;

            if ( is_a($entity, 'WC_Order') ) {
                $entity_id = $entity->get_id();
            } elseif ( is_a($entity, 'WP_User') ) {
                $entity_id = $entity->ID;
            } else {
                $entity_data = $entity; // فرمت‌های CF7 و Auth
            }

            foreach ( $rule['actions'] as $action_index => $action ) {
                // وضعیت تاگل
                if ( empty( $action['enabled'] ) ) continue;

                $delay_value = intval( $action['delay_value'] ?? 0 );
                $delay_unit  = $action['delay_unit'] ?? 'immediate';
                $delay_secs  = 0;

                if ( $delay_unit === 'minutes' ) $delay_secs = $delay_value * 60;
                if ( $delay_unit === 'hours' )   $delay_secs = $delay_value * 3600;
                if ( $delay_unit === 'days' )    $delay_secs = $delay_value * 86400;

                $payload = [
                    'action_config' => $action,
                    'trigger_type'  => $trigger_type,
                    'rule_name'     => $rule['name'] ?? '',
                    'entity_data'   => $entity_data 
                ];

                if ( $delay_secs > 0 ) {
                    Hub_Queue::push( $action['type'] . '.send', $payload, 10, $delay_secs, $entity_id, $rule_id, $action_index );
                } else {
                    // ارسال آنی اما با همان مسیر صف (جهت سازگاری کامل)، با دیلی 0
                    Hub_Queue::push( $action['type'] . '.send', $payload, 10, 0, $entity_id, $rule_id, $action_index );
                }
            }
		}
	}

    // --- پارسر شورت‌کدها ---
    // توجه: این متد برای جلوگیری از تکرار کد دست نخورده باقی ماند، تنها از حالت protected خارج شده است
    public static function parse_shortcodes($text, $entity) {
        if (empty($text)) return '';
        
        if ( isset($entity->form_id) && isset($entity->fields) ) {
            $text = str_replace('{form_title}', $entity->form_title, $text);
            $text = str_replace('{form_id}', $entity->form_id, $text);
            return preg_replace_callback('/\{field:([^}]+)\}/', function($matches) use ($entity) {
                $field_name = $matches[1];
                if ( isset($entity->fields[$field_name]) ) {
                    $val = $entity->fields[$field_name];
                    return is_array($val) ? implode(', ', $val) : $val;
                }
                return ''; 
            }, $text);
        }

        if ( isset($entity->otp) ) {
            return str_replace(['{otp}', '{phone}'], [$entity->otp, $entity->phone], $text);
        }

        if ( is_a( $entity, 'WC_Order' ) ) {
             return self::parse_wc_shortcodes($text, $entity);
        }
        
        if ( is_a( $entity, 'WP_User' ) ) {
            $full_name = trim($entity->first_name . ' ' . $entity->last_name);
            if(empty($full_name)) $full_name = 'کاربر';
            
            $vars = [
                '{first_name}' => $entity->first_name,
                '{last_name}'  => $entity->last_name,
                '{full_name}'  => $full_name,
                '{email}'      => $entity->user_email,
                '{phone}'      => get_user_meta($entity->ID, 'billing_phone', true) ?: $entity->user_login,
            ];
            return str_replace(array_keys($vars), array_values($vars), $text);
        }
        return $text;
    }

    private static function parse_wc_shortcodes($text, $order) {
        $clean_price = function($html_price) { return trim(strip_tags(html_entity_decode($html_price))); };
        $date_created = $order->get_date_created();

        $vars = [
            '{order_id}' => $order->get_id(),
            '{status}' => wc_get_order_status_name($order->get_status()),
            '{date}' => $date_created ? $date_created->date_i18n('Y/m/d') : '',
            '{time}' => $date_created ? $date_created->date_i18n('H:i') : '',
            '{full_name}' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            '{phone}' => $order->get_billing_phone(),
            '{address}' => $order->get_billing_address_1() . ' ' . $order->get_billing_city(),
            '{customer_note}' => $order->get_customer_note(),
            '{shipping_method}' => $order->get_shipping_method(),
            '{shipping_cost}' => $clean_price(wc_price($order->get_shipping_total())),
            '{total}' => $clean_price(wc_price($order->get_total())),
        ];

        if (strpos($text, '{items_summary}') !== false) {
            $lines = [];
            foreach ($order->get_items() as $item) {
                $lines[] = "▪️ " . $item->get_name() . " (×" . $item->get_quantity() . ")";
            }
            $vars['{items_summary}'] = implode("\n", $lines);
        }

        if (strpos($text, '{items_detailed}') !== false) {
            $lines = [];
            foreach ($order->get_items() as $item) {
                $price_clean = $clean_price(wc_price($item->get_total()));
                $lines[] = "🛒 " . $item->get_name() . "\n   تعداد: " . $item->get_quantity() . " | قیمت: " . $price_clean;
            }
            $vars['{items_detailed}'] = implode("\n----------------\n", $lines);
        }

        return str_replace(array_keys($vars), array_values($vars), $text);
    }

    public static function normalize_number($number) {
        if(empty($number)) return '';
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $number = str_replace($persian, $english, $number);
        $number = preg_replace('/[^0-9]/', '', $number);
        if (substr($number, 0, 3) === '989') $number = '0' . substr($number, 2);
        if (substr($number, 0, 1) === '9') $number = '0' . $number;
        return $number;
    }
}