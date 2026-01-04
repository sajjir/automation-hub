jQuery(document).ready(function($) {
    var $stepPhone = $('#hub-step-phone');
    var $stepVerify = $('#hub-step-verify');
    var $msg = $('#hub-message');
    var $otpInput = $('#hub-otp');
    var $phoneInput = $('#hub-phone');
    var $timerDisplay = $('#hub-timer');
    var $resendLink = $('#hub-btn-resend');
    
    var countdownInterval;

    // --- ارسال OTP ---
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
                
                // شروع تایمر
                startTimer(hubAuth.timer_limit || 120);
                showMsg(res.data, 'success');
            } else {
                showMsg(res.data, 'error');
            }
        });
    });

    // --- بررسی کد (دکمه) ---
    $('#hub-btn-verify').on('click', function() {
        verifyOtp();
    });

    // --- Auto Submit (روی رقم چهارم) ---
    $otpInput.on('input', function() {
        var val = $(this).val().replace(/[^0-9]/g, '');
        $(this).val(val);
        
        if (val.length === 4) {
            verifyOtp();
        }
    });

    function verifyOtp() {
        var otp = $otpInput.val();
        var phone = $phoneInput.val();
        var redirectTo = $('#hub-redirect-to').val(); // گرفتن مقدار ریدایرکت از اینپوت مخفی

        if(otp.length < 4) return; // تا ۴ رقم نشده کاری نکن

        var btn = $('#hub-btn-verify');
        btn.addClass('loading').prop('disabled', true).text('در حال بررسی...');

        $.post(hubAuth.ajax_url, {
            action: 'hub_verify_otp',
            nonce: hubAuth.nonce,
            phone: phone,
            otp: otp,
            redirect_to: redirectTo // ارسال به سرور
        }, function(res) {
            if(res.success) {
                showMsg(res.data.msg, 'success');
                window.location.href = res.data.redirect;
            } else {
                btn.removeClass('loading').prop('disabled', false).text('ورود به سیستم');
                showMsg(res.data, 'error');
                $otpInput.val('').focus();
            }
        });
    }

    // --- تایمر معکوس ---
    function startTimer(duration) {
        clearInterval(countdownInterval);
        var timer = duration, minutes, seconds;
        
        $resendLink.addClass('disabled'); // غیرفعال کردن لینک
        
        countdownInterval = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            $timerDisplay.text(minutes + ":" + seconds);

            if (--timer < 0) {
                clearInterval(countdownInterval);
                $resendLink.removeClass('disabled'); // فعال کردن لینک
                $timerDisplay.text("00:00");
            }
        }, 1000);
    }

    // --- اصلاح شماره ---
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