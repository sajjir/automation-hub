<?php

class Hub_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
        add_action( 'wp_ajax_hub_test_connection', array( __CLASS__, 'handle_test_connection' ) );
	}

	public static function add_admin_menu() {
		add_menu_page( 'هاب اتوماسیون', 'هاب اتوماسیون', 'manage_options', 'automation-hub', array( __CLASS__, 'render_admin_page' ), 'dashicons-superhero-alt', 56 );
	}

	public static function enqueue_assets( $hook ) {
		if ( 'toplevel_page_automation-hub' !== $hook ) return;
		wp_enqueue_style( 'hub-admin-style', HUB_PLUGIN_URL . 'admin/css/hub-admin.css', array(), HUB_VERSION );
		wp_enqueue_script( 'hub-admin-js', HUB_PLUGIN_URL . 'admin/js/hub-admin.js', array( 'jquery', 'wp-util' ), HUB_VERSION, true );
	}

    public function get_cf7_forms() {
        if ( ! post_type_exists( 'wpcf7_contact_form' ) ) {
            return [];
        }
        $forms = get_posts( array( 'post_type' => 'wpcf7_contact_form', 'posts_per_page' => -1 ) );
        $options = [];
        foreach ( $forms as $form ) $options[ $form->ID ] = $form->post_title . " (ID: $form->ID)";
        return $options;
    }

    public static function handle_test_connection() {
        // بدنه این متد مثل گذشته برای ارتباط سبک
        wp_send_json_success("OK");
    }

	public static function render_admin_page() {
		if ( isset( $_POST['hub_save_settings'] ) && check_admin_referer( 'hub_save_action', 'hub_nonce' ) ) {
            self::save_settings();
            echo '<div class="notice notice-success is-dismissible"><p>تنظیمات با موفقیت ذخیره شد.</p></div>';
        }
        include plugin_dir_path( __FILE__ ) . 'partials/hub-admin-display.php';
	}

    private static function save_settings() {
        // ذخیره اتصالات (بدون تغییر منطق کلی)
        if(isset($_POST['webhook_name'])) {
            $clean_wh = [];
            foreach($_POST['webhook_name'] as $index => $name) {
                if(!empty($name)) {
                    $type = sanitize_text_field($_POST['webhook_type'][$index]);
                    $clean_wh[] = [
                        'id' => sanitize_title($name) . '_' . time() . rand(10,99), // Unique ID
                        'name' => sanitize_text_field($name),
                        'type' => $type,
                        'url' => sanitize_text_field($_POST['webhook_url'][$index] ?? ''), 
                        'sms_user' => sanitize_text_field($_POST['sms_user'][$index] ?? ''),
                        'sms_pass' => sanitize_text_field($_POST['sms_pass'][$index] ?? ''),
                        'sms_from' => sanitize_text_field($_POST['sms_from'][$index] ?? ''),
                    ];
                }
            }
            update_option('hub_webhooks', $clean_wh);
        }

        // سیستم جدید: ذخیره Rule ها با آرایه Nested
        if(isset($_POST['rules']) && is_array($_POST['rules'])) {
            $clean_rules = [];
            foreach($_POST['rules'] as $rule_index => $rule_data) {
                if(empty($rule_data['trigger'])) continue;

                $parsed_rule = [
                    'name' => sanitize_text_field($rule_data['name'] ?? ''),
                    'trigger' => sanitize_text_field($rule_data['trigger']),
                    'sub_trigger' => sanitize_text_field($rule_data['sub_trigger'] ?? ''),
                    'cf7_form_id' => sanitize_text_field($rule_data['cf7_form_id'] ?? ''),
                    'match_type' => sanitize_text_field($rule_data['match_type'] ?? 'all'),
                    'conditions' => [],
                    'actions' => []
                ];

                if(isset($rule_data['conditions']) && is_array($rule_data['conditions'])) {
                    foreach($rule_data['conditions'] as $cond) {
                        if(!empty($cond['field'])) {
                            $parsed_rule['conditions'][] = [
                                'field' => sanitize_text_field($cond['field']),
                                'operator' => sanitize_text_field($cond['operator']),
                                'value' => sanitize_text_field($cond['value'])
                            ];
                        }
                    }
                }

                if(isset($rule_data['actions']) && is_array($rule_data['actions'])) {
                    foreach($rule_data['actions'] as $act) {
                        $parsed_rule['actions'][] = [
                            'type' => sanitize_text_field($act['type'] ?? 'webhook'),
                            'connection_id' => sanitize_text_field($act['connection_id'] ?? ''),
                            'target' => sanitize_text_field($act['target'] ?? ''),
                            'message' => wp_kses_post($act['message'] ?? ''),
                            'delay_value' => intval($act['delay_value'] ?? 0),
                            'delay_unit' => sanitize_text_field($act['delay_unit'] ?? 'immediate'),
                            'enabled' => isset($act['enabled']) ? 1 : 0
                        ];
                    }
                }

                $clean_rules[] = $parsed_rule;
            }
            update_option('hub_rules', $clean_rules);
        } else {
             update_option('hub_rules', []); // پاک شدن در صورت خالی بودن
        }

        // تنظیمات دیگر
        $globals = ['n8n' => isset($_POST['global_n8n'])?1:0, 'sms' => isset($_POST['global_sms'])?1:0, 'telegram' => isset($_POST['global_telegram'])?1:0];
        update_option('hub_global_status', $globals);
        if(isset($_POST['telegram_proxy'])) update_option('hub_telegram_proxy', sanitize_text_field($_POST['telegram_proxy']));
    }
}