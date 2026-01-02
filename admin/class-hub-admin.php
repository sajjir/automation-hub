<?php

/**
 * The admin-specific functionality of the plugin.
 */
class Hub_Admin {

	/**
	 * Initialize Admin.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_styles' ) );
	}

	/**
	 * Add menu item.
	 */
	public static function add_admin_menu() {
		add_menu_page(
			'هاب اتوماسیون',
			'هاب اتوماسیون',
			'manage_options',
			'automation-hub',
			array( __CLASS__, 'render_admin_page' ),
			'dashicons-rest-api',
			56
		);
	}

	/**
	 * Load CSS/JS.
	 */
	public static function enqueue_styles( $hook ) {
		if ( 'toplevel_page_automation-hub' !== $hook ) {
			return;
		}
		// استایل‌های ساده برای تب‌ها
		wp_register_style( 'hub_admin_css', false );
		wp_enqueue_style( 'hub_admin_css' );
		wp_add_inline_style( 'hub_admin_css', '
			.hub-wrap { background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); margin-top: 20px; max-width: 1200px; }
			.hub-tabs { border-bottom: 1px solid #ddd; margin-bottom: 20px; }
			.hub-tab { display: inline-block; padding: 10px 20px; text-decoration: none; color: #555; border: 1px solid transparent; margin-bottom: -1px; }
			.hub-tab.active { border: 1px solid #ddd; border-bottom-color: #fff; font-weight: bold; color: #000; }
			.hub-card { background: #f9f9f9; padding: 15px; border: 1px solid #eee; margin-bottom: 15px; border-radius: 5px; }
			.hub-status-ok { color: green; font-weight: bold; }
			.hub-status-fail { color: red; font-weight: bold; }
		' );
	}

	/**
	 * Render the main admin page with tabs.
	 */
	public static function render_admin_page() {
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'dashboard';
		?>
		<div class="wrap">
			<h1>🚀 هاب اتوماسیون هوشمند</h1>
			
			<div class="hub-wrap">
				<div class="hub-tabs">
					<a href="?page=automation-hub&tab=dashboard" class="hub-tab <?php echo $active_tab === 'dashboard' ? 'active' : ''; ?>">داشبورد و اتصالات</a>
					<a href="?page=automation-hub&tab=logs" class="hub-tab <?php echo $active_tab === 'logs' ? 'active' : ''; ?>">لاگ‌ها و گزارشات</a>
					</div>

				<div class="hub-content">
					<?php
					if ( $active_tab === 'dashboard' ) {
						self::render_dashboard_tab();
					} elseif ( $active_tab === 'logs' ) {
						self::render_logs_tab();
					}
					?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render Dashboard Tab (Connections).
	 */
	private static function render_dashboard_tab() {
		// ذخیره‌سازی تنظیمات اگر فرم ارسال شده باشد
		if ( isset( $_POST['hub_save_settings'] ) && check_admin_referer( 'hub_settings_nonce' ) ) {
			if ( isset( $_POST['n8n_url'] ) ) {
				update_option( 'hub_n8n_webhook_url', esc_url_raw( $_POST['n8n_url'] ) );
				echo '<div class="notice notice-success"><p>تنظیمات ذخیره شد.</p></div>';
			}
			if ( isset( $_POST['gen_key'] ) ) {
				Hub_Security::generate_api_key();
				echo '<div class="notice notice-warning"><p>کلید امنیتی جدید تولید شد.</p></div>';
			}
		}

		$n8n_url = get_option( 'hub_n8n_webhook_url', '' );
		$api_key = Hub_Security::get_api_key();
		
		// بررسی وضعیت پیامک
		require_once HUB_PLUGIN_DIR . 'integrations/class-persian-wc.php';
		$sms_active = Hub_Persian_WC::is_active();
		$sms_config = Hub_Persian_WC::get_sms_config();
		?>
		
		<div style="display: flex; gap: 20px;">
			<div style="flex: 2;">
				<form method="post">
					<?php wp_nonce_field( 'hub_settings_nonce' ); ?>
					
					<div class="hub-card">
						<h3>🔗 اتصال به n8n (قلب سیستم)</h3>
						<p>آدرس وب‌هوک اصلی (Webhook) که در سناریوی n8n خود ساخته‌اید را اینجا وارد کنید.</p>
						<input type="url" name="n8n_url" value="<?php echo esc_attr( $n8n_url ); ?>" class="regular-text" style="width: 100%;" placeholder="https://n8n.example.com/webhook/..." required>
						<br><br>
						<button type="submit" name="hub_save_settings" class="button button-primary">ذخیره تنظیمات</button>
					</div>

					<div class="hub-card">
						<h3>🔒 امنیت API (برای دستورات دوطرفه)</h3>
						<p>اگر می‌خواهید n8n به سایت شما فرمان دهد (مثلاً آپدیت محصول)، از این کلید در هدر <code>X-Hub-Api-Key</code> استفاده کنید.</p>
						<input type="text" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" style="width: 100%; background: #eee;" readonly>
						<br><br>
						<button type="submit" name="gen_key" value="1" class="button" onclick="return confirm('آیا مطمئن هستید؟ کلید قبلی منقضی خواهد شد.');">تولید کلید جدید</button>
					</div>
				</form>
			</div>

			<div style="flex: 1;">
				<div class="hub-card">
					<h3>📡 وضعیت سیستم</h3>
					<ul>
						<li>
							<strong>وضعیت n8n:</strong> 
							<?php echo ! empty( $n8n_url ) ? '<span class="hub-status-ok">✅ متصل</span>' : '<span class="hub-status-fail">❌ تنظیم نشده</span>'; ?>
						</li>
						<li style="margin-top: 10px;">
							<strong>وضعیت پیامک:</strong>
							<?php if ( $sms_active ) : ?>
								<span class="hub-status-ok">✅ شناسایی شد (ووکامرس فارسی)</span>
								<?php if ( $sms_config ) : ?>
									<br><small style="color: #666;">پنل: <?php echo esc_html( $sms_config['provider'] ); ?> | نام‌کاربری: <?php echo esc_html( $sms_config['username'] ); ?></small>
								<?php endif; ?>
							<?php else : ?>
								<span class="hub-status-fail">⚠️ یافت نشد</span>
								<p><small>لطفاً افزونه "ووکامرس فارسی" را نصب و تنظیم کنید.</small></p>
							<?php endif; ?>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render Logs Tab.
	 */
	private static function render_logs_tab() {
		global $wpdb;
		$table = $wpdb->prefix . 'hub_logs';
		// گرفتن ۵۰ لاگ آخر
		$logs = $wpdb->get_results( "SELECT * FROM $table ORDER BY id DESC LIMIT 50" );
		?>
		<h3>📜 گزارش فعالیت‌های اخیر</h3>
		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th width="15%">زمان</th>
					<th width="10%">نوع</th>
					<th width="10%">منبع</th>
					<th>پیام</th>
				</tr>
			</thead>
			<tbody>
				<?php if ( $logs ) : foreach ( $logs as $log ) : ?>
					<tr>
						<td><?php echo $log->created_at; ?></td>
						<td>
							<?php 
							$color = 'black';
							if($log->log_type=='error') $color='red';
							if($log->log_type=='success') $color='green';
							echo "<span style='color:$color'>" . esc_html( $log->log_type ) . "</span>"; 
							?>
						</td>
						<td><?php echo esc_html( $log->source ); ?></td>
						<td>
							<?php echo esc_html( $log->message ); ?>
							<?php if ( $log->context ) : ?>
								<details>
									<summary>جزئیات فنی</summary>
									<pre style="font-size: 10px;"><?php echo esc_html( $log->context ); ?></pre>
								</details>
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; else : ?>
					<tr><td colspan="4">هنوز هیچ لاگی ثبت نشده است.</td></tr>
				<?php endif; ?>
			</tbody>
		</table>
		<?php
	}
}