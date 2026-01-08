<?php

class Hub_Admin {

    private $plugin_name;
    private $version;

    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * متد راه‌انداز اصلی (Fix خطای Fatal Error)
     * این متد کلاس را نمونه‌سازی کرده و هوک‌ها را متصل می‌کند.
     */
    public static function init() {
        $plugin_name = 'automation-hub';
        $version     = defined( 'HUB_VERSION' ) ? HUB_VERSION : '1.0.0';

        $instance = new self( $plugin_name, $version );

        add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_styles' ) );
        add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_scripts' ) );
        add_action( 'admin_menu', array( $instance, 'add_menu' ) );
        
        // هوک‌های AJAX برای تست اتصال
        add_action( 'wp_ajax_hub_test_connection', array( $instance, 'ajax_test_connection' ) );
    }

    public function enqueue_styles() {
        wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/hub-admin.css', array(), $this->version, 'all' );
    }

    public function enqueue_scripts() {
        wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/hub-admin.js', array( 'jquery' ), $this->version, false );
        
        wp_localize_script( $this->plugin_name, 'hub_ajax', array(
            'nonce' => wp_create_nonce('hub_test_connection_nonce'),
            'ajax_url' => admin_url('admin-ajax.php')
        ));
    }

    public function add_menu() {
        add_menu_page(
            'اتوماسیون هاب',
            'اتوماسیون هاب',
            'manage_options',
            'automation-hub',
            array( $this, 'render_settings_page' ),
            'dashicons-rest-api',
            56
        );
    }

    // --- هندلر تست اتصال (AJAX) ---
    public function ajax_test_connection() {
        check_ajax_referer('hub_test_connection_nonce', 'security');
        
        if(!current_user_can('manage_options')) wp_send_json_error('عدم دسترسی');

        $type = sanitize_text_field($_POST['type']);
        $data = $_POST['data'] ?? [];
        $result = false;
        
        if($type === 'webhook') { // n8n
            $payload = ['is_test_run' => true, 'json_data' => ['message' => 'Hello from WordPress Automation Hub!']];
            $payload['_webhook_url'] = esc_url_raw($data['url']);
            // استفاده از کلاس Sender برای ارسال واقعی
            if ( class_exists( 'Hub_Sender' ) ) {
                $result = Hub_Sender::send_immediate('n8n.send', $payload);
            }
        } 
        elseif ($type === 'sms') {
            if ( class_exists( 'Hub_Sender' ) ) {
                $result = Hub_Sender::send_immediate('sms.send', [
                    'user' => sanitize_text_field($data['sms_user']),
                    'pass' => sanitize_text_field($data['sms_pass']),
                    'from' => sanitize_text_field($data['sms_from']),
                    'mobile' => sanitize_text_field($data['test_mobile']),
                    'message' => 'تست ارتباط اتوماسیون هاب ✅'
                ]);
            }
        } 
        elseif ($type === 'telegram') {
            if ( class_exists( 'Hub_Sender' ) ) {
                $result = Hub_Sender::send_immediate('telegram.send', [
                    'token' => sanitize_text_field($data['url']),
                    'chat_id' => sanitize_text_field($data['test_chat_id']),
                    'message' => 'تست ارتباط اتوماسیون هاب ✅'
                ]);
            }
        }

        if($result) wp_send_json_success('ارتباط با موفقیت برقرار شد! 🎉');
        else wp_send_json_error('ارتباط برقرار نشد. ورودی‌ها یا لاگ را چک کنید. ❌');
    }

    private function get_cf7_forms() {
        if ( ! post_type_exists( 'wpcf7_contact_form' ) ) return [];
        $forms = get_posts( [ 'post_type' => 'wpcf7_contact_form', 'posts_per_page' => -1 ] );
        $options = [];
        foreach ( $forms as $form ) $options[ $form->ID ] = $form->post_title . " (ID: $form->ID)";
        return $options;
    }

    public function render_settings_page() {
        if ( isset( $_POST['hub_save_settings'] ) && check_admin_referer( 'hub_save_action', 'hub_nonce' ) ) {
            $this->save_settings();
        }

        // دریافت تنظیمات برای ارسال به ویو
        $webhooks = get_option( 'hub_webhooks', [] );
        $rules    = get_option( 'hub_rules', [] );
        $globals  = get_option( 'hub_global_status', ['n8n'=>1, 'sms'=>1, 'telegram'=>1] ); 
        $auth_settings = wp_parse_args(get_option('hub_auth_settings', []), ['active'=>0, 'unified_login'=>0, 'redirect_url'=>'', 'rate_limit'=>120]);

        $wc_statuses = function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [];
        $cf7_forms   = $this->get_cf7_forms(); 

        // فراخوانی فایل ویو (HTML)
        include_once plugin_dir_path( __FILE__ ) . 'partials/hub-admin-display.php';
    }

