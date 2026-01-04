jQuery(document).ready(function($) {
    var $wrapper = $('.hub-auth-wrapper');
    var $stepPhone = $('#hub-step-phone');
    var $stepVerify = $('#hub-step-verify');
    var $msg = $('#hub-message');
    var $otpInput = $('#hub-otp');
    var $resendLink = $('#hub-btn-resend');
    var $timerDisplay = $('#hub-timer');
    
    var countdownInterval;

    // 1. ارسال OTP
    $('#hub-btn-send, #hub-btn-resend').on('click', function(e) {
        e.preventDefault();
        
        // اگر دکمه ریسند غیرفعال است کاری نکن
        if($(this).attr('id') === 'hub-btn-resend' && $(this).hasClass('disabled')) return;

        var phone = $('#hub-phone').val();
        if(phone.length < 10) { showMsg('لطفا شماره معتبر وارد کنید', 'error'); return; }

        var btn = $('#hub-btn-send'); // دکمه اصلی
        btn.addClass('loading').prop('disabled', true).text('در حال ارسال...');
        $msg.hide();

        $.post(hubAuth.ajax_url, {
            action: 'hub_send_otp',
            nonce: hubAuth.nonce,
            phone: phone
        }, function(res) {
            btn.removeClass('loading').prop('disabled', false).text('ارسال کد');
            if(res.success) {
                $stepPhone.hide();
                $stepVerify.fadeIn();
                $('#hub-phone-display').text(phone);
                $otpInput.val('').focus();
                
                // شروع تایمر
                startTimer(hubAuth.timer_limit || 120);
                
                showMsg(res.data, 'success');
            } else {
                showMsg(res.data, 'error');
            }
        });
    });

    // 2. بررسی OTP (دستی)
    $('#hub-btn-verify').on('click', function() {
        verifyOtp();
    });

    // 3. تایید خودکار (Auto Submit)
    $otpInput.on('keyup input', function() {
        var val = $(this).val();
        // فقط عدد
        this.value = val.replace(/[^0-9]/g, '');
        
        // اگر ۴ رقم شد، ارسال کن
        if (this.value.length === 4) {
            verifyOtp();
        }
    });

    function verifyOtp() {
        var otp = $otpInput.val();
        var phone = $('#hub-phone').val();
        var redirectTo = $('#hub-redirect-to').val(); // آدرس مقصد

        if(otp.length < 4) { showMsg('کد ۴ رقمی است', 'error'); return; }

        var btn = $('#hub-btn-verify');
        btn.addClass('loading').prop('disabled', true).text('...');

        $.post(hubAuth.ajax_url, {
            action: 'hub_verify_otp',
            nonce: hubAuth.nonce,
            phone: phone,
            otp: otp,
            redirect_to: redirectTo // ارسال آدرس به سرور
        }, function(res) {
            if(res.success) {
                showMsg(res.data.msg, 'success');
                // ریدایرکت
                window.location.href = res.data.redirect;
            } else {
                btn.removeClass('loading').prop('disabled', false).text('ورود');
                showMsg(res.data, 'error');
                $otpInput.val('').focus(); // پاک کردن کد غلط
            }
        });
    }

    // 4. تایمر معکوس
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
                $timerDisplay.text(""); // مخفی کردن تایمر صفر شده
            }
        }, 1000);
    }

    // 5. اصلاح شماره
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