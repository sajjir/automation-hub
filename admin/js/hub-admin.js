jQuery(document).ready(function($) {
    
    // افزودن وب‌هوک
    $('#add-webhook').on('click', function() {
        var tpl = $('#webhook-template').html().replace(/INDEX/g, $('.webhook-row').length);
        $('#webhooks-container').append(tpl);
    });

    // افزودن سناریو
    $('#add-rule').on('click', function() {
        var tpl = $('#rule-template').html().replace(/INDEX/g, $('.rule-row').length);
        $('#rules-container').append(tpl);
        $('.no-data-msg').remove();
        initLogic();
    });

    // حذف سطر
    $(document).on('click', '.remove-row', function() {
        if(confirm('آیا مطمئن هستید؟')) $(this).closest('.repeater-row').remove();
    });

    // منطق نمایش فیلدها
    function initLogic() {
        // تریگر
        $('.trigger-select').off('change').on('change', function() {
            var val = $(this).val();
            var row = $(this).closest('.rule-row');
            val === 'order_status' ? row.find('.sub-trigger-select').show() : row.find('.sub-trigger-select').hide();
        }).trigger('change');

        // فعال‌سازی اکشن‌ها
        $('.toggle-action').off('change').on('change', function() {
            var col = $(this).closest('.action-col');
            $(this).is(':checked') ? col.addClass('active') : col.removeClass('active');
        }).trigger('change');

        // تارگت SMS
        $('.sms-target-select').off('change').on('change', function() {
            var input = $(this).siblings('.sms-custom-input');
            if($(this).val() === 'custom') {
                input.show();
            } else {
                input.hide();
            }
        }).trigger('change');
    }

    initLogic();
});