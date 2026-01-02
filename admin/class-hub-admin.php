<?php

class Hub_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
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

	public static function render_admin_page() {
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'connections';
		if ( isset( $_POST['hub_save_settings'] ) && check_admin_referer( 'hub_save_nonce' ) ) {
            self::save_settings();
            echo '<div class="notice notice-success is-dismissible"><p>تنظیمات ذخیره شد.</p></div>';
        }
        ?>
		<div class="wrap hub-wrap">
            <div class="hub-header"><h1>🚀 هاب اتوماسیون <span class="hub-version">v<?php echo HUB_VERSION; ?></span></h1></div>
			<nav class="nav-tab-wrapper hub-nav">
				<a href="?page=automation-hub&tab=connections" class="nav-tab <?php echo $active_tab === 'connections' ? 'nav-tab-active' : ''; ?>">🔌 اتصالات</a>
				<a href="?page=automation-hub&tab=campaigns" class="nav-tab <?php echo $active_tab === 'campaigns' ? 'nav-tab-active' : ''; ?>">📢 سناریوها (Rules)</a>
				<a href="?page=automation-hub&tab=logs" class="nav-tab <?php echo $active_tab === 'logs' ? 'nav-tab-active' : ''; ?>">📜 لاگ‌ها</a>
			</nav>
			<form method="post" class="hub-body">
                <?php wp_nonce_field( 'hub_save_nonce' ); ?>
				<?php
                switch ( $active_tab ) {
                    case 'connections': self::render_connections_tab(); break;
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
            foreach($_POST['webhooks'] as $wh) {
                if(!empty($wh['name']) && !empty($wh['url'])) {
                    $clean[] = [
                        'id' => sanitize_title($wh['name']),
                        'name' => sanitize_text_field($wh['name']),
                        'type' => sanitize_text_field($wh['type']),
                        'url' => sanitize_text_field($wh['url']),
                    ];
                }
            }
            update_option('hub_webhooks', $clean);
        }
        if(isset($_POST['rules'])) {
            $clean_rules = [];
            foreach($_POST['rules'] as $rule) {
                $rule['message_n8n'] = wp_kses_post($rule['message_n8n'] ?? '');
                $rule['message_sms'] = sanitize_textarea_field($rule['message_sms'] ?? '');
                $rule['message_tg'] = wp_kses_post($rule['message_tg'] ?? '');
                $clean_rules[] = $rule;
            }
            update_option('hub_rules', $clean_rules);
        }
        if(isset($_POST['telegram_proxy'])) update_option('hub_telegram_proxy', sanitize_text_field($_POST['telegram_proxy']));
        if(isset($_POST['gen_key'])) Hub_Security::generate_api_key();
    }

	private static function render_connections_tab() {
		$webhooks = get_option('hub_webhooks', []);
        $proxy = get_option('hub_telegram_proxy', '');
        
        require_once HUB_PLUGIN_DIR . 'integrations/class-persian-wc.php';
		$sms_active = Hub_Persian_WC::is_active();
		$sms_config = Hub_Persian_WC::get_sms_config();
        
        // جلوگیری از ارور PHP Warning
        $provider_name = is_array($sms_config) && isset($sms_config['provider']) ? $sms_config['provider'] : 'نامشخص';
        $sender_num = is_array($sms_config) && isset($sms_config['number']) ? $sms_config['number'] : '---';
		?>
        <div class="hub-grid">
            <div class="hub-col-2">
                <div class="hub-card">
                    <div class="hub-card-header">
                        <h3>لیست اتصالات (Webhooks & Bots)</h3>
                        <button type="button" class="button" id="add-webhook">+ افزودن</button>
                    </div>
                    <div class="hub-card-body" id="webhooks-container">
                        <?php if(empty($webhooks)): self::render_webhook_row(0, [], true); else: foreach($webhooks as $i => $wh) self::render_webhook_row($i, $wh); endif; ?>
                    </div>
                </div>
            </div>
            <div class="hub-col-1">
                <div class="hub-card">
                    <div class="hub-card-header"><h3>⚙️ تنظیمات تلگرام & پیامک</h3></div>
                    <div class="hub-card-body">
                        <label><strong>پروکسی تلگرام (اختیاری):</strong></label>
                        <input type="text" name="telegram_proxy" value="<?php echo esc_attr($proxy); ?>" class="regular-text full-width" placeholder="ip:port">
                        <hr>
                        <p><strong>وضعیت پیامک (Persian WC):</strong></p>
                        <?php if ( $sms_active ) : ?>
                            <span class="badge success">✅ متصل به: <?php echo esc_html($provider_name); ?></span>
                            <br><small>شماره فرستنده: <?php echo esc_html($sender_num); ?></small>
                        <?php else : ?>
                            <span class="badge error">❌ افزونه پیامک ووکامرس فارسی یافت نشد</span>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="hub-card">
                     <div class="hub-card-header"><h3>🔒 امنیت API</h3></div>
                     <div class="hub-card-body">
                         <input type="text" value="<?php echo esc_attr(Hub_Security::get_api_key()); ?>" class="code-input full-width" readonly>
                         <button type="submit" name="gen_key" value="1" class="button" style="margin-top:10px">تولید مجدد کلید</button>
                     </div>
                </div>
            </div>
        </div>
        <template id="webhook-template"><?php self::render_webhook_row('INDEX', [], true); ?></template>
		<?php
	}

    private static function render_webhook_row($index, $data = [], $is_template = false) {
        $type = $data['type'] ?? 'webhook';
        ?>
        <div class="repeater-row webhook-row">
            <div class="row-actions"><span class="dashicons dashicons-trash remove-row"></span></div>
            <div class="row-fields">
                <input type="text" name="webhooks[<?php echo $index; ?>][name]" value="<?php echo esc_attr($data['name']??''); ?>" placeholder="نام (مثلاً: ربات مدیر)" class="input-name">
                <select name="webhooks[<?php echo $index; ?>][type]" class="input-type">
                    <option value="webhook" <?php selected($type, 'webhook'); ?>>n8n Webhook</option>
                    <option value="telegram" <?php selected($type, 'telegram'); ?>>Telegram Bot</option>
                </select>
                <input type="text" name="webhooks[<?php echo $index; ?>][url]" value="<?php echo esc_attr($data['url']??''); ?>" placeholder="URL یا Token" class="input-url">
            </div>
        </div>
        <?php
    }

    private static function render_campaigns_tab() {
        $rules = get_option('hub_rules', []);
        $webhooks = get_option('hub_webhooks', []);
        $wc_statuses = function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [];
        ?>
        <div class="hub-card">
            <div class="hub-card-header">
                <h3>سناریوهای فعال</h3>
                <button type="button" class="button button-primary" id="add-rule">+ سناریوی جدید</button>
            </div>
            <div class="hub-card-body" id="rules-container">
                <?php if(empty($rules)): ?><p class="no-data-msg">هنوز هیچ سناریویی تعریف نکرده‌اید.</p><?php else: foreach($rules as $i => $rule) self::render_rule_row($i, $rule, $webhooks, $wc_statuses); endif; ?>
            </div>
        </div>
        <template id="rule-template"><?php self::render_rule_row('INDEX', [], $webhooks, $wc_statuses, true); ?></template>
        <?php
    }

    private static function render_rule_row($index, $data, $webhooks, $wc_statuses, $is_template = false) {
        $active_n8n = !empty($data['active_n8n']);
        $active_sms = !empty($data['active_sms']);
        $active_tg = !empty($data['active_tg']);
        ?>
        <div class="repeater-row rule-row">
            <div class="rule-header">
                <span class="rule-title">سناریو #<?php echo $is_template ? 'جدید' : $index+1; ?></span>
                <span class="dashicons dashicons-trash remove-row"></span>
            </div>
            <div class="rule-body">
                <div class="rule-section trigger-section">
                    <label>۱. شرط اجرا (Trigger)</label>
                    <div class="flex-row">
                        <select name="rules[<?php echo $index; ?>][trigger]" class="trigger-select">
                            <option value="order_status" <?php selected($data['trigger']??'', 'order_status'); ?>>تغییر وضعیت سفارش</option>
                            <option value="order_created" <?php selected($data['trigger']??'', 'order_created'); ?>>ثبت سفارش جدید</option>
                            <option value="user_register" <?php selected($data['trigger']??'', 'user_register'); ?>>ثبت‌نام کاربر</option>
                        </select>
                        <select name="rules[<?php echo $index; ?>][sub_trigger]" class="sub-trigger-select">
                            <option value="">-- انتخاب وضعیت --</option>
                            <?php foreach($wc_statuses as $k=>$v) echo "<option value='$k' ".selected($data['sub_trigger']??'', $k, false).">$v</option>"; ?>
                        </select>
                    </div>
                </div>

                <div class="rule-section actions-grid">
                    <div class="action-col <?php echo $active_n8n ? 'active' : ''; ?>">
                        <label><input type="checkbox" name="rules[<?php echo $index; ?>][active_n8n]" value="1" <?php checked($active_n8n); ?> class="toggle-action"> 🌐 ارسال به n8n</label>
                        <div class="action-body">
                            <select name="rules[<?php echo $index; ?>][webhook_id]" class="full-width">
                                <option value="">انتخاب Webhook...</option>
                                <?php foreach($webhooks as $wh) if($wh['type']=='webhook') echo "<option value='{$wh['id']}' ".selected($data['webhook_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?>
                            </select>
                            <textarea name="rules[<?php echo $index; ?>][message_n8n]" rows="2" placeholder="پیام ضمیمه (اختیاری)"><?php echo esc_textarea($data['message_n8n']??''); ?></textarea>
                        </div>
                    </div>
                    <div class="action-col <?php echo $active_sms ? 'active' : ''; ?>">
                        <label><input type="checkbox" name="rules[<?php echo $index; ?>][active_sms]" value="1" <?php checked($active_sms); ?> class="toggle-action"> 📩 ارسال پیامک</label>
                        <div class="action-body">
                            <select name="rules[<?php echo $index; ?>][sms_target]" class="full-width sms-target-select">
                                <option value="customer" <?php selected($data['sms_target']??'', 'customer'); ?>>مشتری (خودکار)</option>
                                <option value="custom" <?php selected($data['sms_target']??'', 'custom'); ?>>مدیر (شماره ثابت)</option>
                            </select>
                            <input type="text" name="rules[<?php echo $index; ?>][sms_custom_num]" value="<?php echo esc_attr($data['sms_custom_num']??''); ?>" class="full-width sms-custom-input" placeholder="0912..." style="margin-bottom:5px;">
                            <textarea name="rules[<?php echo $index; ?>][message_sms]" rows="3" placeholder="متن پیامک..."><?php echo esc_textarea($data['message_sms']??''); ?></textarea>
                        </div>
                    </div>
                    <div class="action-col <?php echo $active_tg ? 'active' : ''; ?>">
                        <label><input type="checkbox" name="rules[<?php echo $index; ?>][active_tg]" value="1" <?php checked($active_tg); ?> class="toggle-action"> ✈️ ارسال تلگرام</label>
                        <div class="action-body">
                            <select name="rules[<?php echo $index; ?>][tg_bot_id]" class="full-width">
                                <option value="">انتخاب ربات...</option>
                                <?php foreach($webhooks as $wh) if($wh['type']=='telegram') echo "<option value='{$wh['id']}' ".selected($data['tg_bot_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?>
                            </select>
                            <input type="text" name="rules[<?php echo $index; ?>][tg_chat_id]" value="<?php echo esc_attr($data['tg_chat_id']??''); ?>" class="full-width" placeholder="Chat ID">
                            <textarea name="rules[<?php echo $index; ?>][message_tg]" rows="2" placeholder="متن پیام..."><?php echo esc_textarea($data['message_tg']??''); ?></textarea>
                        </div>
                    </div>
                </div>
                <div class="shortcode-hint"><small>متغیرها: <code>{order_id}</code>, <code>{status}</code>, <code>{full_name}</code>, <code>{total}</code>, <code>{_scrape_raw_result_}</code></small></div>
            </div>
        </div>
        <?php
    }

	private static function render_logs_tab() { 
        global $wpdb; $table = $wpdb->prefix . 'hub_logs'; $logs = $wpdb->get_results( "SELECT * FROM $table ORDER BY id DESC LIMIT 50" );
        ?>
        <div class="hub-card"><h3>📜 لاگ‌های سیستم</h3><table class="wp-list-table widefat fixed striped"><thead><tr><th>زمان</th><th>نوع</th><th>منبع</th><th>پیام</th></tr></thead><tbody><?php if($logs): foreach($logs as $log): ?><tr><td dir="ltr"><?php echo $log->created_at; ?></td><td><?php echo $log->log_type; ?></td><td><?php echo $log->source; ?></td><td><?php echo esc_html($log->message); ?></td></tr><?php endforeach; endif; ?></tbody></table></div>
        <?php
    }
}