jQuery(document).ready(function($) {
    
    // --- 1. مدیریت اتصالات (Connections) ---
    
    // تغییر نوع وب‌هوک (نمایش فیلدهای مربوطه)
    $(document).on('change', '.input-type', function() {
        var type = $(this).val();
        var row = $(this).closest('.repeater-row');
        
        row.find('.field-group').hide(); // مخفی کردن همه
        if(type === 'melipayamak') {
            row.find('.field-sms').css('display', 'flex'); // نمایش فیلدهای پیامک
        } else {
            row.find('.field-url').show(); // نمایش فیلد URL
        }
    });

    // دکمه افزودن اتصال
    $('#add-webhook').on('click', function(e) {
        e.preventDefault();
        var tpl = $('#webhook-template').html().replace(/INDEX/g, $('.webhook-row').length);
        $('#webhooks-container').append(tpl);
        // تریگر کردن تغییر برای تنظیم اولیه فیلدها
        $('#webhooks-container .webhook-row:last .input-type').trigger('change');
    });

    // --- 2. مدیریت سناریوها (Campaigns) ---

    // دکمه افزودن سناریو
    $('#add-rule').on('click', function(e) {
        e.preventDefault();
        var tpl = $('#rule-template').html().replace(/INDEX/g, $('.rule-row').length);
        var newRow = $(tpl);
        $('#rules-container').append(newRow);
        $('.no-data-msg').remove();
        
        initLogic(); // راه‌اندازی لاجیک برای سطر جدید
        
        // باز کردن خودکار
        newRow.find('.rule-header').trigger('click');
        // اسکرول به پایین
        $('html, body').animate({ scrollTop: newRow.offset().top - 50 }, 500);
    });

    // باز و بسته کردن آکاردئون
    $(document).on('click', '.rule-header', function() {
        $(this).closest('.rule-row').toggleClass('open');
    });

    // جلوگیری از بستن وقتی روی بادی کلیک میشه
    $(document).on('click', '.rule-body', function(e) {
        e.stopPropagation();
    });

    // حذف سطر (مشترک)
    $(document).on('click', '.remove-row', function(e) {
        e.stopPropagation();
        if(confirm('آیا مطمئن هستید؟')) {
            $(this).closest('.repeater-row').slideUp(300, function(){ $(this).remove(); });
        }
    });

    // --- 3. ویژگی جدید: آپدیت نام سناریو ---
    $(document).on('input', '.rule-name-input', function() {
        var val = $(this).val();
        var headerTitle = $(this).closest('.rule-row').find('.rule-name-display');
        if(val.length > 0) {
            headerTitle.text(val);
        } else {
            headerTitle.text('سناریو جدید');
        }
    });

    // --- 4. لاجیک شرطی ---
    function initLogic() {
        // تغییر تریگر
        $('.trigger-select').off('change').on('change', function() {
            var val = $(this).val();
            var row = $(this).closest('.rule-row');
            // فقط برای تریگر "تغییر وضعیت سفارش" ساب-تریگر را نشان بده
            val === 'order_status' ? row.find('.sub-trigger-select').show() : row.find('.sub-trigger-select').hide();
        }).trigger('change');

        // تاگل کردن اکشن‌ها (رنگی شدن کارت)
        $('.toggle-action').off('change').on('change', function() {
            var col = $(this).closest('.action-col');
            $(this).is(':checked') ? col.addClass('active') : col.removeClass('active');
        }).trigger('change');

        // انتخاب تارگت پیامک
        $('.sms-target-select').off('change').on('change', function() {
            var input = $(this).siblings('.sms-custom-input');
            $(this).val() === 'custom' ? input.show() : input.hide();
        }).trigger('change');
    }

    // --- 5. متغیرهای هوشمند (Click-to-Insert) ---
    $(document).on('click', '.var-tag', function() {
        var textToInsert = $(this).data('insert');
        var textarea = $(this).closest('.action-body').find('.msg-input');
        
        var cursorPos = textarea.prop('selectionStart');
        var v = textarea.val();
        var textBefore = v.substring(0,  cursorPos);
        var textAfter  = v.substring(cursorPos, v.length);
        
        textarea.val(textBefore + textToInsert + textAfter);
        textarea.focus();
    });

    // اجرای اولیه
    initLogic();
    $('.input-type').trigger('change');
});