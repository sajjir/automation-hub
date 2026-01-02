jQuery(document).ready(function($) {
    
    // --- مدیریت Repeater وب‌هوک‌ها ---
    $('#add-webhook').on('click', function() {
        var tpl = $('#webhook-template').html().replace(/INDEX/g, $('.webhook-row').length);
        $('#webhooks-container').append(tpl);
    });

    // --- مدیریت Repeater سناریوها ---
    $('#add-rule').on('click', function() {
        var tpl = $('#rule-template').html().replace(/INDEX/g, $('.rule-row').length);
        var newRow = $(tpl);
        $('#rules-container').append(newRow);
        $('.no-data-msg').remove();
        
        // باز کردن خودکار سناریوی جدید
        newRow.find('.trigger-select').trigger('change');
        // اسکرول نرم به سناریوی جدید
        $('html, body').animate({ scrollTop: newRow.offset().top - 50 }, 500);
    });

    // --- حذف سطر ---
    $(document).on('click', '.remove-row', function(e) {
        e.stopPropagation(); // جلوگیری از باز شدن آکاردئون موقع حذف
        if(confirm('آیا مطمئن هستید؟')) {
            $(this).closest('.repeater-row').slideUp(300, function(){ $(this).remove(); });
        }
    });

    // --- آکاردئون (باز و بسته کردن) ---
    $(document).on('click', '.rule-header', function() {
        var row = $(this).closest('.rule-row');
        row.toggleClass('open');
    });

    // --- جلوگیری از بسته شدن موقع کلیک روی ورودی‌ها ---
    $(document).on('click', '.rule-body', function(e) {
        e.stopPropagation();
    });

    // --- منطق داینامیک سناریوها ---
    function initLogic() {
        // تریگر
        $(document).on('change', '.trigger-select', function() {
            var val = $(this).val();
            var row = $(this).closest('.rule-row');
            val === 'order_status' ? row.find('.sub-trigger-select').show() : row.find('.sub-trigger-select').hide();
        });

        // فعال‌سازی اکشن‌ها (تغییر استایل کارت)
        $(document).on('change', '.toggle-action', function() {
            var col = $(this).closest('.action-col');
            $(this).is(':checked') ? col.addClass('active') : col.removeClass('active');
        });

        // تارگت SMS
        $(document).on('change', '.sms-target-select', function() {
            var input = $(this).siblings('.sms-custom-input');
            $(this).val() === 'custom' ? input.slideDown() : input.slideUp();
        });
    }

    // اجرای اولیه برای تنظیم وضعیت‌ها
    initLogic();
    // تریگر کردن برای ست شدن اولیه نمایش/مخفی
    $('.trigger-select, .toggle-action, .sms-target-select').trigger('change');
});