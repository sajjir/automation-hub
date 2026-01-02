<?php

/**
 * Listens to WordPress/WooCommerce events and pushes them to the queue.
 */
class Hub_Bridge {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		// گوش دادن به تغییر وضعیت سفارش
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'handle_order_status_change' ), 10, 4 );
		
		// گوش دادن به ثبت نام کاربر جدید
		add_action( 'user_register', array( __CLASS__, 'handle_new_user' ), 10, 1 );
	}

	/**
	 * Handle order status change.
	 */
	public static function handle_order_status_change( $order_id, $from, $to, $order ) {
		// ساخت پلود استاندارد
		$payload = array(
			'source'      => 'woocommerce',
			'entity'      => 'order',
			'id'          => $order_id,
			'event'       => 'status_changed',
			'from_status' => $from,
			'to_status'   => $to,
			'total'       => $order->get_total(),
			'currency'    => $order->get_currency(),
			'customer_id' => $order->get_customer_id(),
			'date'        => current_time('mysql'),
		);

		// افزودن به صف با اولویت بالا (چون سفارش مهم است)
		Hub_Queue::push( 'order.status_changed', $payload, 1 );
	}

	/**
	 * Handle new user registration.
	 */
	public static function handle_new_user( $user_id ) {
		$user = get_userdata( $user_id );
		
		$payload = array(
			'source' => 'wordpress',
			'entity' => 'user',
			'id'     => $user_id,
			'event'  => 'registered',
			'email'  => $user->user_email,
			'roles'  => $user->roles,
			'date'   => current_time('mysql'),
		);

		Hub_Queue::push( 'user.registered', $payload, 5 );
	}
}