jQuery(document).ready(function($) {
    var $stepPhone = $('#hub-step-phone');
    var $stepVerify = $('#hub-step-verify');
    var $stepRegister = $('#hub-step-register');
    var $msg = $('#hub-message');
    
    var $phoneInput = $('#hub-phone');
    var $otpInput = $('#hub-otp');
    var $timerDisplay = $('#hub-timer');
    var $resendLink = $('#hub-btn-resend');
    
    var countdownInterval;

    // --- ۱. ارسال OTP ---
    $('#hub-btn-send, #hub-btn-resend').on('click', function(e) {
        e.preventDefault();
        if($(this).attr('id') === 'hub-btn-resend' && $(this).hasClass('disabled')) return;

        var phone = $phoneInput.val();
        if(phone.length < 10) { showMsg('لطفا شماره صحیح وارد کنید', 'error'); return; }

        var btn = $('#hub-btn-send');
        btn.addClass('loading').prop('disabled', true).text('در حال ارسال...');
        $msg.hide();

        $.post(hubAuth.ajax_url, {
            action: 'hub_send_otp',
            nonce: hubAuth.nonce,
            phone: phone
        }, function(res) {
            btn.removeClass('loading').prop('disabled', false).text('ارسال کد تایید');
            if(res.success) {
                $stepPhone.hide();
                $stepVerify.fadeIn();
                $('#hub-phone-display').text(phone);
                $otpInput.val('').focus();
                startTimer(hubAuth.timer_limit || 120);
                showMsg(res.data, 'success');
            } else {
                showMsg(res.data, 'error');
            }
        });
    });

    // --- ۲. بررسی کد (دکمه و تایپ) ---
    $('#hub-btn-verify').on('click', function() { verifyOtp(); });
    $otpInput.on('input', function() {
        var val = $(this).val().replace(/[^0-9]/g, '');
        $(this).val(val);
        if (val.length === 4) verifyOtp();
    });

    function verifyOtp() {
        var otp = $otpInput.val();
        var phone = $phoneInput.val();
        var redirectTo = $('#hub-redirect-to').val();

        if(otp.length < 4) return;

        var btn = $('#hub-btn-verify');
        btn.addClass('loading').prop('disabled', true).text('در حال بررسی...');

        $.post(hubAuth.ajax_url, {
            action: 'hub_verify_otp',
            nonce: hubAuth.nonce,
            phone: phone,
            otp: otp,
            redirect_to: redirectTo
        }, function(res) {
            btn.removeClass('loading').prop('disabled', false).text('بررسی کد');
            
            if(res.success) {
                if ( res.data.action === 'login_success' ) {
                    // کاربر قدیمی -> لاگین
                    showMsg(res.data.msg, 'success');
                    window.location.href = res.data.redirect;
                } else if ( res.data.action === 'register_required' ) {
                    // کاربر جدید -> نمایش فرم ثبت نام
                    showMsg(res.data.msg, 'success');
                    $stepVerify.hide();
                    $stepRegister.fadeIn();
                }
            } else {
                showMsg(res.data, 'error');
                $otpInput.val('').focus();
            }
        });
    }

    // --- ۳. تکمیل ثبت‌نام (کاربر جدید) ---
    $('#hub-btn-register').on('click', function() {
        var fname = $('#hub-fname').val();
        var lname = $('#hub-lname').val();
        var email = $('#hub-email').val();
        var phone = $phoneInput.val();
        var redirectTo = $('#hub-redirect-to').val();

        if(!fname || !lname || !email) { showMsg('لطفاً تمام فیلدها را پر کنید.', 'error'); return; }

        var btn = $(this);
        btn.addClass('loading').prop('disabled', true).text('در حال ساخت حساب...');

        $.post(hubAuth.ajax_url, {
            action: 'hub_complete_register',
            nonce: hubAuth.nonce,
            phone: phone,
            fname: fname,
            lname: lname,
            email: email,
            redirect_to: redirectTo
        }, function(res) {
            if(res.success) {
                showMsg(res.data.msg, 'success');
                window.location.href = res.data.redirect;
            } else {
                btn.removeClass('loading').prop('disabled', false).text('ثبت اطلاعات و ورود');
                showMsg(res.data, 'error');
            }
        });
    });

    // --- ابزارها ---
    function startTimer(duration) {
        clearInterval(countdownInterval);
        var timer = duration, minutes, seconds;
        $resendLink.addClass('disabled');
        
        countdownInterval = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            $timerDisplay.text(minutes + ":" + seconds);

            if (--timer < 0) {
                clearInterval(countdownInterval);
                $resendLink.removeClass('disabled');
                $timerDisplay.text("00:00");
            }
        }, 1000);
    }

    $('#hub-btn-edit').on('click', function(e) {
        e.preventDefault();
        clearInterval(countdownInterval);
        $stepVerify.hide();
        $stepPhone.fadeIn();
        $msg.hide();
    });

    function showMsg(text, type) {
        $msg.removeClass('success error').addClass(type).text(text).slideDown();
    }
});