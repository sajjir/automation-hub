<?php

class Hub_Auth {

	public static function init() {
		// 1. ثبت شورت‌کد فرم ورود
		add_shortcode( 'hub_login_form', array( __CLASS__, 'render_login_form' ) );

		// 2. هندل کردن درخواست‌های AJAX
		add_action( 'wp_ajax_hub_send_otp', array( __CLASS__, 'handle_send_otp' ) );
		add_action( 'wp_ajax_nopriv_hub_send_otp', array( __CLASS__, 'handle_send_otp' ) );

		add_action( 'wp_ajax_hub_verify_otp', array( __CLASS__, 'handle_verify_otp' ) );
		add_action( 'wp_ajax_nopriv_hub_verify_otp', array( __CLASS__, 'handle_verify_otp' ) );
        
        // 3. لود استایل و اسکریپت
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );

        // 4. یکپارچه‌سازی با ووکامرس (اگر در تنظیمات فعال باشد)
        $settings = get_option('hub_auth_settings');
        if ( !empty($settings['active']) ) {
            // جایگزینی فرم لاگین استاندارد ووکامرس
            add_action( 'woocommerce_login_form_start', function() {
                echo do_shortcode('[hub_login_form]'); 
                echo '<style>.woocommerce-form-login {display:none !important;}</style>';
            });

            // مدیریت صفحه تسویه حساب (Checkout Logic)
            add_action( 'woocommerce_before_checkout_form', array( __CLASS__, 'manage_checkout_auth' ), 5 );
        }
	}

    public static function enqueue_assets() {
        wp_register_script( 'hub-auth-js', HUB_PLUGIN_URL . 'js/hub-auth.js', array('jquery'), HUB_VERSION, true );
        wp_register_style( 'hub-auth-css', HUB_PLUGIN_URL . 'css/hub-auth.css', array(), HUB_VERSION );
        
        wp_localize_script( 'hub-auth-js', 'hubAuth', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'hub_auth_nonce' ),
            'timer_limit' => 120 // ثانیه
        ));
    }

    // --- مدیریت صفحه چک‌اوت ---
    public static function manage_checkout_auth() {
        if ( is_user_logged_in() ) {
            return; // اگر لاگین است، کاری نداریم (فرم‌ها عادی نمایش داده می‌شوند)
        }

        // اگر لاگین نیست:
        // 1. نمایش فرم ورود ما
        echo '<div class="hub-checkout-auth-overlay">';
        echo '<h3>ورود / ثبت‌نام جهت تکمیل خرید</h3>';
        echo do_shortcode('[hub_login_form redirect="current"]'); // ریدایرکت به همین صفحه
        echo '</div>';

        // 2. مخفی کردن فرم اصلی چک‌اوت با CSS (روش امن برای جلوگیری از پر کردن فرم)
        echo '<style>
            form.checkout.woocommerce-checkout { display: none !important; }
            .woocommerce-info { display: none !important; } /* مخفی کردن پیام‌های پیش‌فرض وو */
        </style>';
    }

	// --- رندر فرم (HTML) ---
	public static function render_login_form( $atts ) {
        if ( is_user_logged_in() ) {
            $u = wp_get_current_user();
            return "<div class='hub-logged-in-msg'>✅ {$u->display_name} عزیز، خوش آمدید.</div>";
        }

        // مدیریت ریدایرکت (از شورت‌کد یا تنظیمات)
        $atts = shortcode_atts( array( 'redirect' => '' ), $atts );
        $redirect_url = $atts['redirect'];
        if ( $redirect_url === 'current' ) {
            // آدرس فعلی صفحه با پارامترها
            global $wp;
            $redirect_url = home_url( add_query_arg( array(), $wp->request ) );
        }

        wp_enqueue_script( 'hub-auth-js' );
        wp_enqueue_style( 'hub-auth-css' );

		ob_start();
		?>
		<div class="hub-auth-wrapper">
            <input type="hidden" id="hub-redirect-to" value="<?php echo esc_url($redirect_url); ?>">

            <div id="hub-step-phone" class="hub-step active">
				<p class="hub-label">شماره موبایل خود را وارد کنید:</p>
				<div class="hub-input-group">
                    <input type="tel" id="hub-phone" placeholder="09xxxxxxxxx" dir="ltr" maxlength="11" pattern="[0-9]*" inputmode="numeric">
				    <button type="button" id="hub-btn-send" class="hub-btn">ارسال کد</button>
                </div>
			</div>

            <div id="hub-step-verify" class="hub-step" style="display:none;">
				<p class="hub-label">کد ارسال شده به <span id="hub-phone-display" style="font-weight:bold"></span></p>
				<div class="hub-otp-group">
                    <input type="text" id="hub-otp" placeholder="- - - -" maxlength="4" autocomplete="one-time-code" inputmode="numeric">
                </div>
                
                <div class="hub-timer-box">
                    <span id="hub-timer">02:00</span>
                    <a href="#" id="hub-btn-resend" class="hub-resend-link disabled">ارسال مجدد کد</a>
                </div>
                
                <div class="hub-actions">
				    <button type="button" id="hub-btn-verify" class="hub-btn">ورود</button>
                    <a href="#" id="hub-btn-edit" class="hub-small-link">اصلاح شماره</a>
                </div>
			</div>
            
            <div id="hub-message" class="hub-message"></div>
		</div>
		<?php
		return ob_get_clean();
	}

    // --- هندلرهای AJAX (بدون تغییر نسبت به نسخه امن قبلی) ---
    // فقط در handle_verify_otp باید ریدایرکت داینامیک را از کلاینت بگیریم
    
    public static function handle_send_otp() {
		if ( ! check_ajax_referer( 'hub_auth_nonce', 'nonce', false ) ) wp_send_json_error( 'خطای امنیتی.' );
        
        $phone = self::normalize_number( isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '' );
        if ( ! preg_match( '/^09[0-9]{9}$/', $phone ) ) wp_send_json_error( 'شماره موبایل معتبر نیست.' );

        $rate_limit = get_option('hub_auth_settings')['rate_limit'] ?? 120;
        $last_sent = get_transient( 'hub_otp_time_' . $phone );
        if ( $last_sent ) {
            $remain = $rate_limit - (time() - $last_sent);
            if($remain > 0) wp_send_json_error( "لطفاً $remain ثانیه صبر کنید." );
        }

        $otp = rand( 1000, 9999 );
        set_transient( 'hub_otp_code_' . $phone, $otp, 5 * 60 );
        set_transient( 'hub_otp_time_' . $phone, time(), $rate_limit );

        do_action( 'hub_auth_request', $phone, $otp ); // برای ارسال پیامک
		wp_send_json_success( 'کد ارسال شد.' );
	}

	public static function handle_verify_otp() {
		if ( ! check_ajax_referer( 'hub_auth_nonce', 'nonce', false ) ) wp_send_json_error( 'خطای امنیتی.' );
		
        $phone = self::normalize_number( isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '' );
        $otp_user = sanitize_text_field( $_POST['otp'] );
        
        // دریافت آدرس ریدایرکت از سمت کلاینت (اگر ست شده باشد)
        $client_redirect = isset($_POST['redirect_to']) ? esc_url_raw($_POST['redirect_to']) : '';

        $cached_otp = get_transient( 'hub_otp_code_' . $phone );
        if ( empty($cached_otp) || $cached_otp != $otp_user ) wp_send_json_error( 'کد اشتباه یا منقضی شده است.' );

        $user = self::get_or_create_user( $phone );
        if ( ! is_wp_error( $user ) ) {
            wp_clear_auth_cookie();
            wp_set_current_user( $user->ID );
            wp_set_auth_cookie( $user->ID, true );
            self::sync_guest_orders( $user->ID, $phone );
            delete_transient( 'hub_otp_code_' . $phone );

            // اولویت ریدایرکت: ۱. آدرس ارسالی کلاینت (مثل چک‌اوت) ۲. تنظیمات پلاگین ۳. صفحه اصلی
            $final_redirect = home_url();
            $settings = get_option('hub_auth_settings');
            
            if ( !empty($client_redirect) ) {
                $final_redirect = $client_redirect;
            } elseif ( !empty($settings['redirect_url']) ) {
                $final_redirect = $settings['redirect_url'];
            }

            wp_send_json_success( array( 'redirect' => $final_redirect, 'msg' => 'خوش آمدید!' ) );
        } else {
            wp_send_json_error( $user->get_error_message() );
        }
	}

    // توابع کمکی (get_or_create_user, sync_guest_orders, normalize_number) مشابه قبل...
    // (برای صرفه‌جویی در فضا، فرض می‌کنیم کدهای قبلی این بخش اینجا هستند. اگر نداری بگو بفرستم)
    private static function normalize_number($number) {
        $number = preg_replace('/[^0-9]/', '', $number);
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $number = str_replace($persian, $english, $number);
        if (substr($number, 0, 3) === '989') $number = '0' . substr($number, 2);
        if (substr($number, 0, 1) === '9') $number = '0' . $number;
        return $number;
    }
    
    private static function get_or_create_user( $phone ) {
        $users = get_users( array('meta_key' => 'billing_phone', 'meta_value' => $phone, 'number' => 1) );
        if ( ! empty( $users ) ) return $users[0];

        $username = $phone;
        if ( username_exists( $username ) ) {
            $user = get_user_by( 'login', $username );
            update_user_meta( $user->ID, 'billing_phone', $phone );
            return $user;
        }

        $user_id = wp_create_user( $username, wp_generate_password(), $phone . '@' . $_SERVER['HTTP_HOST'] );
        if ( is_wp_error( $user_id ) ) return $user_id;

        $user = new WP_User( $user_id );
        $user->set_role( 'customer' );
        update_user_meta( $user_id, 'billing_phone', $phone );
        do_action( 'user_register', $user_id );
        return get_userdata( $user_id );
    }

    private static function sync_guest_orders( $user_id, $phone ) {
        if(function_exists('wc_get_orders')) {
            $orders = wc_get_orders( array('limit' => -1, 'meta_key' => '_billing_phone', 'meta_value' => $phone, 'customer_id' => 0, 'return' => 'ids') );
            if ( ! empty( $orders ) ) {
                foreach ( $orders as $order_id ) {
                    $order = wc_get_order( $order_id );
                    $order->set_customer_id( $user_id );
                    $order->save();
                }
            }
        }
    }
}