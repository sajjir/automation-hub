jQuery(document).ready(function($) {
    
    // --- مدیریت اتصالات ---
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

    // احیای تست اتصال واقعی
    $(document).on('click', '.test-connection-btn', function(e) {
        e.preventDefault();
        var btn = $(this);
        var row = btn.closest('.webhook-row');
        
        var type = row.find('.conn-type-selector').val();
        var url = row.find('input[name="webhook_url[]"]').val();
        var sms_user = row.find('input[name="sms_user[]"]').val();
        var sms_pass = row.find('input[name="sms_pass[]"]').val();
        var sms_from = row.find('input[name="sms_from[]"]').val();

        btn.text('⏳').prop('disabled', true);

        $.post(ajaxurl, {
            action: 'hub_test_connection',
            nonce: $('#hub_nonce').val(),
            type: type,
            url: url,
            sms_user: sms_user,
            sms_pass: sms_pass,
            sms_from: sms_from
        }, function(res) {
            btn.text('تست اتصال ⚡').prop('disabled', false);
            if(res.success) {
                alert('✅ ' + res.data);
            } else {
                alert('❌ ' + res.data);
            }
        }).fail(function() {
            btn.text('تست اتصال ⚡').prop('disabled', false);
            alert('❌ خطای ارتباط با سرور.');
        });
    });

    // --- مدیریت سناریوها ---
    
    // حل باگ تداخل ایندکس‌ها با پیدا کردن ماکزیمم ایندکس موجود
    function getNextRuleIndex() {
        var maxIdx = -1;
        $('.rule-row').each(function() {
            var idx = parseInt($(this).data('index'));
            if(!isNaN(idx) && idx > maxIdx) maxIdx = idx;
        });
        return maxIdx + 1;
    }

    $('#add-rule-btn').on('click', function(e) {
        e.preventDefault();
        var tpl = wp.template('rule-container');
        var html = tpl({ rule_idx: getNextRuleIndex() });
        $('#rules-container').append(html);
    });

    $(document).on('click', '.remove-rule', function() {
        if(confirm('آیا مطمئن هستید؟')) {
            $(this).closest('.rule-row').slideUp(300, function(){ $(this).remove(); });
        }
    });

    $(document).on('change', '.trigger-selector', function() {
        var val = $(this).val();
        var box = $(this).closest('.rule-row').find('.trigger-meta-box');
        box.find('.trigger-meta').hide();
        box.find('.meta-' + val).show();

        if(val !== 'order_status' && val !== 'order_created') {
            $(this).closest('.rule-row').find('.conditions-wrapper').hide();
        } else {
            $(this).closest('.rule-row').find('.conditions-wrapper').show();
        }
    });

    $(document).on('click', '.add-condition-btn', function() {
        var ruleBox = $(this).closest('.rule-row');
        var r_idx = ruleBox.data('index');
        var c_idx = ruleBox.find('.condition-row').length;
        var tpl = wp.template('condition-row');
        ruleBox.find('.conditions-list').append(tpl({ rule_idx: r_idx, cond_idx: c_idx }));
    });

    $(document).on('click', '.remove-condition', function() {
        $(this).closest('.condition-row').remove();
    });

    $(document).on('click', '.add-action-btn', function() {
        var ruleBox = $(this).closest('.rule-row');
        var r_idx = ruleBox.data('index');
        var a_idx = ruleBox.find('.action-card').length;
        var tpl = wp.template('action-row');
        ruleBox.find('.actions-list').append(tpl({ rule_idx: r_idx, act_idx: a_idx }));
    });

    $(document).on('click', '.remove-action', function() {
        if(confirm('حذف شود؟')) {
            $(this).closest('.action-card').slideUp(300, function(){ $(this).remove(); });
        }
    });

    $(document).on('click', '.duplicate-action', function() {
        var card = $(this).closest('.action-card');
        var ruleBox = card.closest('.rule-row');
        var clone = card.clone();
        
        var a_idx = ruleBox.find('.action-card').length;
        
        clone.find('input, select, textarea').each(function() {
            var name = $(this).attr('name');
            if(name) {
                var newName = name.replace(/\[actions\]\[\d+\]/, '[actions][' + a_idx + ']');
                $(this).attr('name', newName);
            }
        });

        var originalSelects = card.find('select');
        clone.find('select').each(function(index) {
             $(this).val(originalSelects.eq(index).val());
        });

        ruleBox.find('.actions-list').append(clone);
    });

    $(document).on('change', '.action-type-select', function() {
        var wrap = $(this).closest('.flex-row').find('.action-conn-wrapper');
        if($(this).val() === 'email') { wrap.hide(); } else { wrap.show(); }
    });

    $('.trigger-selector').trigger('change');
    $('.action-type-select').trigger('change');
    
    $('.nav-tab-wrapper .nav-tab').on('click', function(e) {
        e.preventDefault();
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        $('.hub-tab-content').hide();
        $($(this).attr('href')).show();
    });
});