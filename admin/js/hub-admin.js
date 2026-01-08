jQuery(document).ready(function($) {

    // 1. سوئیچ کردن تب‌های اصلی صفحه (داشبورد / اتصالات / لاگ)
    $('.nav-tab-wrapper > a').click(function(e){
        // اگر تب مربوط به داخل سناریو نبود (n8n/sms/tg)
        if(!$(this).hasClass('tab-link-n8n') && !$(this).hasClass('tab-link-sms') && !$(this).hasClass('tab-link-tg')) {
             e.preventDefault();
             $('.nav-tab-wrapper > a').removeClass('nav-tab-active');
             $(this).addClass('nav-tab-active');
             $('.hub-tab-content').hide();
             $($(this).attr('href')).show();
        }
    });

    // 2. سوئیچ کردن تب‌های داخل هر سناریو
    $(document).on('click', '.rule-tabs .nav-tab', function(e){
        e.preventDefault();
        var target = $(this).data('target');
        var parent = $(this).closest('.rule-row');
        
        parent.find('.rule-tabs .nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        
        parent.find('.tab-content').hide();
        parent.find('.' + target).show();
    });

    // 3. اعمال منطق سوئیچ‌های جهانی (مخفی کردن تب‌ها)
    function applyGlobalToggles() {
        var n8n = $('#global_n8n').is(':checked');
        var sms = $('#global_sms').is(':checked');
        var tg  = $('#global_telegram').is(':checked');

        if(n8n) $('.tab-link-n8n').show(); else $('.tab-link-n8n').hide();
        if(sms) $('.tab-link-sms').show(); else $('.tab-link-sms').hide();
        if(tg)  $('.tab-link-tg').show();  else $('.tab-link-tg').hide();
    }
    $('.global-toggles-card input').change(applyGlobalToggles);
    applyGlobalToggles(); // اجرا در لحظه لود

    // 4. نمایش شرط‌ها و تگ‌ها بر اساس نوع تریگر
    function updateTriggerUI(row) {
        var trigger = row.find('.trigger-selector').val();
        
        // مخفی کردن همه
        row.find('.condition-box').hide();
        row.find('.var-list').hide();

        // نمایش موارد مرتبط
        row.find('.cond-' + trigger).show();
        row.find('.guide-' + trigger).css('display', 'block'); // نمایش لیست تگ‌ها
        
        // هندل کردن گروه‌های خاص (مثل سفارشات)
        if(trigger.indexOf('order') !== -1) row.find('.guide-order_status').css('display', 'block');
    }
    $(document).on('change', '.trigger-selector', function() {
        updateTriggerUI($(this).closest('.rule-row'));
    });
    $('.rule-row').each(function(){ updateTriggerUI($(this)); });

    // 5. کلیک روی تگ متغیرها (درج در تکست‌اریا)
    $(document).on('click', '.var-tag', function(){
        var textToInsert = $(this).data('insert');
        var parentRow = $(this).closest('.rule-row');
        
        // پیدا کردن تکست‌اریای فعال (بر اساس تب باز شده)
        var activeTabClass = parentRow.find('.rule-tabs .nav-tab-active').data('target'); // مثلا tab-sms
        var textarea = parentRow.find('.' + activeTabClass + ' textarea');
        
        if(textarea.length && textarea.is(':visible')) {
            var cursorPos = textarea.prop('selectionStart');
            var v = textarea.val();
            var textBefore = v.substring(0,  cursorPos);
            var textAfter  = v.substring(cursorPos, v.length);
            textarea.val(textBefore + textToInsert + textAfter);
            textarea.focus();
        } else {
            alert('لطفاً ابتدا تب مورد نظر (n8n، پیامک یا تلگرام) را باز کنید تا متغیر در کادر متن آن درج شود.');
        }
    });

    // 6. دکمه تست اتصال (AJAX)
    $(document).on('click', '.test-connection-btn', function(){
        var btn = $(this);
        var row = btn.closest('.webhook-row');
        var type = row.find('.conn-type-selector').val();
        var data = {};
        
        btn.text('در حال ارسال...').prop('disabled', true);

        // جمع‌آوری داده‌ها برای تست
        if(type === 'webhook') data.url = row.find('input[name="webhook_url[]"]').val();
        
        if(type === 'telegram') {
             data.url = row.find('input[name="webhook_url[]"]').val();
             data.test_chat_id = prompt("یک Chat ID تلگرام برای تست وارد کنید:");
             if(!data.test_chat_id) { btn.text('تست اتصال ⚡').prop('disabled', false); return; }
        }
        
        if(type === 'sms') {
            data.sms_user = row.find('input[name="sms_user[]"]').val();
            data.sms_pass = row.find('input[name="sms_pass[]"]').val();
            data.sms_from = row.find('input[name="sms_from[]"]').val();
            data.test_mobile = prompt("شماره موبایل جهت تست وارد کنید:");
            if(!data.test_mobile) { btn.text('تست اتصال ⚡').prop('disabled', false); return; }
        }

        // ارسال درخواست
        $.post(hub_ajax.ajax_url, {
            action: 'hub_test_connection',
            security: hub_ajax.nonce,
            type: type,
            data: data
        }, function(res) {
            alert(res.data); // نمایش پیام سرور
            btn.text('تست اتصال ⚡').prop('disabled', false);
        }).fail(function() {
            alert('خطا در برقراری ارتباط با سرور.');
            btn.text('تست اتصال ⚡').prop('disabled', false);
        });
    });

    // 7. افزودن/حذف سطر (Repeater)
    $('#add-rule-btn').click(function(){
        var clone = $('.rule-row').first().clone();
        var newIdx = $('.rule-row').length;
        
        clone.attr('data-index', newIdx);
        clone.find('.sajj-header h3').text('سناریو جدید');
        clone.find('input[type="text"], textarea').val('');
        clone.find('input[type="checkbox"]').prop('checked', false);
        
        // اصلاح نام فیلدها برای آرایه PHP
        clone.find('input, select, textarea').each(function(){
            var name = $(this).attr('name');
            if(name) {
                var newName = name.replace(/\[\d+\]/, '['+newIdx+']');
                $(this).attr('name', newName);
            }
        });

        $('#rules-container').append(clone);
        applyGlobalToggles(); // اعمال وضعیت سوئیچ‌ها روی سطر جدید
        updateTriggerUI(clone); // تنظیم اولیه UI
    });
    
    $(document).on('click', '.remove-row', function(){
        if(confirm('آیا مطمئن هستید؟')) {
            if($('.rule-row').length > 1) {
                $(this).closest('.rule-row').remove();
            } else {
                alert('حداقل یک سناریو باید وجود داشته باشد.');
            }
        }
    });

    // 8. افزودن کانال جدید
    $('#add-webhook-btn').click(function(){
        var clone = $('.webhook-row').first().clone();
        clone.find('input').val('');
        $('#webhooks-container').append(clone);
    });

    // 9. تغییر نوع اتصال (نمایش فیلد مرتبط)
    $(document).on('change', '.conn-type-selector', function(){
        var val = $(this).val();
        var row = $(this).closest('.webhook-row');
        row.find('.conn-fields').hide();
        if(val==='sms') row.find('.field-sms').show();
        else row.find('.field-webhook').show(); // برای n8n و تلگرام
    });

});