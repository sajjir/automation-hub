<?php

class Hub_Activator {

	public static function activate() {
		self::create_tables();
		add_option( 'hub_db_version', HUB_DB_VERSION );
	}

    // متد جدید جهت بررسی و ارتقاء خودکار جداول
	public static function maybe_upgrade() {
		if ( get_option( 'hub_db_version' ) !== HUB_DB_VERSION ) {
			self::create_tables();
			update_option( 'hub_db_version', HUB_DB_VERSION );
		}
	}

	private static function create_tables() {
		global $wpdb;
		$charset_collate = $wpdb->get_charset_collate();

		$table_queue = $wpdb->prefix . 'hub_queue';
		
		// پاکسازی کامنت‌های SQL جهت سازگاری ۱۰۰٪ با dbDelta
		$sql_queue = "CREATE TABLE $table_queue (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			event_type varchar(100) NOT NULL,
			entity_id bigint(20) DEFAULT 0,
			rule_id int(11) DEFAULT 0,
			action_index int(5) DEFAULT 0,
			payload longtext NOT NULL,
			status varchar(20) DEFAULT 'pending',
			attempts int(3) DEFAULT 0,
			priority int(3) DEFAULT 10,
			created_at datetime DEFAULT '0000-00-00 00:00:00',
			updated_at datetime DEFAULT '0000-00-00 00:00:00',
			PRIMARY KEY  (id),
			KEY status (status),
			KEY entity_rule (entity_id, rule_id)
		) $charset_collate;";

		$table_logs = $wpdb->prefix . 'hub_logs';
		$sql_logs = "CREATE TABLE $table_logs (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			log_type varchar(20) DEFAULT 'info',
			source varchar(50) NOT NULL,
			message text NOT NULL,
			context longtext NULL,
			created_at datetime DEFAULT '0000-00-00 00:00:00',
			PRIMARY KEY  (id),
			KEY log_type (log_type)
		) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql_queue );
		dbDelta( $sql_logs );
	}
}