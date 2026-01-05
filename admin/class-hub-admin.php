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
        // 1. اتصالات
        if(isset($_POST['webhooks'])) {
            $clean = [];
            foreach($_POST['webhooks'] as $wh) {
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

        // 2. سناریوها
        if(isset($_POST['rules'])) {
            $clean_rules = [];
            foreach($_POST['rules'] as $rule) {
                $rule['name'] = sanitize_text_field($rule['name'] ?? ''); 
                $rule['message_n8n'] = wp_kses_post($rule['message_n8n'] ?? '');
                $rule['message_sms'] = sanitize_textarea_field($rule['message_sms'] ?? '');
                $rule['message_tg'] = wp_kses_post($rule['message_tg'] ?? '');
                $clean_rules[] = $rule;
            }
            update_option('hub_rules', $clean_rules);
        }

        // 3. تنظیمات سیستم (اصلاح باگ ذخیره نشدن)
        // به جای چک کردن چک‌باکس (که اگر تیک نخورد ارسال نمی‌شود)، فیلد متنی rate_limit را چک می‌کنیم که همیشه هست.
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

	// --- TAB 1: CONNECTIONS ---
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
                    <div class="field-group field-url" style="<?php echo ($type=='melipayamak') ? 'display:none;' : ''; ?>">
                        <input type="text" name="webhooks[<?php echo $index; ?>][url]" value="<?php echo esc_attr($data['url']??''); ?>" placeholder="Webhook URL یا Token" class="input-url full-width">
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

    // --- TAB 2: SETTINGS ---
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

    // --- TAB 3: CAMPAIGNS ---
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
        <div id="rule-template" style="display:none;"><?php self::render_rule_row('INDEX', [], $webhooks, $wc_statuses, true); ?></div>
        <?php
    }

    private static function render_rule_row($index, $data, $webhooks, $wc_statuses, $is_template = false) {
        $active_n8n = !empty($data['active_n8n']); $active_sms = !empty($data['active_sms']); $active_tg = !empty($data['active_tg']); $trigger = $data['trigger'] ?? '';
        $rule_name = !empty($data['name']) ? $data['name'] : ($is_template ? 'سناریوی جدید' : 'سناریو #' . ($index+1));
        
        $vars_html = '<div class="var-list">';
        if($trigger === 'auth_request') { $vars_html .= '<span class="var-tag" data-insert="{otp}">{otp}</span><span class="var-tag" data-insert="{phone}">{phone}</span>'; } 
        else { $vars_html .= '<span class="var-tag" data-insert="{full_name}">{full_name}</span><span class="var-tag" data-insert="{order_id}">{order_id}</span><span class="var-tag" data-insert="{total}">{total}</span>'; }
        $vars_html .= '</div>';
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
                            <optgroup label="فروشگاه">
                                <option value="order_status" <?php selected($trigger,'order_status'); ?>>تغییر وضعیت سفارش</option>
                                <option value="order_created" <?php selected($trigger,'order_created'); ?>>ثبت سفارش جدید</option>
                            </optgroup>
                            <optgroup label="کاربران">
                                <option value="auth_request" <?php selected($trigger,'auth_request'); ?>>🔐 درخواست OTP</option>
                                <option value="user_register" <?php selected($trigger,'user_register'); ?>>ثبت‌نام موفق</option>
                            </optgroup>
                        </select>
                        <select name="rules[<?php echo $index; ?>][sub_trigger]" class="sub-trigger-select full-width"><option value="">-- انتخاب وضعیت --</option><?php foreach($wc_statuses as $k=>$v) echo "<option value='$k' ".selected($data['sub_trigger']??'', $k, false).">$v</option>"; ?></select>
                    </div>
                </div>

                <div class="rule-section actions-grid">
                    <div class="action-col <?php echo $active_n8n?'active':''; ?>"><label><input type="checkbox" name="rules[<?php echo $index; ?>][active_n8n]" value="1" <?php checked($active_n8n); ?> class="toggle-action"> n8n</label><div class="action-body"><select name="rules[<?php echo $index; ?>][webhook_id]" class="full-width"><option value="">انتخاب...</option><?php foreach($webhooks as $wh) if($wh['type']=='webhook') echo "<option value='{$wh['id']}' ".selected($data['webhook_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?></select><textarea name="rules[<?php echo $index; ?>][message_n8n]" rows="2" class="msg-input"><?php echo esc_textarea($data['message_n8n']??''); ?></textarea><?php echo $vars_html; ?></div></div>
                    <div class="action-col <?php echo $active_sms?'active':''; ?>"><label><input type="checkbox" name="rules[<?php echo $index; ?>][active_sms]" value="1" <?php checked($active_sms); ?> class="toggle-action"> پیامک</label><div class="action-body"><select name="rules[<?php echo $index; ?>][sms_provider_id]" class="full-width"><option value="">انتخاب پنل...</option><?php foreach($webhooks as $wh) if($wh['type']=='melipayamak') echo "<option value='{$wh['id']}' ".selected($data['sms_provider_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?></select><select name="rules[<?php echo $index; ?>][sms_target]" class="sms-target-select full-width"><option value="customer" <?php selected($data['sms_target']??'','customer'); ?>>مشتری</option><option value="custom" <?php selected($data['sms_target']??'','custom'); ?>>مدیر</option></select><input type="text" name="rules[<?php echo $index; ?>][sms_custom_num]" value="<?php echo esc_attr($data['sms_custom_num']??''); ?>" class="sms-custom-input full-width" style="margin-bottom:5px;"><textarea name="rules[<?php echo $index; ?>][message_sms]" rows="3" class="msg-input"><?php echo esc_textarea($data['message_sms']??''); ?></textarea><?php echo $vars_html; ?></div></div>
                    <div class="action-col <?php echo $active_tg?'active':''; ?>"><label><input type="checkbox" name="rules[<?php echo $index; ?>][active_tg]" value="1" <?php checked($active_tg); ?> class="toggle-action"> تلگرام</label><div class="action-body"><select name="rules[<?php echo $index; ?>][tg_bot_id]" class="full-width"><option value="">انتخاب ربات...</option><?php foreach($webhooks as $wh) if($wh['type']=='telegram') echo "<option value='{$wh['id']}' ".selected($data['tg_bot_id']??'', $wh['id'], false).">{$wh['name']}</option>"; ?></select><input type="text" name="rules[<?php echo $index; ?>][tg_chat_id]" value="<?php echo esc_attr($data['tg_chat_id']??''); ?>" class="full-width" placeholder="Chat ID"><textarea name="rules[<?php echo $index; ?>][message_tg]" rows="2" class="msg-input"><?php echo esc_textarea($data['message_tg']??''); ?></textarea><?php echo $vars_html; ?></div></div>
                </div>
            </div>
        </div>
        <?php
    }
    
    private static function render_logs_tab() { global $wpdb; $table = $wpdb->prefix . 'hub_logs'; $logs = $wpdb->get_results( "SELECT * FROM $table ORDER BY id DESC LIMIT 50" ); ?><div class="hub-card"><h3>📜 لاگ‌ها</h3><table class="wp-list-table widefat fixed striped"><thead><tr><th>زمان</th><th>نوع</th><th>منبع</th><th>پیام</th></tr></thead><tbody><?php if($logs): foreach($logs as $log): ?><tr><td dir="ltr"><?php echo $log->created_at; ?></td><td><?php echo $log->log_type; ?></td><td><?php echo $log->source; ?></td><td><?php echo esc_html($log->message); ?></td></tr><?php endforeach; endif; ?></tbody></table></div><?php }
}