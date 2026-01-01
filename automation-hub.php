<?php
/**
 * Plugin Name: Automation Hub (n8n Bridge)
 * Description: پل ارتباطی هوشمند و امن بین ووکامرس و n8n با سیستم صف و لاگ اختصاصی.
 * Version: 1.0.0
 * Author: sajj.ir | هوش مرکزی
 * Text Domain: automation-hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// تعریف ثابت‌های مسیر
define( 'HUB_VERSION', '1.0.0' );
define( 'HUB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HUB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HUB_DB_VERSION', '1.0' ); // نسخه دیتابیس برای آپدیت‌های آینده

/**
 * 1. فعال‌سازی افزونه (ساخت جداول)
 */
function activate_automation_hub() {
	require_once HUB_PLUGIN_DIR . 'core/class-hub-activator.php';
	Hub_Activator::activate();
}
register_activation_hook( __FILE__, 'activate_automation_hub' );

/**
 * 2. غیرفعال‌سازی (پاکسازی کرون جاب‌ها و ...)
 */
function deactivate_automation_hub() {
	// فعلاً خالی - بعداً برای حذف Scheduled Tasks استفاده می‌شود
}
register_deactivation_hook( __FILE__, 'deactivate_automation_hub' );

/**
 * 3. لود کردن کلاس‌های اصلی (در مراحل بعد تکمیل می‌شود)
 */
function run_automation_hub() {
    // اینجا در آینده کلاس‌های Queue و Security را فراخوانی می‌کنیم
}
add_action( 'plugins_loaded', 'run_automation_hub' );