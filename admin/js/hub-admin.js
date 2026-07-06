jQuery(document).ready(function($) {
    
    // --- مدیریت اتصالات (دست نخورده از قبل) ---
    $(document).on('change', '.conn-type-selector', function() {
        var type = $(this).val();
        var row = $(this).closest('.repeater-row, .webhook-row');
        row.find('.conn-fields').hide();
        if(type === 'sms' || type === 'melipayamak') {
            row.find('.field-sms').show();
        } else {
            row.find('.field-webhook').show();
        }
    });

    $('#add-webhook-btn').on('click', function(e) {
        e.preventDefault();
        var clone = $('.webhook-row').first().clone();
        clone.find('input').val('');
        $('#webhooks-container').append(clone);
    });

    // --- مدیریت سناریوها (جدید) ---
    function getNextRuleIndex() {
        return $('.rule-row').length;
    }

    // افزودن سناریو جدید
    $('#add-rule-btn').on('click', function(e) {
        e.preventDefault();
        var tpl = wp.template('rule-container');
        var html = tpl({ rule_idx: getNextRuleIndex() });
        $('#rules-container').append(html);
    });

    // حذف سناریو
    $(document).on('click', '.remove-rule', function() {
        if(confirm('آیا مطمئن هستید؟')) {
            $(this).closest('.rule-row').slideUp(300, function(){ $(this).remove(); });
        }
    });

    // سوییچ نمایش تریگر
    $(document).on('change', '.trigger-selector', function() {
        var val = $(this).val();
        var box = $(this).closest('.rule-row').find('.trigger-meta-box');
        box.find('.trigger-meta').hide();
        box.find('.meta-' + val).show();

        // مخفی کردن کاندیشن‌ها برای مواردی که Order نیستند
        if(val !== 'order_status' && val !== 'order_created') {
            $(this).closest('.rule-row').find('.conditions-wrapper').hide();
        } else {
            $(this).closest('.rule-row').find('.conditions-wrapper').show();
        }
    });

    // افزودن شرط
    $(document).on('click', '.add-condition-btn', function() {
        var ruleBox = $(this).closest('.rule-row');
        var r_idx = ruleBox.data('index');
        var c_idx = ruleBox.find('.condition-row').length;
        var tpl = wp.template('condition-row');
        ruleBox.find('.conditions-list').append(tpl({ rule_idx: r_idx, cond_idx: c_idx }));
    });

    // حذف شرط
    $(document).on('click', '.remove-condition', function() {
        $(this).closest('.condition-row').remove();
    });

    // افزودن اکشن
    $(document).on('click', '.add-action-btn', function() {
        var ruleBox = $(this).closest('.rule-row');
        var r_idx = ruleBox.data('index');
        var a_idx = ruleBox.find('.action-card').length;
        var tpl = wp.template('action-row');
        ruleBox.find('.actions-list').append(tpl({ rule_idx: r_idx, act_idx: a_idx }));
    });

    // حذف اکشن
    $(document).on('click', '.remove-action', function() {
        if(confirm('حذف شود؟')) {
            $(this).closest('.action-card').slideUp(300, function(){ $(this).remove(); });
        }
    });

    // تکثیر اکشن
    $(document).on('click', '.duplicate-action', function() {
        var card = $(this).closest('.action-card');
        var ruleBox = card.closest('.rule-row');
        var clone = card.clone();
        
        // اصلاح ایندکس‌های نام input ها
        var r_idx = ruleBox.data('index');
        var a_idx = ruleBox.find('.action-card').length; // ایندکس جدید
        
        clone.find('input, select, textarea').each(function() {
            var name = $(this).attr('name');
            if(name) {
                var newName = name.replace(/\[actions\]\[\d+\]/, '[actions][' + a_idx + ']');
                $(this).attr('name', newName);
            }
        });

        // ست کردن مقادیر انتخابی سلکت‌ها که در کلون از دست می‌روند
        var originalSelects = card.find('select');
        clone.find('select').each(function(index) {
             $(this).val(originalSelects.eq(index).val());
        });

        ruleBox.find('.actions-list').append(clone);
    });

    // مخفی کردن کانکشن برای نوع ایمیل
    $(document).on('change', '.action-type-select', function() {
        var wrap = $(this).closest('.flex-row').find('.action-conn-wrapper');
        if($(this).val() === 'email') { wrap.hide(); } else { wrap.show(); }
    });

    // راه‌اندازی منطق هنگام لود برای المان‌های موجود
    $('.trigger-selector').trigger('change');
    $('.action-type-select').trigger('change');
    
    // --- تب‌ها ---
    $('.nav-tab-wrapper .nav-tab').on('click', function(e) {
        e.preventDefault();
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        $('.hub-tab-content').hide();
        $($(this).attr('href')).show();
    });
});