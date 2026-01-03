<?php

class Hub_Auth {

	public static function init() {
		// ثبت شورت‌کد
		add_shortcode( 'hub_login_form', array( __CLASS__, 'render_login_form' ) );

		// هندل کردن درخواست‌های AJAX
		add_action( 'wp_ajax_hub_send_otp', array( __CLASS__, 'handle_send_otp' ) );
		add_action( 'wp_ajax_nopriv_hub_send_otp', array( __CLASS__, 'handle_send_otp' ) );

		add_action( 'wp_ajax_hub_verify_otp', array( __CLASS__, 'handle_verify_otp' ) );
		add_action( 'wp_ajax_nopriv_hub_verify_otp', array( __CLASS__, 'handle_verify_otp' ) );
        
        // لود کردن اسکریپت‌ها
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

    public static function enqueue_assets() {
        // فقط اگر شورت‌کد در صفحه باشد یا همیشه (فعلاً همیشه برای اطمینان)
        wp_register_script( 'hub-auth-js', HUB_PLUGIN_URL . 'js/hub-auth.js', array('jquery'), HUB_VERSION, true );
        wp_register_style( 'hub-auth-css', HUB_PLUGIN_URL . 'css/hub-auth.css', array(), HUB_VERSION );
        
        // متغیرهای JS
        wp_localize_script( 'hub-auth-js', 'hubAuth', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'hub_auth_nonce' )
        ));
    }

	// --- 1. نمایش فرم ---
	public static function render_login_form( $atts ) {
        if ( is_user_logged_in() ) {
            $current_user = wp_get_current_user();
            return "<div class='hub-logged-in'>سلام {$current_user->display_name}! شما وارد شده‌اید.</div>";
        }

        wp_enqueue_script( 'hub-auth-js' );
        wp_enqueue_style( 'hub-auth-css' );

		ob_start();
		?>
		<div class="hub-auth-wrapper">
            <div id="hub-step-phone" class="hub-step active">
				<h3>ورود / ثبت‌نام</h3>
				<p>برای ورود، شماره موبایل خود را وارد کنید.</p>
				<input type="tel" id="hub-phone" placeholder="مثلاً 0912..." dir="ltr" pattern="[0-9]*" inputmode="numeric">
				<button type="button" id="hub-btn-send" class="hub-btn">ارسال کد تایید</button>
			</div>

            <div id="hub-step-verify" class="hub-step" style="display:none;">
				<h3>تایید شماره</h3>
				<p>کد ارسال شده به <span id="hub-phone-display"></span> را وارد کنید.</p>
				<div class="hub-otp-input">
                    <input type="text" id="hub-otp" placeholder="----" maxlength="5" autocomplete="one-time-code" inputmode="numeric">
                </div>
				<button type="button" id="hub-btn-verify" class="hub-btn">ورود به سایت</button>
                <a href="#" id="hub-btn-edit" class="hub-link">اصلاح شماره</a>
			</div>
            
            <div id="hub-message" class="hub-message"></div>
		</div>
		<?php
		return ob_get_clean();
	}

	// --- 2. ارسال کد OTP ---
	public static function handle_send_otp() {
        // بررسی امنیتی دقیق
		if ( ! check_ajax_referer( 'hub_auth_nonce', 'nonce', false ) ) {
            wp_send_json_error( 'خطای امنیتی. لطفاً صفحه را رفرش کنید.' );
        }
		
        $phone = isset($_POST['phone']) ? sanitize_text_field( wp_unslash($_POST['phone']) ) : '';
        $phone = self::normalize_number( $phone );

        if ( ! preg_match( '/^09[0-9]{9}$/', $phone ) ) {
            wp_send_json_error( 'شماره موبایل معتبر نیست (مثلاً 09123456789).' );
        }

        // Rate Limit
        $rate_limit = get_option('hub_auth_settings')['rate_limit'] ?? 120;
        $last_sent = get_transient( 'hub_otp_time_' . $phone );
        if ( $last_sent ) {
            $wait = $rate_limit - (time() - $last_sent);
            if($wait > 0) wp_send_json_error( "لطفاً $wait ثانیه صبر کنید." );
        }

        // تولید کد
        $otp = rand( 1000, 9999 );
        
        // ذخیره
        set_transient( 'hub_otp_code_' . $phone, $otp, 5 * 60 ); // ۵ دقیقه
        set_transient( 'hub_otp_time_' . $phone, time(), $rate_limit );

        // تریگر کردن هوک برای ارسال پیامک
        do_action( 'hub_auth_request', $phone, $otp );

		wp_send_json_success( 'کد تایید ارسال شد.' );
	}

	// --- 3. بررسی و ورود ---
	public static function handle_verify_otp() {
		if ( ! check_ajax_referer( 'hub_auth_nonce', 'nonce', false ) ) {
            wp_send_json_error( 'خطای امنیتی.' );
        }
		
        $phone = isset($_POST['phone']) ? sanitize_text_field( wp_unslash($_POST['phone']) ) : '';
        $otp_user = isset($_POST['otp']) ? sanitize_text_field( wp_unslash($_POST['otp']) ) : '';
        $phone = self::normalize_number( $phone );

        $cached_otp = get_transient( 'hub_otp_code_' . $phone );

        if ( empty($cached_otp) || $cached_otp != $otp_user ) {
            wp_send_json_error( 'کد تایید اشتباه یا منقضی شده است.' );
        }

        // لاگین یا ثبت‌نام
        $user = self::get_or_create_user( $phone );
        
        if ( ! is_wp_error( $user ) ) {
            wp_clear_auth_cookie();
            wp_set_current_user( $user->ID );
            wp_set_auth_cookie( $user->ID, true );
            
            self::sync_guest_orders( $user->ID, $phone );
            delete_transient( 'hub_otp_code_' . $phone );

            $settings = get_option('hub_auth_settings');
            $redirect = !empty($settings['redirect_url']) ? $settings['redirect_url'] : home_url();

            wp_send_json_success( array( 'redirect' => $redirect, 'msg' => 'خوش آمدید!' ) );
        } else {
            wp_send_json_error( $user->get_error_message() );
        }
	}

    // --- توابع کمکی ---
    private static function get_or_create_user( $phone ) {
        // جستجو با متای ووکامرس
        $users = get_users( array(
            'meta_key' => 'billing_phone',
            'meta_value' => $phone,
            'number' => 1,
            'count_total' => false
        ) );

        if ( ! empty( $users ) ) {
            return $users[0];
        }

        // ساخت کاربر جدید
        $username = $phone;
        // بررسی تکراری نبودن یوزرنیم (اگر کسی قبلا با این یوزرنیم ثبت نام کرده ولی شماره در متا نیست)
        if ( username_exists( $username ) ) {
            $user = get_user_by( 'login', $username );
            update_user_meta( $user->ID, 'billing_phone', $phone );
            return $user;
        }

        $email = $phone . '@' . $_SERVER['HTTP_HOST'];
        $password = wp_generate_password();

        $user_id = wp_create_user( $username, $password, $email );

        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        // تنظیم نقش مشتری
        $user = new WP_User( $user_id );
        $user->set_role( 'customer' );

        update_user_meta( $user_id, 'billing_phone', $phone );
        
        // هوک ثبت نام برای n8n
        do_action( 'user_register', $user_id );

        return get_userdata( $user_id );
    }

    private static function sync_guest_orders( $user_id, $phone ) {
        $args = array(
            'limit' => -1,
            'meta_key' => '_billing_phone',
            'meta_value' => $phone,
            'customer_id' => 0,
            'return' => 'ids',
        );
        // استفاده از کوئری مستقیم اگر توابع وو سنگین باشند، اما اینجا استاندارد می‌رویم
        if(function_exists('wc_get_orders')) {
            $orders = wc_get_orders( $args );
            if ( ! empty( $orders ) ) {
                foreach ( $orders as $order_id ) {
                    $order = wc_get_order( $order_id );
                    $order->set_customer_id( $user_id );
                    $order->save();
                }
            }
        }
    }

    private static function normalize_number($number) {
        $number = preg_replace('/[^0-9]/', '', $number);
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $number = str_replace($persian, $english, $number);
        
        if (substr($number, 0, 3) === '989') $number = '0' . substr($number, 2);
        if (substr($number, 0, 1) === '9') $number = '0' . $number;
        
        return $number;
    }
}