    private function save_settings() {
        // 1. ذخیره وضعیت جهانی (Global Toggles)
        $globals = [
            'n8n'      => isset($_POST['global_n8n']) ? 1 : 0,
            'sms'      => isset($_POST['global_sms']) ? 1 : 0,
            'telegram' => isset($_POST['global_telegram']) ? 1 : 0,
        ];
        update_option('hub_global_status', $globals);

        // 2. ذخیره تنظیمات Auth
        if(isset($_POST['hub_auth_rate_limit'])) {
            $auth_settings = [
                'active' => isset($_POST['hub_auth_active']) ? 1 : 0,
                'unified_login' => isset($_POST['hub_auth_unified']) ? 1 : 0,
                'redirect_url' => esc_url_raw($_POST['hub_auth_redirect']),
                'rate_limit' => intval($_POST['hub_auth_rate_limit']),
            ];
            update_option('hub_auth_settings', $auth_settings);
        }

        // 3. ذخیره اتصالات (Webhooks)
        $webhooks = [];
        if ( isset( $_POST['webhook_name'] ) ) {
            $names = $_POST['webhook_name'];
            $urls  = $_POST['webhook_url'];
            $types = $_POST['webhook_type'];
            
            $sms_users = $_POST['sms_user'] ?? [];
            $sms_passs = $_POST['sms_pass'] ?? [];
            $sms_froms = $_POST['sms_from'] ?? [];

            for ( $i = 0; $i < count( $names ); $i++ ) {
                if ( ! empty( $names[ $i ] ) ) {
                    $id = sanitize_title( $names[ $i ] ); 
                    if(empty($id)) $id = 'conn_' . rand(1000,9999);
                    
                    $webhooks[] = array(
                        'id'   => $id,
                        'name' => sanitize_text_field( $names[ $i ] ),
                        'url'  => esc_url_raw( $urls[ $i ] ),
                        'type' => sanitize_text_field( $types[ $i ] ),
                        'sms_user' => sanitize_text_field( $sms_users[$i] ?? '' ),
                        'sms_pass' => sanitize_text_field( $sms_passs[$i] ?? '' ),
                        'sms_from' => sanitize_text_field( $sms_froms[$i] ?? '' ),
                    );
                }
            }
        }
        update_option( 'hub_webhooks', $webhooks );

        // 4. ذخیره قوانین (Rules)
        $rules = [];
        if ( isset( $_POST['rule_trigger'] ) ) {
            $triggers = $_POST['rule_trigger'];
            $names    = $_POST['rule_name'];
            
            foreach ( $triggers as $k => $trigger ) {
                $rules[] = array(
                    'name'        => sanitize_text_field( $names[$k] ),
                    'trigger'     => sanitize_text_field( $trigger ),
                    
                    'sub_trigger'     => sanitize_text_field( $_POST['rule_sub_trigger'][$k] ?? '' ),
                    'cf7_form_id'     => sanitize_text_field( $_POST['rule_cf7_form_id'][$k] ?? '' ),
                    'cf7_mobile_field'=> sanitize_text_field( $_POST['rule_cf7_mobile_field'][$k] ?? '' ),

                    // n8n
                    'active_n8n'  => isset( $_POST['rule_active_n8n'][$k] ),
                    'webhook_id'  => sanitize_text_field( $_POST['rule_webhook_id'][$k] ?? '' ),
                    'message_n8n' => wp_kses_post( $_POST['rule_message_n8n'][$k] ?? '' ),

                    // SMS
                    'active_sms'      => isset( $_POST['rule_active_sms'][$k] ),
                    'sms_provider_id' => sanitize_text_field( $_POST['rule_sms_provider_id'][$k] ?? '' ),
                    'sms_target'      => sanitize_text_field( $_POST['rule_sms_target'][$k] ?? 'customer' ),
                    'sms_custom_num'  => sanitize_text_field( $_POST['rule_sms_custom_num'][$k] ?? '' ),
                    'message_sms'     => wp_kses_post( $_POST['rule_message_sms'][$k] ?? '' ),

                    // Telegram
                    'active_tg'    => isset( $_POST['rule_active_tg'][$k] ),
                    'tg_bot_id'    => sanitize_text_field( $_POST['rule_tg_bot_id'][$k] ?? '' ),
                    'tg_chat_id'   => sanitize_text_field( $_POST['rule_tg_chat_id'][$k] ?? '' ),
                    'message_tg'   => wp_kses_post( $_POST['rule_message_tg'][$k] ?? '' ),
                );
            }
        }
        update_option( 'hub_rules', $rules );
        
        // ذخیره پراکسی
        if(isset($_POST['telegram_proxy'])) update_option('hub_telegram_proxy', sanitize_text_field($_POST['telegram_proxy']));

        echo '<div class="notice notice-success is-dismissible"><p>تنظیمات با موفقیت ذخیره شد.</p></div>';
    }
}