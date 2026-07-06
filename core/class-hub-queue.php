<?php

class Hub_Queue {

	public static function push( $event_type, $payload, $priority = 10, $delay = 0, $entity_id = 0, $rule_id = 0, $action_index = 0 ) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'hub_queue';
		$json_payload = wp_json_encode( $payload, JSON_UNESCAPED_UNICODE );

		$result = $wpdb->insert(
			$table_name,
			array(
				'event_type'   => $event_type,
                'entity_id'    => $entity_id,
                'rule_id'      => $rule_id,
                'action_index' => $action_index,
				'payload'      => $json_payload,
				'status'       => 'pending',
				'priority'     => $priority,
				'created_at'   => current_time( 'mysql' ),
				'updated_at'   => current_time( 'mysql' ),
			),
			array( '%s', '%d', '%d', '%d', '%s', '%s', '%d', '%s', '%s' )
		);

		if ( $result ) {
			$insert_id = $wpdb->insert_id;
            $run_at = time() + $delay;

			if ( function_exists( 'as_schedule_single_action' ) ) {
				as_schedule_single_action( $run_at, 'hub_process_queue_item', array( 'id' => $insert_id ), 'hub_queue' );
			}

            $log_msg = $delay > 0 ? "Delayed Event queued (Delay: {$delay}s)" : "Event queued";
			Hub_Logger::log( "$log_msg: $event_type (ID: $insert_id)", 'info', 'queue', [
                'rule' => $rule_id, 'entity' => $entity_id, 'action' => $action_index
            ] );
            
			return $insert_id;
		} else {
			Hub_Logger::log( "Failed to queue event: $event_type", 'error', 'queue', $wpdb->last_error );
			return false;
		}
	}

    /**
     * کنسل کردن تمام اکشن‌های در انتظارِ یک سفارش و یک سناریوی خاص
     */
    public static function cancel_pending_for_order( $entity_id, $rule_id ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hub_queue';
        
        $wpdb->query( $wpdb->prepare(
            "UPDATE $table_name SET status = 'cancelled', updated_at = %s 
             WHERE entity_id = %d AND rule_id = %d AND status = 'pending'",
            current_time( 'mysql' ), $entity_id, $rule_id
        ) );
    }

	public static function update_status( $id, $status ) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'hub_queue';

		$data = array(
			'status'     => $status,
			'updated_at' => current_time( 'mysql' ),
		);

		if ( $status === 'failed' ) {
			$wpdb->query( $wpdb->prepare( "UPDATE $table_name SET attempts = attempts + 1 WHERE id = %d", $id ) );
		}

		$wpdb->update(
			$table_name,
			$data,
			array( 'id' => $id ),
			array( '%s', '%s' ),
			array( '%d' )
		);
	}
}