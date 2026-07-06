<?php
// admin/partials/tmpl-rule.php
$trigger = $rule['trigger'] ?? 'order_status';
$rule_name = $rule['name'] ?? '';
$match_type = $rule['match_type'] ?? 'all';
?>
<div class="sajj-card rule-row" data-index="<?php echo $r_idx; ?>">
    <div class="sajj-header">
        <h3 style="margin:0">سناریو شماره <?php echo $r_idx + 1; ?></h3>
        <span class="dashicons dashicons-trash remove-rule" title="حذف سناریو"></span>
    </div>
    
    <div class="flex-row" style="margin-bottom:15px;">
        <div style="flex: 1;">
            <label>نام سناریو:</label>
            <input type="text" name="rules[<?php echo $r_idx; ?>][name]" value="<?php echo esc_attr($rule_name); ?>" class="full-width">
        </div>
        <div style="flex: 1;">
            <label>نوع تریگر:</label>
            <select name="rules[<?php echo $r_idx; ?>][trigger]" class="full-width trigger-selector">
                <option value="order_status" <?php selected($trigger, 'order_status'); ?>>تغییر وضعیت سفارش</option>
                <option value="order_created" <?php selected($trigger, 'order_created'); ?>>سفارش جدید</option>
                <option value="cf7_submit" <?php selected($trigger, 'cf7_submit'); ?>>ثبت فرم تماس</option>
            </select>
        </div>
        
        <div style="flex: 1;" class="trigger-meta-box">
            <div class="trigger-meta meta-order_status" style="<?php echo ($trigger !== 'order_status') ? 'display:none' : ''; ?>">
                <label>اگر وضعیت شد:</label>
                <select name="rules[<?php echo $r_idx; ?>][sub_trigger]" class="full-width">
                    <option value="">-- همه وضعیت‌ها --</option>
                    <?php foreach($wc_statuses as $k=>$v): ?>
                        <option value="<?php echo str_replace('wc-', '', $k); ?>" <?php selected(($rule['sub_trigger']??''), str_replace('wc-', '', $k)); ?>><?php echo $v; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="trigger-meta meta-cf7_submit" style="<?php echo ($trigger !== 'cf7_submit') ? 'display:none' : ''; ?>">
                <label>انتخاب فرم:</label>
                <select name="rules[<?php echo $r_idx; ?>][cf7_form_id]" class="full-width">
                    <option value="">-- همه فرم‌ها --</option>
                    <?php foreach($cf7_forms as $id=>$title): ?>
                        <option value="<?php echo $id; ?>" <?php selected(($rule['cf7_form_id']??''), $id); ?>><?php echo $title; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
    </div>

    <div class="conditions-wrapper" style="background:#f9f9f9; padding:15px; border-radius:5px; margin-bottom:15px; border:1px solid #eee;">
        <strong>شرط‌های اجرا:</strong>
        <select name="rules[<?php echo $r_idx; ?>][match_type]"><option value="all" <?php selected($match_type, 'all'); ?>>AND</option><option value="any" <?php selected($match_type, 'any'); ?>>OR</option></select>
        <div class="conditions-list" style="margin-top:10px;">
            <?php 
            if(isset($rule['conditions']) && is_array($rule['conditions'])):
                foreach($rule['conditions'] as $c_idx => $cond): ?>
                <div class="condition-row flex-row" style="margin-bottom:8px; align-items:center;">
                    <select name="rules[<?php echo $r_idx; ?>][conditions][<?php echo $c_idx; ?>][field]" style="flex:1;">
                        <option value="total" <?php selected($cond['field'], 'total'); ?>>جمع مبلغ سفارش</option>
                        <option value="billing_city" <?php selected($cond['field'], 'billing_city'); ?>>شهر صورت‌حساب</option>
                        <option value="status" <?php selected($cond['field'], 'status'); ?>>وضعیت سفارش</option>
                        <option value="user_role" <?php selected($cond['field'], 'user_role'); ?>>نقش کاربر</option>
                    </select>
                    <select name="rules[<?php echo $r_idx; ?>][conditions][<?php echo $c_idx; ?>][operator]">
                        <option value="==" <?php selected($cond['operator'], '=='); ?>>برابر با</option>
                        <option value="!=" <?php selected($cond['operator'], '!='); ?>>مخالف با</option>
                        <option value=">" <?php selected($cond['operator'], '>'); ?>>بزرگتر از</option>
                        <option value="<" <?php selected($cond['operator'], '<'); ?>>کوچکتر از</option>
                        <option value="contains" <?php selected($cond['operator'], 'contains'); ?>>شامل کلمه</option>
                    </select>
                    <input type="text" name="rules[<?php echo $r_idx; ?>][conditions][<?php echo $c_idx; ?>][value]" value="<?php echo esc_attr($cond['value']); ?>" style="flex:1;">
                    <span class="dashicons dashicons-trash remove-condition" style="cursor:pointer; color:#d63638;"></span>
                </div>
            <?php endforeach; endif; ?>
        </div>
        <button type="button" class="button button-small add-condition-btn" style="margin-top:10px;">+ افزودن شرط</button>
    </div>

    <div class="actions-wrapper">
        <div class="sajj-header" style="border-bottom:1px dashed #ccc; margin-bottom:10px; padding-bottom:5px;">
            <strong>اکشن‌های اجرایی:</strong>
            <button type="button" class="button button-small add-action-btn">+ اکشن جدید</button>
        </div>
        <div class="actions-list">
            <?php foreach($rule['actions'] as $a_idx => $act): ?>
                <div class="action-card sajj-card" style="margin-bottom:15px; border-right:3px solid #2271b1; position:relative;">
                    <div class="action-actions" style="position:absolute; top:10px; left:10px; display:flex; gap:5px;">
                        <label class="toggle-switch"><input type="checkbox" name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][enabled]" <?php checked(!empty($act['enabled'])); ?>><span class="slider"></span></label>
                        <span class="dashicons dashicons-admin-page duplicate-action" title="تکثیر" style="cursor:pointer; color:#555;"></span>
                        <span class="dashicons dashicons-trash remove-action" title="حذف" style="cursor:pointer; color:#d63638;"></span>
                    </div>
                    
                    <div class="flex-row" style="margin-bottom:10px;">
                        <div style="flex:1;">
                            <label>نوع رسانه:</label>
                            <select name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][type]" class="full-width action-type-select">
                                <option value="sms" <?php selected($act['type'], 'sms'); ?>>پیامک</option>
                                <option value="telegram" <?php selected($act['type'], 'telegram'); ?>>تلگرام</option>
                                <option value="webhook" <?php selected($act['type'], 'webhook'); ?>>Webhook</option>
                                <option value="email" <?php selected($act['type'], 'email'); ?>>ایمیل</option>
                            </select>
                        </div>
                        <div class="action-conn-wrapper" style="flex:1; <?php echo ($act['type']=='email')?'display:none;':''; ?>">
                            <label>اتصال مبدا:</label>
                            <select name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][connection_id]" class="full-width">
                                <option value="">-- انتخاب --</option>
                                <?php foreach($webhooks as $wh): ?>
                                    <option value="<?php echo $wh['id']; ?>" <?php selected($act['connection_id'], $wh['id']); ?>><?php echo $wh['name']; ?> (<?php echo $wh['type']; ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label>گیرنده هدف:</label>
                            <input type="text" name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][target]" value="<?php echo esc_attr($act['target']??''); ?>" class="full-width" placeholder="{phone}">
                        </div>
                    </div>
                    <div class="flex-row" style="margin-bottom:10px; background:#f0f2f5; padding:8px; border-radius:4px;">
                        <label style="margin-top:6px;">زمان اجرا:</label>
                        <input type="number" name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][delay_value]" value="<?php echo esc_attr($act['delay_value']??'0'); ?>" style="width:60px;">
                        <select name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][delay_unit]">
                            <option value="immediate" <?php selected($act['delay_unit'], 'immediate'); ?>>آنی (بلافاصله)</option>
                            <option value="minutes" <?php selected($act['delay_unit'], 'minutes'); ?>>دقیقه بعد</option>
                            <option value="hours" <?php selected($act['delay_unit'], 'hours'); ?>>ساعت بعد</option>
                            <option value="days" <?php selected($act['delay_unit'], 'days'); ?>>روز بعد</option>
                        </select>
                    </div>
                    <label>متن پیام:</label>
                    <textarea name="rules[<?php echo $r_idx; ?>][actions][<?php echo $a_idx; ?>][message]" class="full-width" rows="3"><?php echo esc_textarea($act['message']??''); ?></textarea>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>