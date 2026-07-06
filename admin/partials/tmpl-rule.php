<?php
/**
 * Plugin Name: Automation Hub (n8n Bridge)
 * Description: پل ارتباطی هوشمند و امن بین ووکامرس و n8n با سیستم صف و لاگ اختصاصی.
 * Version: 1.1.1
 * Author: sajj.ir | هوش مرکزی
 * Text Domain: automation-hub
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// تعریف ثابت‌های مسیر و نسخه
define( 'HUB_VERSION', '1.1.1' );
define( 'HUB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HUB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HUB_DB_VERSION', '1.1.1' );

function hub_activate_plugin() {
    require_once HUB_PLUGIN_DIR . 'core/class-hub-activator.php';
    Hub_Activator::activate();
}
register_activation_hook( __FILE__, 'hub_activate_plugin' );

function hub_deactivate_plugin() {
    if ( function_exists( 'as_unschedule_action' ) ) {
        as_unschedule_action( 'hub_process_queue_item' );
    }
}
register_deactivation_hook( __FILE__, 'hub_deactivate_plugin' );

function hub_load_classes() {
    // هسته (Core)
    require_once HUB_PLUGIN_DIR . 'modules/logger/class-hub-logger.php';
    require_once HUB_PLUGIN_DIR . 'core/class-hub-security.php';
    require_once HUB_PLUGIN_DIR . 'core/class-hub-activator.php'; // ضروری برای maybe_upgrade
    require_once HUB_PLUGIN_DIR . 'core/class-hub-condition.php';
    require_once HUB_PLUGIN_DIR . 'core/class-hub-queue.php';
    require_once HUB_PLUGIN_DIR . 'core/class-hub-bridge.php';
    require_once HUB_PLUGIN_DIR . 'core/class-hub-auth.php';
    require_once HUB_PLUGIN_DIR . 'core/class-hub-sender.php';
    
    // رابط کاربری و ویجت‌ها
    require_once HUB_PLUGIN_DIR . 'integrations/class-persian-wc.php';
    require_once HUB_PLUGIN_DIR . 'admin/class-hub-admin.php';
    
    if ( file_exists( HUB_PLUGIN_DIR . 'modules/dashboard-widget/class-hub-widget.php' ) ) {
        require_once HUB_PLUGIN_DIR . 'modules/dashboard-widget/class-hub-widget.php';
    }
}
add_action( 'plugins_loaded', 'hub_load_classes' );

function hub_init_plugin() {
    load_plugin_textdomain( 'automation-hub', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

    // ارتقاء خودکار جداول پایگاه داده در صورت تغییر نسخه
    if ( class_exists( 'Hub_Activator' ) ) {
        Hub_Activator::maybe_upgrade();
    }

    if ( class_exists( 'Hub_Bridge' ) ) Hub_Bridge::init(); 
    if ( class_exists( 'Hub_Admin' ) ) Hub_Admin::init();   
    if ( class_exists( 'Hub_Auth' ) ) Hub_Auth::init();     
    
    if ( class_exists( 'Hub_Widget' ) ) {
        new Hub_Widget();
    }

    if ( class_exists( 'Hub_Sender' ) && class_exists( 'ActionScheduler' ) ) {
        Hub_Sender::init();
    }
}
add_action( 'init', 'hub_init_plugin', 20 );