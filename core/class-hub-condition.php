<?php

/**
 * Logic Engine for Automation Hub
 */
class Hub_Condition {

    /**
     * ارزیابی شرط‌ها روی یک آبجکت سفارش
     */
    public static function evaluate( $entity, $trigger_type, $rule ) {
        // شرط‌ها فقط برای سفارشات ووکامرس پشتیبانی می‌شوند
        if ( ! in_array( $trigger_type, ['order_status', 'order_created'] ) ) {
            return true;
        }
        
        if ( ! is_a( $entity, 'WC_Order' ) ) {
            return true;
        }

        $conditions = isset( $rule['conditions'] ) ? $rule['conditions'] : [];
        if ( empty( $conditions ) ) {
            return true;
        }

        $match_type = isset( $rule['match_type'] ) ? $rule['match_type'] : 'all';
        $results = [];

        foreach ( $conditions as $cond ) {
            $field    = sanitize_text_field($cond['field'] ?? '');
            $operator = sanitize_text_field($cond['operator'] ?? '');
            $value    = sanitize_text_field($cond['value'] ?? '');
            
            $results[] = self::evaluate_single( $entity, $field, $operator, $value );
        }

        if ( empty( $results ) ) return true;

        if ( $match_type === 'all' ) {
            return ! in_array( false, $results, true );
        } else { // any (OR)
            return in_array( true, $results, true );
        }
    }

    private static function evaluate_single( $order, $field, $operator, $value ) {
        $actual_value = null;

        switch ( $field ) {
            case 'total':
                $actual_value = $order->get_total();
                break;
            case 'billing_city':
                $actual_value = $order->get_billing_city();
                break;
            case 'status':
                $actual_value = $order->get_status();
                // استانداردسازی وضعیت
                $actual_value = str_replace('wc-', '', $actual_value);
                $value = str_replace('wc-', '', $value);
                break;
            case 'user_role':
                $user_id = $order->get_customer_id();
                if ( $user_id ) {
                    $user_meta = get_userdata( $user_id );
                    $actual_value = $user_meta ? implode( ',', $user_meta->roles ) : '';
                } else {
                    $actual_value = 'guest';
                }
                break;
            default:
                return true;
        }

        return self::compare( $actual_value, $operator, $value );
    }

    private static function compare( $actual, $operator, $expected ) {
        if ( is_numeric( $actual ) && is_numeric( $expected ) ) {
            $actual = (float) $actual;
            $expected = (float) $expected;
        } else {
            $actual = strtolower( trim( (string) $actual ) );
            $expected = strtolower( trim( (string) $expected ) );
        }

        switch ( $operator ) {
            case '==':
                return $actual == $expected;
            case '!=':
                return $actual != $expected;
            case '>':
                return $actual > $expected;
            case '<':
                return $actual < $expected;
            case 'contains':
                return strpos( (string) $actual, (string) $expected ) !== false;
            case 'not_contains':
                return strpos( (string) $actual, (string) $expected ) === false;
            default:
                return false;
        }
    }
}