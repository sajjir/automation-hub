jQuery(document).ready(function($) {
    
    // --- 1. مدیریت اتصالات ---
    $(document).on('change', '.input-type', function() {
        var type = $(this).val();
        var row = $(this).closest('.repeater-row');
        
        // مخفی کردن همه فیلدها ابتدا
        row.find('.field-group').hide();
        
        if(type === 'melipayamak') {
            row.find('.field-sms').css('display', 'flex');
        } else {
            // نمایش فیلد URL (مشترک بین n8n و تلگرام)
            var urlField = row.find('.field-url');
            urlField.css('display', 'flex');

            // اگر نوع webhook بود دکمه تست نمایش داده شود
            if (type === 'webhook') {
                urlField.find('.btn-test-conn').show();
                urlField.find('.input-url').attr('placeholder', 'https://...');
            } else { // telegram
                urlField.find('.btn-test-conn').hide();
                urlField.find('.input-url').attr('placeholder', 'Bot Token');
            }
        }
    });

    $('#add-webhook').on('click', function(e) {
        e.preventDefault();
        var tpl = $('#webhook-template').html().replace(/INDEX/g, $('.webhook-row').length);
        $('#webhooks-container').append(tpl);
        $('#webhooks-container .webhook-row:last .input-type').trigger('change');
    });

    // --- مدیریت دکمه تست اتصال (URL Ping) ---
    $(document).on('click', '.btn-test-conn', function(e) {
        e.preventDefault();
        var btn = $(this);
        var input = btn.siblings('.input-url');
        var url = input.val();

        if(!url) { alert('لطفاً آدرس URL را وارد کنید.'); return; }

        btn.addClass('updating-message').text('⏳');

        $.post(ajaxurl, {
            action: 'hub_test_connection',
            nonce: $('#_wpnonce').val(),
            url: url
        }, function(res) {
            btn.removeClass('updating-message').text('🔗 تست');
            if(res.success) {
                alert('✅ ' + res.data);
            } else {
                alert('❌ ' + res.data);
            }
        }).fail(function() {
            btn.removeClass('updating-message').text('🔗 تست');
            alert('❌ خطای سرور');
        });
    });

    // --- 2. مدیریت سناریوها ---
    $('#add-rule').on('click', function(e) {
        e.preventDefault();
        var tpl = $('#rule-template').html().replace(/INDEX/g, $('.rule-row').length);
        var newRow = $(tpl);
        $('#rules-container').append(newRow);
        $('.no-data-msg').remove();
        initLogic();
        updateTriggerUI(newRow); // بروزرسانی UI سطر جدید
        newRow.find('.rule-header').trigger('click');
        $('html, body').animate({ scrollTop: newRow.offset().top - 50 }, 500);
    });

    $(document).on('click', '.rule-header', function() {
        $(this).closest('.rule-row').toggleClass('open');
    });

    $(document).on('click', '.rule-body', function(e) {
        e.stopPropagation();
    });

    $(document).on('click', '.remove-row', function(e) {
        e.stopPropagation();
        if(confirm('آیا مطمئن هستید؟')) {
            $(this).closest('.repeater-row').slideUp(300, function(){ $(this).remove(); });
        }
    });

    $(document).on('input', '.rule-name-input', function() {
        var val = $(this).val();
        var headerTitle = $(this).closest('.rule-row').find('.rule-name-display');
        headerTitle.text(val.length > 0 ? val : 'سناریو جدید');
    });

    // --- 3. ویژگی جدید: تست آنی (سناریو) ---
    $(document).on('click', '.test-action-btn', function(e) {
        e.preventDefault();
        var btn = $(this);
        var container = btn.closest('.action-body');
        
        var type = btn.data('type');
        var connectionId = container.find('.conn-select').val();
        var message = container.find('.msg-input').val();
        var customTarget = container.find('.sms-custom-input').val(); // فقط برای SMS
        var chatId = container.find('.tg-chat-input').val(); // فقط برای تلگرام

        if(!connectionId) { alert('لطفاً ابتدا اتصال (پنل/وب‌هوک) را انتخاب کنید.'); return; }
        
        btn.addClass('updating-message').text('در حال ارسال...');

        $.post(ajaxurl, {
            action: 'hub_test_scenario',
            nonce: $('#_wpnonce').val(), // خواندن نانس از فیلد hidden وردپرس
            type: type,
            connection_id: connectionId,
            message: message,
            custom_target: customTarget,
            chat_id: chatId
        }, function(res) {
            btn.removeClass('updating-message').text('تست آنی ⚡');
            if(res.success) {
                alert('✅ ' + res.data);
            } else {
                alert('❌ خطا: ' + res.data);
            }
        }).fail(function() {
            btn.removeClass('updating-message').text('تست آنی ⚡');
            alert('❌ خطای ارتباط با سرور.');
        });
    });

    // --- 4. لاجیک شرطی و نمایش تریگرها ---

    // تابع جدید برای مدیریت نمایش فیلدها بر اساس تریگر
    function updateTriggerUI(row) {
        var trigger = row.find('.trigger-select').val();

        // 1. نمایش/مخفی کردن شرط‌های خاص (ساب تریگرها)
        row.find('.condition-box').hide();
        row.find('.cond-' + trigger).show();

        // 2. نمایش راهنمای شورت‌کد مربوطه
        row.find('.trigger-guide').hide();

        // نگاشت تریگر به کلاس راهنما
        if(trigger === 'order_status' || trigger === 'order_created') {
            row.find('.guide-order_status').show();
        } else {
            row.find('.guide-' + trigger).show();
        }
    }

    function initLogic() {
        // تغییرات تریگر
        $('.trigger-select').off('change').on('change', function() {
            updateTriggerUI($(this).closest('.rule-row'));
        });

        // اکشن‌های دیگر
        $('.toggle-action').off('change').on('change', function() {
            var col = $(this).closest('.action-col');
            $(this).is(':checked') ? col.addClass('active') : col.removeClass('active');
        }).trigger('change');

        $('.sms-target-select').off('change').on('change', function() {
            var input = $(this).siblings('.sms-custom-input');
            $(this).val() === 'custom' ? input.show() : input.hide();
        }).trigger('change');
    }

    $(document).on('click', '.var-tag', function() {
        var textToInsert = $(this).data('insert');
        var textarea = $(this).closest('.action-body').find('.msg-input');
        var cursorPos = textarea.prop('selectionStart');
        var v = textarea.val();
        textarea.val(v.substring(0, cursorPos) + textToInsert + v.substring(cursorPos, v.length));
        textarea.focus();
    });

    initLogic();
    $('.input-type').trigger('change');

    // اجرا برای تمام سطرهای موجود هنگام لود
    $('.rule-row').each(function(){
        updateTriggerUI($(this));
    });
});
