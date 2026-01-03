jQuery(document).ready(function($) {
    
    // --- مدیریت متغیرهای هوشمند (Click-to-Insert) ---
    $(document).on('click', '.var-tag', function() {
        var textToInsert = $(this).data('insert');
        var textarea = $(this).closest('.action-body').find('.msg-input');
        
        // درج در موقعیت مکان‌نما
        var cursorPos = textarea.prop('selectionStart');
        var v = textarea.val();
        var textBefore = v.substring(0,  cursorPos);
        var textAfter  = v.substring(cursorPos, v.length);
        
        textarea.val(textBefore + textToInsert + textAfter);
        
        // بازگشت فوکوس به تکست‌اریا
        textarea.focus();
    });

    // ... (بقیه کدهای قبلی Repeater و Logic ثابت می‌مانند) ...
    // --- Repeater Logic ---
    $('#add-webhook').on('click', function() {
        var tpl = $('#webhook-template').html().replace(/INDEX/g, $('.webhook-row').length);
        var newRow = $(tpl);
        $('#webhooks-container').append(newRow);
        newRow.find('.input-type').trigger('change');
    });

    $('#add-rule').on('click', function() {
        var tpl = $('#rule-template').html().replace(/INDEX/g, $('.rule-row').length);
        $('#rules-container').append(tpl);
        $('.no-data-msg').remove();
        initLogic();
    });

    $(document).on('click', '.remove-row', function(e) {
        e.stopPropagation();
        if(confirm('حذف شود؟')) $(this).closest('.repeater-row').remove();
    });
    
    $(document).on('click', '.rule-header', function() {
        $(this).closest('.rule-row').toggleClass('open');
    });
    $(document).on('click', '.rule-body', function(e) { e.stopPropagation(); });

    $(document).on('change', '.input-type', function() {
        var type = $(this).val();
        var row = $(this).closest('.repeater-row');
        row.find('.field-group').hide();
        if(type === 'melipayamak') {
            row.find('.field-melipayamak').css('display', 'flex');
        } else {
            row.find('.field-webhook').show();
        }
    });

    function initLogic() {
        $('.trigger-select').off('change').on('change', function() {
            var val = $(this).val();
            var row = $(this).closest('.rule-row');
            val === 'order_status' ? row.find('.sub-trigger-select').show() : row.find('.sub-trigger-select').hide();
        }).trigger('change');

        $('.toggle-action').off('change').on('change', function() {
            var col = $(this).closest('.action-col');
            $(this).is(':checked') ? col.addClass('active') : col.removeClass('active');
        }).trigger('change');

        $('.sms-target-select').off('change').on('change', function() {
            var input = $(this).siblings('.sms-custom-input');
            $(this).val() === 'custom' ? input.show() : input.hide();
        }).trigger('change');
    }

    initLogic();
    $('.input-type').trigger('change');
});