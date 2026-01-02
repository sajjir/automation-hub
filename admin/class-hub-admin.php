<?php

class Hub_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function add_admin_menu() {
		add_menu_page(
			'هاب اتوماسیون',
			'هاب اتوماسیون',
			'manage_options',
			'automation-hub',
			array( __CLASS__, 'render_admin_page' ),
			'dashicons-superhero-alt',
			56
		);
	}

	public static function enqueue_assets( $hook ) {
		if ( 'toplevel_page_automation-hub' !== $hook ) {
			return;
		}
		// استایل‌ها
		wp_enqueue_style( 'hub-admin-style', HUB_PLUGIN_URL . 'admin/css/hub-admin.css', array(), HUB_VERSION );
		
		// جاوااسکریپت (برای Repeater و تغییرات داینامیک)
		wp_enqueue_script( 'hub-admin-js', HUB_PLUGIN_URL . 'admin/js/hub-admin.js', array( 'jquery' ), HUB_VERSION, true );
        
        // ارسال داده‌ها به JS (برای لیست وضعیت‌های ووکامرس)
        wp_localize_script( 'hub-admin-js', 'hubData', array(
            'statuses' => function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [],
        ));
	}

	public static function render_admin_page() {
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'connections';
		
        // ذخیره‌سازی داده‌ها
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
				<a href="?page=automation-hub&tab=connections" class="nav-tab <?php echo $active_tab === 'connections' ? 'nav-tab-active' : ''; ?>">🔌 اتصالات (Webhooks)</a>
				<a href="?page=automation-hub&tab=campaigns" class="nav-tab <?php echo $active_tab === 'campaigns' ? 'nav-tab-active' : ''; ?>">📢 کمپین‌ساز (Rules)</a>
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
                <div class="hub-footer-actions">
                    <button type="submit" name="hub_save_settings" class="button button-primary button-hero">ذخیره تغییرات</button>
                </div>
                <?php endif; ?>
			</form>
		</div>
		<?php
	}

    // --- ذخیره‌سازی ---
    private static function save_settings() {
        // 1. ذخیره وب‌هوک‌ها
        if(isset($_POST['webhooks'])) {
            $clean_hooks = [];
            foreach($_POST['webhooks'] as $wh) {
                if(!empty($wh['name']) && !empty($wh['url'])) {
                    $clean_hooks[] = [
                        'id' => sanitize_title($wh['name']),
                        'name' => sanitize_text_field($wh['name']),
                        'url' => esc_url_raw($wh['url']),
                        'method' => sanitize_text_field($wh['method'])
                    ];
                }
            }
            update_option('hub_webhooks', $clean_hooks);
        }

        // 2. ذخیره قوانین (Campaigns)
        if(isset($_POST['rules'])) {
            $clean_rules = [];
            foreach($_POST['rules'] as $rule) {
                // پاکسازی داده‌ها
                $rule['message'] = wp_kses_post($rule['message']);
                $clean_rules[] = $rule;
            }
            update_option('hub_rules', $clean_rules);
        }
        
        // 3. API Key
        if(isset($_POST['gen_key'])) Hub_Security::generate_api_key();
    }

    // --- TAB 1: CONNECTIONS (REPEATER) ---
	private static function render_connections_tab() {
		$webhooks = get_option('hub_webhooks', []);
        $api_key = Hub_Security::get_api_key();
		?>
        <div class="hub-grid">
            <div class="hub-col-2">
                <div class="hub-card">
                    <div class="hub-card-header">
                        <h3>لیست وب‌هوک‌های n8n</h3>
                        <button type="button" class="button" id="add-webhook">+ افزودن جدید</button>
                    </div>
                    <div class="hub-card-body" id="webhooks-container">
                        <?php if(empty($webhooks)): ?>
                            <?php self::render_webhook_row(0, [], true); ?>
                        <?php else: ?>
                            <?php foreach($webhooks as $index => $wh) self::render_webhook_row($index, $wh); ?>
                        <?php endif; ?>
                    </div>
                    <p class="description">می‌توانید بی‌نهایت وب‌هوک تعریف کنید (مثلاً: حسابداری، انبار، تلگرام) و در کمپین‌ها استفاده کنید.</p>
                </div>
            </div>
            
            <div class="hub-col-1">
                <div class="hub-card">
                    <div class="hub-card-header"><h3>🔒 امنیت API</h3></div>
                    <div class="hub-card-body">
                        <p>کلید ارتباط دوطرفه (n8n به وردپرس):</p>
                        <input type="text" value="<?php echo esc_attr( $api_key ); ?>" class="code-input full-width" readonly>
                        <br><br>
                        <button type="submit" name="gen_key" value="1" class="button">🔄 تولید مجدد</button>
                    </div>
                </div>
            </div>
        </div>
        
        <template id="webhook-template">
            <?php self::render_webhook_row('INDEX', [], true); ?>
        </template>
		<?php
	}

    private static function render_webhook_row($index, $data = [], $is_template = false) {
        $name = $data['name'] ?? '';
        $url = $data['url'] ?? '';
        $method = $data['method'] ?? 'POST';
        ?>
        <div class="repeater-row webhook-row">
            <div class="row-actions"><span class="dashicons dashicons-trash remove-row" title="حذف"></span></div>
            <div class="row-fields">
                <input type="text" name="webhooks[<?php echo $index; ?>][name]" value="<?php echo esc_attr($name); ?>" placeholder="نام (مثلاً: انبار)" class="input-name">
                <select name="webhooks[<?php echo $index; ?>][method]" class="input-method">
                    <option value="POST" <?php selected($method, 'POST'); ?>>POST</option>
                    <option value="GET" <?php selected($method, 'GET'); ?>>GET</option>
                </select>
                <input type="url" name="webhooks[<?php echo $index; ?>][url]" value="<?php echo esc_attr($url); ?>" placeholder="https://n8n.../webhook/..." class="input-url">
            </div>
        </div>
        <?php
    }

    // --- TAB 2: CAMPAIGNS (RULE BUILDER) ---
    private static function render_campaigns_tab() {
        $rules = get_option('hub_rules', []);
        $webhooks = get_option('hub_webhooks', []);
        $wc_statuses = function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [];
        ?>
        <div class="hub-card">
            <div class="hub-card-header">
                <h3>قوانین و سناریوها</h3>
                <button type="button" class="button button-primary" id="add-rule">+ سناریوی جدید</button>
            </div>
            <div class="hub-card-body" id="rules-container">
                <?php if(empty($rules)): ?>
                    <p class="no-data-msg">هنوز هیچ سناریویی تعریف نکرده‌اید.</p>
                <?php else: ?>
                    <?php foreach($rules as $index => $rule) self::render_rule_row($index, $rule, $webhooks, $wc_statuses); ?>
                <?php endif; ?>
            </div>
        </div>

        <template id="rule-template">
            <?php self::render_rule_row('INDEX', [], $webhooks, $wc_statuses, true); ?>
        </template>
        <?php
    }

    private static function render_rule_row($index, $data, $webhooks, $wc_statuses, $is_template = false) {
        $trigger = $data['trigger'] ?? 'order_status';
        $sub_trigger = $data['sub_trigger'] ?? ''; // مثلاً wc-processing
        $webhook_id = $data['webhook_id'] ?? '';
        $message = $data['message'] ?? '';
        
        // شرط پیچیده
        $condition_active = isset($data['condition_active']) ? 'checked' : '';
        $condition_key = $data['condition_key'] ?? ''; // مثلاً pa_guarantee
        $condition_val = $data['condition_val'] ?? ''; // مثلاً طلایی
        ?>
        <div class="repeater-row rule-row">
            <div class="rule-header">
                <span class="rule-title">سناریوی #<?php echo $is_template ? 'جدید' : $index + 1; ?></span>
                <span class="dashicons dashicons-trash remove-row"></span>
            </div>
            
            <div class="rule-body">
                <div class="rule-section">
                    <label>۱. چه زمانی اجرا شود؟ (Trigger)</label>
                    <div class="flex-row">
                        <select name="rules[<?php echo $index; ?>][trigger]" class="trigger-select">
                            <option value="order_status" <?php selected($trigger, 'order_status'); ?>>تغییر وضعیت سفارش</option>
                            <option value="order_created" <?php selected($trigger, 'order_created'); ?>>ثبت سفارش جدید</option>
                            <option value="user_register" <?php selected($trigger, 'user_register'); ?>>ثبت‌نام کاربر جدید</option>
                        </select>
                        
                        <select name="rules[<?php echo $index; ?>][sub_trigger]" class="sub-trigger-select" style="<?php echo $trigger !== 'order_status' ? 'display:none' : ''; ?>">
                            <option value="">-- انتخاب وضعیت --</option>
                            <?php foreach($wc_statuses as $k => $v): ?>
                                <option value="<?php echo $k; ?>" <?php selected($sub_trigger, $k); ?>><?php echo $v; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="rule-section logic-section">
                    <label>
                        <input type="checkbox" name="rules[<?php echo $index; ?>][condition_active]" class="condition-toggle" value="1" <?php echo $condition_active; ?>>
                        ۲. شرط خاصی بررسی شود؟ (Advanced Logic)
                    </label>
                    <div class="condition-box" style="<?php echo empty($condition_active) ? 'display:none' : ''; ?>">
                        <p class="description">اگر <strong>حداقل یکی</strong> از اقلام سفارش ویژگی زیر را داشت:</p>
                        <div class="flex-row">
                            <input type="text" name="rules[<?php echo $index; ?>][condition_key]" value="<?php echo esc_attr($condition_key); ?>" placeholder="نام ویژگی (مثلاً: pa_guarantee)">
                            <span>شامل باشد:</span>
                            <input type="text" name="rules[<?php echo $index; ?>][condition_val]" value="<?php echo esc_attr($condition_val); ?>" placeholder="مقدار (مثلاً: طلایی)">
                        </div>
                    </div>
                </div>

                <div class="rule-section">
                    <label>۳. چه کاری انجام شود؟ (Action)</label>
                    <div class="flex-row">
                        <span>ارسال به:</span>
                        <select name="rules[<?php echo $index; ?>][webhook_id]">
                            <option value="">-- انتخاب وب‌هوک --</option>
                            <?php foreach($webhooks as $wh): ?>
                                <option value="<?php echo $wh['id']; ?>" <?php selected($webhook_id, $wh['id']); ?>><?php echo esc_html($wh['name']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="msg-box">
                        <textarea name="rules[<?php echo $index; ?>][message]" rows="3" placeholder="متن پیام خود را اینجا بنویسید..."><?php echo esc_textarea($message); ?></textarea>
                        
                        <div class="shortcode-guides">
                            <div class="guide guide-order" style="display:none">
                                <small>متغیرها: <code>{order_id}</code> <code>{total}</code> <code>{full_name}</code> <code>{items_summary}</code> <code>{_scrape_raw_result_}</code></small>
                            </div>
                            <div class="guide guide-user" style="display:none">
                                <small>متغیرها: <code>{user_id}</code> <code>{user_email}</code> <code>{user_name}</code></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    // --- TAB 3: LOGS ---
	private static function render_logs_tab() {
		global $wpdb;
		$table = $wpdb->prefix . 'hub_logs';
		$logs = $wpdb->get_results( "SELECT * FROM $table ORDER BY id DESC LIMIT 50" );
		?>
		<div class="hub-card">
            <h3>📜 ۵۰ فعالیت آخر</h3>
            <table class="wp-list-table widefat fixed striped">
                <thead><tr><th>زمان</th><th>نوع</th><th>منبع</th><th>پیام</th></tr></thead>
                <tbody>
                    <?php if ( $logs ) : foreach ( $logs as $log ) : ?>
                        <tr>
                            <td dir="ltr"><?php echo $log->created_at; ?></td>
                            <td><?php echo $log->log_type; ?></td>
                            <td><?php echo $log->source; ?></td>
                            <td><?php echo esc_html($log->message); ?></td>
                        </tr>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
		<?php
	}
}