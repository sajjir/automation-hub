<?php

class Hub_Auth {

	public static function init() {
		// ثبت شورت‌کد
		add_shortcode( 'hub_login_form', array( __CLASS__, 'render_login_form' ) );

		// هندل کردن درخواست‌های AJAX (هم برای لاگین، هم غیرلاگین)
		add_action( 'wp_ajax_hub_send_otp', array( __CLASS__, 'handle_send_otp' ) );
		add_action( 'wp_ajax_nopriv_hub_send_otp', array( __CLASS__, 'handle_send_otp' ) );

		add_action( 'wp_ajax_hub_verify_otp', array( __CLASS__, 'handle_verify_otp' ) );
		add_action( 'wp_ajax_nopriv_hub_verify_otp', array( __CLASS__, 'handle_verify_otp' ) );
        
        // لود کردن اسکریپت‌ها
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

    public static function enqueue_assets() {
        wp_register_script( 'hub-auth-js', HUB_PLUGIN_URL . 'public/js/hub-auth.js', array('jquery'), HUB_VERSION, true );
        wp_register_style( 'hub-auth-css', HUB_PLUGIN_URL . 'public/css/hub-auth.css', array(), HUB_VERSION );
        
        // متغیرهای مورد نیاز در JS
        wp_localize_script( 'hub-auth-js', 'hubAuth', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'hub_auth_nonce' )
        ));
    }

	// --- 1. نمایش فرم (Shortcode) ---
	public static function render_login_form( $atts ) {
        // اگر کاربر لاگین است، پیام مناسب نشان بده
        if ( is_user_logged_in() ) {
            $current_user = wp_get_current_user();
            return "<div class='hub-logged-in'>سلام {$current_user->display_name}! شما وارد شده‌اید.</div>";
        }

        // لود استایل و اسکریپت فقط در صفحه‌ای که شورت‌کد دارد
        wp_enqueue_script( 'hub-auth-js' );
        wp_enqueue_style( 'hub-auth-css' );

		ob_start();
		?>
		<div class="hub-auth-wrapper">
            <div id="hub-step-phone" class="hub-step active">
				<h3>ورود / ثبت‌نام</h3>
				<p>برای ورود، شماره موبایل خود را وارد کنید.</p>
				<input type="tel" id="hub-phone" placeholder="شماره موبایل (مثلاً 0912...)" dir="ltr">
				<button type="button" id="hub-btn-send" class="hub-btn">ارسال کد تایید</button>
			</div>

            <div id="hub-step-verify" class="hub-step" style="display:none;">
				<h3>تایید شماره</h3>
				<p>کد ارسال شده به <span id="hub-phone-display"></span> را وارد کنید.</p>
				<div class="hub-otp-input">
                    <input type="text" id="hub-otp" placeholder="----" maxlength="5" autocomplete="one-time-code">
                </div>
				<button type="button" id="hub-btn-verify" class="hub-btn">ورود به سایت</button>
                <a href="#" id="hub-btn-edit" class="hub-link">اصلاح شماره</a>
			</div>
            
            <div id="hub-message" class="hub-message"></div>
		</div>
		<?php
		return ob_get_clean();
	}

	// --- 2. ارسال کد OTP (AJAX) ---
	public static function handle_send_otp() {
		check_ajax_referer( 'hub_auth_nonce', 'nonce' );
		
        $phone = sanitize_text_field( $_POST['phone'] );
        $phone = self::normalize_number( $phone );

        if ( ! preg_match( '/^09[0-9]{9}$/', $phone ) ) {
            wp_send_json_error( 'شماره موبایل معتبر نیست.' );
        }

        // محدودیت نرخ (Rate Limit)
        $rate_limit = get_option('hub_auth_settings')['rate_limit'] ?? 120;
        $last_sent = get_transient( 'hub_otp_time_' . $phone );
        if ( $last_sent ) {
            wp_send_json_error( "لطفاً " . ($rate_limit - (time() - $last_sent)) . " ثانیه صبر کنید." );
        }

        // تولید کد
        $otp = rand( 1000, 9999 );
        
        // ذخیره در ترنزینت (برای ۵ دقیقه معتبر)
        set_transient( 'hub_otp_code_' . $phone, $otp, 5 * 60 );
        set_transient( 'hub_otp_time_' . $phone, time(), $rate_limit ); // برای ریت لیمیت

        // *** اتصال به سناریوها ***
        // اینجا به جای ارسال مستقیم، یک هوک می‌زنیم تا Bridge بشنود
        do_action( 'hub_auth_request', $phone, $otp );

		wp_send_json_success( 'کد تایید ارسال شد.' );
	}

	// --- 3. بررسی کد و لاگین (AJAX) ---
	public static function handle_verify_otp() {
		check_ajax_referer( 'hub_auth_nonce', 'nonce' );
		
        $phone = sanitize_text_field( $_POST['phone'] );
        $otp_user = sanitize_text_field( $_POST['otp'] );
        $phone = self::normalize_number( $phone );

        $cached_otp = get_transient( 'hub_otp_code_' . $phone );

        if ( ! $cached_otp || $cached_otp != $otp_user ) {
            wp_send_json_error( 'کد تایید اشتباه یا منقضی شده است.' );
        }

        // --- کد درست است: عملیات لاگین ---
        $user = self::get_or_create_user( $phone );
        
        if ( ! is_wp_error( $user ) ) {
            // لاگین کردن کاربر
            wp_clear_auth_cookie();
            wp_set_current_user( $user->ID );
            wp_set_auth_cookie( $user->ID, true );
            
            // سینک کردن سفارشات مهمان
            self::sync_guest_orders( $user->ID, $phone );
            
            // پاک کردن کد
            delete_transient( 'hub_otp_code_' . $phone );

            // آدرس ریدایرکت
            $settings = get_option('hub_auth_settings');
            $redirect = !empty($settings['redirect_url']) ? $settings['redirect_url'] : home_url();

            wp_send_json_success( array( 'redirect' => $redirect, 'msg' => 'خوش آمدید!' ) );
        } else {
            wp_send_json_error( 'خطا در ورود کاربر.' );
        }
	}

    // --- توابع کمکی ---
    private static function get_or_create_user( $phone ) {
        // جستجو بر اساس متای billing_phone (استاندارد ووکامرس)
        $users = get_users( array(
            'meta_key' => 'billing_phone',
            'meta_value' => $phone,
            'number' => 1,
            'count_total' => false
        ) );

        if ( ! empty( $users ) ) {
            return $users[0]; // کاربر موجود
        }

        // ساخت کاربر جدید
        $username = $phone;
        $email = $phone . '@' . $_SERVER['HTTP_HOST']; // ایمیل فیک
        $password = wp_generate_password();

        $user_id = wp_create_user( $username, $password, $email );

        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        // ذخیره شماره موبایل در متای ووکامرس
        update_user_meta( $user_id, 'billing_phone', $phone );
        
        // تریگر کردن هوک ثبت‌نام (برای سناریوهای n8n)
        do_action( 'user_register', $user_id );

        return get_userdata( $user_id );
    }

    private static function sync_guest_orders( $user_id, $phone ) {
        // پیدا کردن سفارشات مهمان با این شماره
        $args = array(
            'limit' => -1,
            'meta_key' => '_billing_phone',
            'meta_value' => $phone,
            'customer_id' => 0, // فقط مهمان‌ها
            'return' => 'ids',
        );
        $orders = wc_get_orders( $args );

        if ( ! empty( $orders ) ) {
            foreach ( $orders as $order_id ) {
                $order = wc_get_order( $order_id );
                $order->set_customer_id( $user_id );
                $order->save();
            }
        }
    }

    private static function normalize_number($number) {
        $number = preg_replace('/[^0-9]/', '', $number);
        // تبدیل اعداد فارسی
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $number = str_replace($persian, $english, $number);
        
        // فرمت 09...
        if (substr($number, 0, 3) === '989') $number = '0' . substr($number, 2);
        if (substr($number, 0, 1) === '9') $number = '0' . $number;
        
        return $number;
    }
}