<?php

class Hub_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
        
        // هندلر AJAX برای تست سناریو
        add_action( 'wp_ajax_hub_test_scenario', array( __CLASS__, 'handle_test_scenario' ) );

        // هندلر جدید: تست اتصال (Ping URL)
        add_action( 'wp_ajax_hub_test_connection', array( __CLASS__, 'handle_test_connection' ) );
	}

	public static function add_admin_menu() {
		add_menu_page( 'هاب اتوماسیون', 'هاب اتوماسیون', 'manage_options', 'automation-hub', array( __CLASS__, 'render_admin_page' ), 'dashicons-superhero-alt', 56 );
	}

	public static function enqueue_assets( $hook ) {
		if ( 'toplevel_page_automation-hub' !== $hook ) return;
		wp_enqueue_style( 'hub-admin-style', HUB_PLUGIN_URL . 'admin/css/hub-admin.css', array(), HUB_VERSION );
		wp_enqueue_script( 'hub-admin-js', HUB_PLUGIN_URL . 'admin/js/hub-admin.js', array( 'jquery' ), HUB_VERSION, true );
        wp_localize_script( 'hub-admin-js', 'hubData', array( 'statuses' => function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [] ) );
	}

    // --- تابع کمکی برای دریافت فرم‌های CF7 ---
    private static function get_cf7_forms() {
        if ( ! post_type_exists( 'wpcf7_contact_form' ) ) {
            return [];
        }
        $forms = get_posts( array(
            'post_type' => 'wpcf7_contact_form',
            'posts_per_page' => -1,
        ) );
        $options = [];
        foreach ( $forms as $form ) {
            $options[ $form->ID ] = $form->post_title . " (ID: $form->ID)";
        }
        return $options;
    }

    // --- تابع جدید: پردازش تست اتصال ---
    public static function handle_test_connection() {
        if(!check_ajax_referer('hub_save_nonce', 'nonce', false) && !current_user_can('manage_options')) {
            wp_send_json_error('عدم دسترسی');
        }

        $url = esc_url_raw($_POST['url']);

        if ( empty($url) ) {
            wp_send_json_error('آدرس URL وارد نشده است.');
        }

        if ( ! filter_var($url, FILTER_VALIDATE_URL) ) {
            wp_send_json_error('فرمت URL نامعتبر است.');
        }

        // ارسال یک درخواست تست سبک
        $args = array(
            'body'        => json_encode(['test_connection' => true, 'message' => 'Hello from WordPress!']),
            'headers'     => array( 'Content-Type' => 'application/json' ),
            'timeout'     => 10,
            'sslverify'   => false,
        );

        $response = wp_remote_post( $url, $args );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error('خطا در برقراری ارتباط: ' . $response->get_error_message());
        }

        $response_code = wp_remote_retrieve_response_code( $response );
        
        if ( $response_code >= 200 && $response_code < 300 ) {
            wp_send_json_success("ارتباط موفق بود! (Status: $response_code)");
        } else {
            wp_send_json_error("ارتباط برقرار شد اما خطا دریافت شد. (Status: $response_code)");
        }
    }

    // --- تابع: پردازش تست سناریو ---
    public static function handle_test_scenario() {
        if(!check_ajax_referer('hub_save_nonce', 'nonce', false) && !current_user_can('manage_options')) {
            wp_send_json_error('عدم دسترسی');
        }

        $type = sanitize_text_field($_POST['type']); // n8n, sms, telegram
        $connection_id = sanitize_text_field($_POST['connection_id']);
        $raw_message = wp_kses_post($_POST['message']); // پیام خام
        $to_custom = sanitize_text_field($_POST['custom_target'] ?? '');

        // پیدا کردن اطلاعات اتصال
        $webhooks = get_option('hub_webhooks', []);
        $connection = null;
        foreach($webhooks as $wh) {
            if($wh['id'] === $connection_id) { $connection = $wh; break; }
        }

        if(!$connection) wp_send_json_error('اتصال یافت نشد. لطفاً ابتدا سناریو را ذخیره کنید.');

        // پیدا کردن آخرین سفارش برای تست
        $orders = wc_get_orders(['limit' => 1, 'orderby' => 'date', 'order' => 'DESC']);
        if(empty($orders)) wp_send_json_error('هیچ سفارشی برای تست در فروشگاه یافت نشد.');
        
        $order = $orders[0];
        
        // ترجمه پیام
        $processed_msg = Hub_Bridge::parse_shortcodes($raw_message, $order);

        // ارسال بر اساس نوع
        if ($type === 'n8n') {
            $payload = Hub_Bridge::build_payload_n8n($order, $processed_msg);
            $payload['_webhook_url'] = $connection['url'];
            // اضافه کردن فلگ تست
            $payload['is_test_run'] = true;
            
            Hub_Sender::send_immediate('n8n.send', $payload);
            wp_send_json_success('تست n8n با موفقیت ارسال شد (آنی).');
        } 
        elseif ($type === 'sms') {
            // برای تست پیامک، اگر شماره دستی وارد شده باشد به آن میزنیم، وگرنه به شماره سفارش
            $target = !empty($to_custom) ? $to_custom : $order->get_billing_phone();
            $target = Hub_Bridge::normalize_number($target);
            
            if(empty($target)) wp_send_json_error('شماره موبایل معتبری یافت نشد.');

            $args = [
                'mobile' => $target,
                'message' => $processed_msg,
                'user' => $connection['sms_user'],
                'pass' => $connection['sms_pass'],
                'from' => $connection['sms_from']
            ];
            Hub_Sender::send_immediate('sms.send', $args);
            wp_send_json_success("تست پیامک به شماره $target ارسال شد.");
        }
        elseif ($type === 'telegram') {
            // تست تلگرام
            $chat_id = sanitize_text_field($_POST['chat_id']);
            if(empty($chat_id)) wp_send_json_error('چت آیدی وارد نشده است.');

            $args = [
                'token' => $connection['url'],
                'chat_id' => $chat_id,
                'message' => $processed_msg
            ];
            Hub_Sender::send_immediate('telegram.send', $args);
            wp_send_json_success('تست تلگرام ارسال شد.');
        }
    }

	public static function render_admin_page() {
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'connections';
		
		if ( isset( $_POST['hub_save_settings'] ) && check_admin_referer( 'hub_save_nonce' ) ) {
            self::save_settings();
            echo '<div class="notice notice-success is-dismissible"><p>تنظیمات با موفقیت ذخیره شد.</p></div>';
        }
        ?>
		<div class="wrap hub-wrap">
            <div class="hub-header">
                <h1>🚀 هاب اتوماسیون <span class="hub-version">v<?php echo HUB_VERSION; ?></span></h1>
            </div>
			
			<nav class="nav-tab-wrapper hub-nav">
				<a href="?page=automation-hub&tab=connections" class="nav-tab <?php echo $active_tab === 'connections' ? 'nav-tab-active' : ''; ?>"><span class="dashicons dashicons-admin-links"></span> اتصالات</a>
				<a href="?page=automation-hub&tab=settings" class="nav-tab <?php echo $active_tab === 'settings' ? 'nav-tab-active' : ''; ?>"><span class="dashicons dashicons-admin-settings"></span> تنظیمات سیستم</a>
				<a href="?page=automation-hub&tab=campaigns" class="nav-tab <?php echo $active_tab === 'campaigns' ? 'nav-tab-active' : ''; ?>"><span class="dashicons dashicons-migrate"></span> سناریوها</a>
				<a href="?page=automation-hub&tab=logs" class="nav-tab <?php echo $active_tab === 'logs' ? 'nav-tab-active' : ''; ?>"><span class="dashicons dashicons-list-view"></span> لاگ‌ها</a>
			</nav>

			<form method="post" class="hub-body">
                <?php wp_nonce_field( 'hub_save_nonce' ); ?>
				<?php
                switch ( $active_tab ) {
                    case 'connections': self::render_connections_tab(); break;
                    case 'settings': self::render_settings_tab(); break;
                    case 'campaigns': self::render_campaigns_tab(); break;
                    case 'logs': self::render_logs_tab(); break;
                    default: self::render_connections_tab();
                }
				?>
                <?php if($active_tab !== 'logs'): ?>
                <div class="hub-footer-actions"><button type="submit" name="hub_save_settings" class="button button-primary button-hero">ذخیره تغییرات</button></div>
                <?php endif; ?>
			</form>
		</div>
		<?php
	}

    private static function save_settings() {
        if(isset($_POST['webhooks'])) {
            $clean = [];
            foreach($_POST['webhooks'] as $index => $wh) {
                if($index === 'INDEX') continue;
                if(!empty($wh['name'])) {
                    $clean[] = [
                        'id' => sanitize_title($wh['name']),
                        'name' => sanitize_text_field($wh['name']),
                        'type' => sanitize_text_field($wh['type']),
                        'url' => sanitize_text_field($wh['url']), 
                        'sms_user' => sanitize_text_field($wh['sms_user'] ?? ''),
                        'sms_pass' => sanitize_text_field($wh['sms_pass'] ?? ''),
                        'sms_from' => sanitize_text_field($wh['sms_from'] ?? ''),
                    ];
                }
            }
            update_option('hub_webhooks', $clean);
        }

        if(isset($_POST['rules'])) {
            $clean_rules = [];
            foreach($_POST['rules'] as $index => $rule) {
                if($index === 'INDEX') continue;
                if(empty($rule['trigger'])) continue;

                $rule['name'] = sanitize_text_field($rule['name'] ?? '');
                $rule['trigger'] = sanitize_text_field($rule['trigger']);
                $rule['sub_trigger'] = sanitize_text_field($rule['sub_trigger'] ?? '');
                // فیلدهای جدید مربوط به CF7
                $rule['cf7_form_id'] = sanitize_text_field($rule['cf7_form_id'] ?? '');
                $rule['cf7_mobile_field'] = sanitize_text_field($rule['cf7_mobile_field'] ?? '');

                $rule['message_n8n'] = wp_kses_post($rule['message_n8n'] ?? '');
                $rule['message_sms'] = sanitize_textarea_field($rule['message_sms'] ?? '');
                $rule['message_tg'] = wp_kses_post($rule['message_tg'] ?? '');

                // سایر فیلدهای که ممکن است نیاز باشند
                $rule['active_n8n'] = isset($rule['active_n8n']);
                $rule['active_sms'] = isset($rule['active_sms']);
                $rule['active_tg'] = isset($rule['active_tg']);
                $rule['webhook_id'] = sanitize_text_field($rule['webhook_id'] ?? '');
                $rule['sms_provider_id'] = sanitize_text_field($rule['sms_provider_id'] ?? '');
                $rule['sms_target'] = sanitize_text_field($rule['sms_target'] ?? 'customer');
                $rule['sms_custom_num'] = sanitize_text_field($rule['sms_custom_num'] ?? '');
                $rule['tg_bot_id'] = sanitize_text_field($rule['tg_bot_id'] ?? '');
                $rule['tg_chat_id'] = sanitize_text_field($rule['tg_chat_id'] ?? '');

                $clean_rules[] = $rule;
            }
            update_option('hub_rules', $clean_rules);
        }

        if(isset($_POST['hub_auth_rate_limit'])) {
            $auth_settings = [
                'active' => isset($_POST['hub_auth_active']) ? 1 : 0,
                'unified_login' => isset($_POST['hub_auth_unified']) ? 1 : 0,
                'redirect_url' => esc_url_raw($_POST['hub_auth_redirect']),
                'rate_limit' => intval($_POST['hub_auth_rate_limit']),
                'google_login' => isset($_POST['hub_auth_google']) ? 1 : 0,
            ];
            update_option('hub_auth_settings', $auth_settings);
        }

        if(isset($_POST['telegram_proxy'])) update_option('hub_telegram_proxy', sanitize_text_field($_POST['telegram_proxy']));
        if(isset($_POST['gen_key'])) Hub_Security::generate_api_key();
    }

	private static function render_connections_tab() {
		$webhooks = get_option('hub_webhooks', []);
        $proxy = get_option('hub_telegram_proxy', '');
        $sms_status_html = '<span class="badge error">تنظیم نشده</span>';
        foreach($webhooks as $wh) { if($wh['type'] === 'melipayamak') { $sms_status_html = '<span class="badge success">✅ متصل به ملی‌پیامک</span><br><small>خط: '.esc_html($wh['sms_from']).'</small>'; break; } }
		?>
        <div class="hub-grid">
            <div class="hub-col-2">
                <div class="hub-card">
                    <div class="hub-card-header">
                        <h3>لیست اتصالات</h3>
                        <button type="button" class="button" id="add-webhook">+ افزودن اتصال</button>
                    </div>
                    <div class="hub-card-body" id="webhooks-container">
                        <?php if(empty($webhooks)): self::render_webhook_row(0, [], true); else: foreach($webhooks as $i => $wh) self::render_webhook_row($i, $wh); endif; ?>
                    </div>
                </div>
            </div>
            <div class="hub-col-1">
                <div class="hub-card">
                    <div class="hub-card-header"><h3>⚙️ وضعیت سرویس‌ها</h3></div>
                    <div class="hub-card-body">
                        <p><strong>وضعیت پیامک:</strong></p><?php echo $sms_status_html; ?>
                        <hr>
                        <label><strong>پروکسی تلگرام:</strong></label>
                        <input type="text" name="telegram_proxy" value="<?php echo esc_attr($proxy); ?>" class="regular-text full-width" placeholder="ip:port">
                    </div>
                </div>
                <div class="hub-card">
                     <div class="hub-card-header"><h3>🔒 امنیت API</h3></div>
                     <div class="hub-card-body"><input type="text" value="<?php echo esc_attr(Hub_Security::get_api_key()); ?>" class="code-input full-width" readonly></div>
                </div>
            </div>
        </div>
        <div id="webhook-template" style="display:none;"><?php self::render_webhook_row('INDEX', [], true); ?></div>
		<?php
	}

    private static function render_webhook_row($index, $data = [], $is_template = false) {
        $type = $data['type'] ?? 'webhook';
        ?>
        <div class="repeater-row webhook-row">
            <div class="row-fields">
                <div style="flex:1"><input type="text" name="webhooks[<?php echo $index; ?>][name]" value="<?php echo esc_attr($data['name']??''); ?>" placeholder="نام (مثلاً n8n اصلی)" class="input-name full-width"></div>
                <div style="flex:1">
                    <select name="webhooks[<?php echo $index; ?>][type]" class="input-type full-width">
                        <option value="webhook" <?php selected($type, 'webhook'); ?>>🌐 n8n Webhook</option>
                        <option value="telegram" <?php selected($type, 'telegram'); ?>>✈️ Telegram Bot</option>
                        <option value="melipayamak" <?php selected($type, 'melipayamak'); ?>>📩 ملی پیامک</option>
                    </select>
                </div>
                
                <div class="dynamic-fields" style="flex:2">
                    <div class="field-group field-url flex-group" style="<?php echo ($type=='melipayamak') ? 'display:none;' : 'display:flex;'; ?>">
                        <input type="text" name="webhooks[<?php echo $index; ?>][url]" value="<?php echo esc_attr($data['url']??''); ?>" placeholder="Webhook URL یا Token" class="input-url full-width">
                        <button type="button" class="button btn-test-conn" title="بررسی صحت آدرس URL">🔗 تست</button>
                    </div>
                    
                    <div class="field-group field-sms" style="<?php echo ($type!='melipayamak') ? 'display:none;' : 'display:flex; gap:5px;'; ?>">
                        <input type="text" name="webhooks[<?php echo $index; ?>][sms_user]" value="<?php echo esc_attr($data['sms_user']??''); ?>" placeholder="نام کاربری" style="width:33%">
                        <input type="text" name="webhooks[<?php echo $index; ?>][sms_pass]" value="<?php echo esc_attr($data['sms_pass']??''); ?>" placeholder="رمز عبور" style="width:33%">
                        <input type="text" name="webhooks[<?php echo $index; ?>][sms_from]" value="<?php echo esc_attr($data['sms_from']??''); ?>" placeholder="شماره خط" style="width:33%">
                    </div>
                </div>

                <div style="width:30px;"><span class="dashicons dashicons-trash remove-row" title="حذف"></span></div>
            </div>
        </div>
        <?php
    }

    private static function render_settings_tab() {
        $defaults = ['active'=>0, 'unified_login'=>0, 'redirect_url'=>'', 'rate_limit'=>120, 'google_login'=>0];
        $settings = wp_parse_args(get_option('hub_auth_settings', []), $defaults);
        ?>
        <div class="hub-card">
            <div class="hub-card-header"><h3>🔐 تنظیمات ورود و ثبت‌نام</h3></div>
            <div class="hub-card-body">
                <table class="form-table">
                    <tr><th scope="row">سیستم لاگین (OTP)</th><td><label class="switch-label"><input type="checkbox" name="hub_auth_active" value="1" <?php checked($settings['active']); ?>> فعال‌سازی سیستم ورود با شماره موبایل</label></td></tr>
                    <tr><th scope="row">یکپارچه‌سازی ووکامرس</th><td><label class="switch-label"><input type="checkbox" name="hub_auth_unified" value="1" <?php checked($settings['unified_login']); ?>> جایگزینی فرم‌های پیش‌فرض ووکامرس</label></td></tr>
                    <tr><th scope="row">محدودیت زمانی (Rate Limit)</th><td><input type="number" name="hub_auth_rate_limit" value="<?php echo esc_attr($settings['rate_limit']); ?>" class="small-text"> ثانیه</td></tr>
                    <tr><th scope="row">هدایت پیش‌فرض</th><td><input type="url" name="hub_auth_redirect" value="<?php echo esc_attr($settings['redirect_url']); ?>" class="regular-text" placeholder="https://..."></td></tr>
                </table>
            </div>
        </div>
        <?php
    }

    private static function render_campaigns_tab() {
        $rules = get_option('hub_rules', []); 
        $webhooks = get_option('hub_webhooks', []); 
        $wc_statuses = function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [];
        $cf7_forms = self::get_cf7_forms();
        ?>
        <div class="hub-card">
            <div class="hub-card-header">
                <h3>سناریوهای فعال</h3>
                <button type="button" class="button button-primary" id="add-rule">+ سناریوی جدید</button>
            </div>
            <div class="hub-card-body" id="rules-container">
                <?php if(empty($rules)): ?><p class="no-data-msg">هنوز هیچ سناریویی تعریف نکرده‌اید.</p><?php else: foreach($rules as $i => $rule) self::render_rule_row($i, $rule, $webhooks, $wc_statuses, $cf7_forms); endif; ?>
            </div>
        </div>
        <div id="rule-template" style="display:none;"><?php self::render_rule_row('INDEX', [], $webhooks, $wc_statuses, $cf7_forms, true); ?></div>
        <?php
    }

    private static function render_rule_row($index, $data, $webhooks, $wc_statuses, $cf7_forms, $is_template = false) {
        $active_n8n = !empty($data['active_n8n']); $active_sms = !empty($data['active_sms']); $active_tg = !empty($data['active_tg']); $trigger = $data['trigger'] ?? '';
        $rule_name = !empty($data['name']) ? $data['name'] : ($is_template ? 'سناریوی جدید' : 'سناریو #' . ($index+1));
        
        // shortcode guides
        // note: logic for showing correct guide is handled by JS now
        $vars_html = '<div class="var-list trigger-guide guide-auth_request" style="display:none">';
        $vars_html .= '<span class="var-tag" data-insert="{otp}">{otp}</span><span class="var-tag" data-insert="{phone}">{phone}</span>';
        $vars_html .= '</div>';

        $vars_html .= '<div class="var-list trigger-guide guide-order_status guide-order_created" style="display:none">';
        $vars_html .= '<span class="var-tag" data-insert="{full_name}">{full_name}</span><span class="var-tag" data-insert="{order_id}">{order_id}</span><span class="var-tag" data-insert="{total}">{total}</span>';
        $vars_html .= '</div>';
        $vars_html .= '<div class="var-list trigger-guide guide-user_register" style="display:none">';
        $vars_html .= '<span class="var-tag" data-insert="{full_name}">{full_name}</span><span class="var-tag" data-insert="{first_name}">{first_name}</span><span class="var-tag" data-insert="{phone}">{phone}</span><span class="var-tag" data-insert="{email}">{email}</span>';
        $vars_html .= '</div>';

        $vars_html .= '<div class="trigger-guide guide-cf7_submit shortcode-guide" style="display:none">';
        $vars_html .= '<strong>💡 راهنمای فرم تماس:</strong><br>';
        $vars_html .= 'برای استفاده از مقادیر فرم، از شورت‌کد <code>{field:name_of_field}</code> استفاده کنید.<br>';
        $vars_html .= 'مثال: اگر در فرم فیلدی با نام <code>your-email</code> دارید، بنویسید: <code>{field:your-email}</code>';
        $vars_html .= '</div>';

        // default to show something if needed, but JS will fix it immediately
        ?>
        <div class="repeater-row rule-row <?php echo $is_template ? 'open' : ''; ?>">
            <div class="rule-header">
                <span class="rule-title">
                    <span class="dashicons dashicons-flow-line"></span> 
                    <span class="rule-name-display"><?php echo esc_html($rule_name); ?></span>
                </span>
                <div class="rule-actions">
                    <span class="dashicons dashicons-arrow-down-alt2 rule-toggle-icon"></span>
                    <span class="dashicons dashicons-trash remove-row" title="حذف"></span>
                </div>
            </div>
            
            <div class="rule-body">
                <div class="rule-section" style="border-bottom:1px solid #eee; padding-bottom:15px; margin-bottom:15px;">
                    <label>نام سناریو (اختیاری)</label>
                    <input type="text" name="rules[<?php echo $index; ?>][name]" value="<?php echo esc_attr($data['name']??''); ?>" class="rule-name-input full-width" placeholder="مثلاً: پیامک ثبت سفارش مدیر">
                </div>

                <div class="rule-section">
                    <label>۱. شرط اجرا</label>
                    <div class="flex-row">
                        <select name="rules[<?php echo $index; ?>][trigger]" class="trigger-select full-width">
                            <option value="order_status" <?php selected($trigger, 'order_status'); ?>>تغییر وضعیت سفارش (WooCommerce)</option>
                            <option value="order_created" <?php selected($trigger, 'order_created'); ?>>سفارش جدید (ایجاد شده)</option>
                            <option value="cf7_submit" <?php selected($trigger, 'cf7_submit'); ?>>ثبت فرم تماس (Contact Form 7)</option>
                            <option value="user_register" <?php selected($trigger, 'user_register'); ?>>ثبت نام کاربر جدید</option>
                            <option value="auth_request" <?php selected($trigger, 'auth_request'); ?>>درخواست ورود (OTP)</option>
                        </select>

                        <div class="trigger-conditions full-width">
                             <div class="condition-box cond-order_status" style="<?php echo ($trigger !== 'order_status') ? 'display:none' : ''; ?>">
                                <select name="rules[<?php echo $index; ?>][sub_trigger]" class="sub-trigger-select full-width">
                                    <option value="">-- همه وضعیت‌ها --</option>
                                    <?php 
                                    $saved_sub = str_replace('wc-', '', $data['sub_trigger'] ?? '');
                                    foreach($wc_statuses as $k=>$v) {
                                        $opt_val = str_replace('wc-', '', $k);
                                        echo "<option value='{$opt_val}' ".selected($saved_sub, $opt_val, false).">$v</option>"; 
                                    }
                                    ?>
                                </select>
                            </div>

                            <div class="condition-box cond-cf7_submit" style="<?php echo ($trigger !== 'cf7_submit') ? 'display:none' : ''; ?>">
                                <select name="rules[<?php echo $index; ?>][cf7_form_id]" class="full-width">
                                    <option value="">-- همه فرم‌ها --</option>
                                    <?php foreach($cf7_forms as $id=>$title): ?>
                                        <option value="<?php echo $id; ?>" <?php selected(($data['cf7_form_id']??''), $id); ?>><?php echo $title; ?></option>
                                    <?php endforeach; ?>
                                </select>

                                <label style="margin-top:5px; display:block; font-size:11px; color:#666;">نام فیلد موبایل (جهت ارسال SMS به کاربر):</label>
                                <input type="text" name="rules[<?php echo $index; ?>][cf7_mobile_field]" value="<?php echo esc_attr($data['cf7_mobile_field'] ?? ''); ?>" placeholder="مثلا: your-mobile" class="full-width" style="font-size:11px;">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rule-section actions-grid">
                    <div class="action-col <?php echo $active_n8n?'active':''; ?>">
                        <label><input type="checkbox" name="rules[<?php echo $index; ?>][active_n8n]" value="1" <?php checked($active_n8n); ?> class="toggle-action"> n8n</label>
                        <div class="action-body">
                            <select name="rules[<?php echo $index; ?>][webhook_id]" class="full-width conn-select"><option value="">انتخاب...</option><?php foreach($webhooks as $wh) if($wh['type']=='webhook') echo "<option value='{$wh['id']}' ".selected($data['webhook_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?></select>
                            <textarea name="rules[<?php echo $index; ?>][message_n8n]" rows="2" class="msg-input"><?php echo esc_textarea($data['message_n8n']??''); ?></textarea>
                            <?php echo $vars_html; ?>
                            <button type="button" class="button button-small test-action-btn" data-type="n8n" style="margin-top:8px;">تست آنی ⚡</button>
                        </div>
                    </div>
                    
                    <div class="action-col <?php echo $active_sms?'active':''; ?>">
                        <label><input type="checkbox" name="rules[<?php echo $index; ?>][active_sms]" value="1" <?php checked($active_sms); ?> class="toggle-action"> پیامک</label>
                        <div class="action-body">
                            <select name="rules[<?php echo $index; ?>][sms_provider_id]" class="full-width conn-select"><option value="">انتخاب پنل...</option><?php foreach($webhooks as $wh) if($wh['type']=='melipayamak') echo "<option value='{$wh['id']}' ".selected($data['sms_provider_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?></select>
                            <select name="rules[<?php echo $index; ?>][sms_target]" class="sms-target-select full-width"><option value="customer" <?php selected($data['sms_target']??'','customer'); ?>>مشتری</option><option value="custom" <?php selected($data['sms_target']??'','custom'); ?>>مدیر</option></select>
                            <input type="text" name="rules[<?php echo $index; ?>][sms_custom_num]" value="<?php echo esc_attr($data['sms_custom_num']??''); ?>" class="sms-custom-input full-width" style="margin-bottom:5px;">
                            <textarea name="rules[<?php echo $index; ?>][message_sms]" rows="3" class="msg-input"><?php echo esc_textarea($data['message_sms']??''); ?></textarea>
                            <?php echo $vars_html; ?>
                            <button type="button" class="button button-small test-action-btn" data-type="sms" style="margin-top:8px;">تست آنی ⚡</button>
                        </div>
                    </div>
                    
                    <div class="action-col <?php echo $active_tg?'active':''; ?>">
                        <label><input type="checkbox" name="rules[<?php echo $index; ?>][active_tg]" value="1" <?php checked($active_tg); ?> class="toggle-action"> تلگرام</label>
                        <div class="action-body">
                            <select name="rules[<?php echo $index; ?>][tg_bot_id]" class="full-width conn-select"><option value="">انتخاب ربات...</option><?php foreach($webhooks as $wh) if($wh['type']=='telegram') echo "<option value='{$wh['id']}' ".selected($data['tg_bot_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?></select>
                            <input type="text" name="rules[<?php echo $index; ?>][tg_chat_id]" value="<?php echo esc_attr($data['tg_chat_id']??''); ?>" class="full-width tg-chat-input" placeholder="Chat ID">
                            <textarea name="rules[<?php echo $index; ?>][message_tg]" rows="2" class="msg-input"><?php echo esc_textarea($data['message_tg']??''); ?></textarea>
                            <?php echo $vars_html; ?>
                            <button type="button" class="button button-small test-action-btn" data-type="telegram" style="margin-top:8px;">تست آنی ⚡</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    private static function render_logs_tab() { global $wpdb; $table = $wpdb->prefix . 'hub_logs'; $logs = $wpdb->get_results( "SELECT * FROM $table ORDER BY id DESC LIMIT 50" ); ?><div class="hub-card"><h3>📜 لاگ‌ها</h3><table class="wp-list-table widefat fixed striped"><thead><tr><th>زمان</th><th>نوع</th><th>منبع</th><th>پیام</th></tr></thead><tbody><?php if($logs): foreach($logs as $log): ?><tr><td dir="ltr"><?php echo $log->created_at; ?></td><td><?php echo $log->log_type; ?></td><td><?php echo $log->source; ?></td><td><?php echo esc_html($log->message); ?></td></tr><?php endforeach; endif; ?></tbody></table></div><?php }
}
