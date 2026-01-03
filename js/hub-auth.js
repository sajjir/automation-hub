jQuery(document).ready(function($) {
    var $wrapper = $('.hub-auth-wrapper');
    var $stepPhone = $('#hub-step-phone');
    var $stepVerify = $('#hub-step-verify');
    var $msg = $('#hub-message');

    // ارسال OTP
    $('#hub-btn-send').on('click', function() {
        var phone = $('#hub-phone').val();
        if(phone.length < 10) { showMsg('لطفا شماره معتبر وارد کنید.', 'error'); return; }

        var btn = $(this);
        btn.addClass('loading').prop('disabled', true).text('در حال ارسال...');

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
                $('#hub-otp').focus();
                showMsg(res.data, 'success');
            } else {
                showMsg(res.data, 'error');
            }
        });
    });

    // بررسی OTP
    $('#hub-btn-verify').on('click', function() {
        var otp = $('#hub-otp').val();
        var phone = $('#hub-phone').val(); // خواندن از حافظه
        if(otp.length < 4) { showMsg('کد تایید کامل نیست.', 'error'); return; }

        var btn = $(this);
        btn.addClass('loading').prop('disabled', true).text('در حال بررسی...');

        $.post(hubAuth.ajax_url, {
            action: 'hub_verify_otp',
            nonce: hubAuth.nonce,
            phone: phone,
            otp: otp
        }, function(res) {
            if(res.success) {
                showMsg(res.data.msg, 'success');
                window.location.href = res.data.redirect;
            } else {
                btn.removeClass('loading').prop('disabled', false).text('ورود به سایت');
                showMsg(res.data, 'error');
            }
        });
    });

    // برگشت به اصلاح شماره
    $('#hub-btn-edit').on('click', function(e) {
        e.preventDefault();
        $stepVerify.hide();
        $stepPhone.fadeIn();
        $('#hub-message').hide();
    });

    function showMsg(text, type) {
        $msg.removeClass('success error').addClass(type).text(text).show();
    }
});