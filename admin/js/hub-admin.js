jQuery(document).ready(function($) {
    
    // --- مدیریت Repeater وب‌هوک‌ها ---
    $('#add-webhook').on('click', function() {
        var template = $('#webhook-template').html();
        var index = $('.webhook-row').length;
        template = template.replace(/INDEX/g, index);
        $('#webhooks-container').append(template);
    });

    // --- مدیریت Repeater سناریوها (Rules) ---
    $('#add-rule').on('click', function() {
        var template = $('#rule-template').html();
        var index = $('.rule-row').length;
        template = template.replace(/INDEX/g, index);
        $('#rules-container').append(template);
        $('.no-data-msg').remove();
        
        // تریگر کردن رویداد تغییر برای نمایش راهنمای پیش‌فرض
        $('#rules-container .rule-row:last .trigger-select').trigger('change');
    });

    // --- حذف سطر ---
    $(document).on('click', '.remove-row', function() {
        if(confirm('آیا مطمئن هستید؟')) {
            $(this).closest('.repeater-row').remove();
        }
    });

    // --- منطق داینامیک سناریوها ---
    $(document).on('change', '.trigger-select', function() {
        var val = $(this).val();
        var row = $(this).closest('.rule-row');
        
        // 1. نمایش/مخفی کردن ساب-تریگر (وضعیت سفارش)
        if(val === 'order_status') {
            row.find('.sub-trigger-select').show();
        } else {
            row.find('.sub-trigger-select').hide();
        }

        // 2. تغییر راهنمای شورت‌کدها
        row.find('.guide').hide();
        if(val.startsWith('order')) {
            row.find('.guide-order').show();
        } else if(val.startsWith('user')) {
            row.find('.guide-user').show();
        } else if(val.startsWith('product')) {
            row.find('.guide-product').show();
        }
    });

    // --- تاگل کردن شرط پیشرفته ---
    $(document).on('change', '.condition-toggle', function() {
        var box = $(this).closest('.logic-section').find('.condition-box');
        if($(this).is(':checked')) {
            box.slideDown();
        } else {
            box.slideUp();
        }
    });

    // اجرای اولیه برای تنظیم راهنماها در هنگام لود صفحه
    $('.trigger-select').trigger('change');
});