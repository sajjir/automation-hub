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
define( 'HUB_DB_VERSION', '1.0' );

/**
 * 1. فعال‌سازی افزونه (ساخت جداول)
 */
function activate_automation_hub() {
	require_once HUB_PLUGIN_DIR . 'core/class-hub-activator.php';
	Hub_Activator::activate();
}
register_activation_hook( __FILE__, 'activate_automation_hub' );

/**
 * 2. غیرفعال‌سازی
 */
function deactivate_automation_hub() {
	// پاکسازی صف اکشن اسکجولر
	if ( function_exists( 'as_unschedule_action' ) ) {
		as_unschedule_action( 'hub_process_queue_event' );
	}
}
register_deactivation_hook( __FILE__, 'deactivate_automation_hub' );

/**
 * 3. بارگذاری هسته اصلی و ماژول‌ها
 */
function run_automation_hub() {
	// الف) لود کردن ماژول‌های هسته
	require_once HUB_PLUGIN_DIR . 'modules/logger/class-hub-logger.php';
	require_once HUB_PLUGIN_DIR . 'core/class-hub-security.php';
	require_once HUB_PLUGIN_DIR . 'core/class-hub-queue.php';
	require_once HUB_PLUGIN_DIR . 'core/class-hub-bridge.php';
	require_once HUB_PLUGIN_DIR . 'core/class-hub-sender.php';
    
    // ب) لود کردن رابط کاربری و اینتگریشن‌ها
    require_once HUB_PLUGIN_DIR . 'integrations/class-persian-wc.php'; // کلاس پیامک
    require_once HUB_PLUGIN_DIR . 'admin/class-hub-admin.php'; // کلاس ادمین

	// ج) راه‌اندازی اولیه
	Hub_Bridge::init();      // گوش دادن به رویدادهای ووکامرس
	Hub_Admin::init();       // ساخت منو و داشبورد مدیریت
	
    // د) راه‌اندازی صف (اصلاح شده: انتقال به هوک init برای رفع خطا)
	if ( class_exists( 'ActionScheduler' ) ) {
        // این خط تغییر کرد: به جای اجرای مستقیم، آن را به init هوک می‌کنیم
		add_action( 'init', array( 'Hub_Sender', 'init' ) );
	}
}
add_action( 'plugins_loaded', 'run_automation_hub' );