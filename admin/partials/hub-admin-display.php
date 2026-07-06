<?php
$webhooks = get_option( 'hub_webhooks', [] );
$rules    = get_option( 'hub_rules', [] );
$globals  = get_option( 'hub_global_status', ['n8n'=>1, 'sms'=>1, 'telegram'=>1] ); 
$wc_statuses = function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [];
$cf7_forms   = class_exists('Hub_Admin') ? (new Hub_Admin())->get_cf7_forms() : []; 
$auth_settings = wp_parse_args(get_option('hub_auth_settings', []), ['active'=>0, 'unified_login'=>0, 'redirect_url'=>'', 'rate_limit'=>120]);

$has_old_data = false;
if(!empty($rules)) {
    foreach($rules as $r) {
        if(!isset($r['actions'])) { $has_old_data = true; break; }
    }
}
?>
<script>
    var hub_webhooks_json = <?php echo json_encode($webhooks); ?>;
</script>

<div class="wrap hub-wrap">
    <h1 class="wp-heading-inline">⚙️ اتوماسیون هاب <small>(نسخه ۱.۱ داینامیک)</small></h1>
    <hr class="wp-header-end">
    
    <?php if($has_old_data): ?>
    <div class="notice notice-warning"><p><strong>توجه:</strong> نسخه جدید موتور سناریوها نصب شد و شما سناریوهایی با فرمت قدیمی دارید. لازم است سناریوهای جدید بسازید. به محض اولین کلیک روی «ذخیره تنظیمات»، سناریوهای قدیمیِ منقضی پاک خواهند شد.</p></div>
    <?php endif; ?>

    <form method="post" action="">
        <?php wp_nonce_field( 'hub_save_action', 'hub_nonce' ); ?>
        
        <h2 class="nav-tab-wrapper">
            <a href="#tab-dashboard" class="nav-tab nav-tab-active">داشبورد و سناریوها</a>
            <a href="#tab-connections" class="nav-tab">اتصالات</a>
        </h2>

        <div id="tab-dashboard" class="hub-tab-content">
            <div class="sajj-card global-toggles-card">
                <div class="sajj-header"><h3>وضعیت کانال‌ها (Global)</h3></div>
                <div class="flex-row" style="gap: 30px;">
                    <label class="toggle-switch"><input type="checkbox" name="global_n8n" value="1" <?php checked($globals['n8n']); ?>><span class="slider"></span> <strong>🌐 n8n</strong></label>
                    <label class="toggle-switch"><input type="checkbox" name="global_sms" value="1" <?php checked($globals['sms']); ?>><span class="slider"></span> <strong>💬 پیامک</strong></label>
                    <label class="toggle-switch"><input type="checkbox" name="global_telegram" value="1" <?php checked($globals['telegram']); ?>><span class="slider"></span> <strong>✈️ تلگرام</strong></label>
                </div>
            </div>

            <div class="sajj-header" style="margin-top:30px; border-bottom:2px solid #2271b1;">
                <h3>سناریوهای فعال</h3>
                <button type="button" class="button button-primary" id="add-rule-btn">➕ افزودن سناریو</button>
            </div>

            <div id="rules-container">
                <?php 
                if(!empty($rules)) {
                    foreach($rules as $r_idx => $rule) {
                        if(!isset($rule['actions'])) continue;
                        include plugin_dir_path(__FILE__) . 'tmpl-rule.php';
                    }
                }
                ?>
            </div>
        </div>

        <div id="tab-connections" class="hub-tab-content" style="display:none;">
            <div class="sajj-card">
                 <div class="sajj-header"><h2>مدیریت کانال‌ها (Webhooks & SMS & Bots)</h2><button type="button" class="button" id="add-webhook-btn">➕ افزودن کانال</button></div>
                <div id="webhooks-container">
                    <?php 
                    if ( empty( $webhooks ) ) { $webhooks = [ [] ]; }
                    foreach ( $webhooks as $wh ): $t = $wh['type'] ?? 'webhook';
                    ?>
                    <div class="sajj-card webhook-row">
                        <span class="dashicons dashicons-trash remove-row" title="حذف"></span>
                        <div class="flex-row">
                            <select name="webhook_type[]" class="conn-type-selector">
                                <option value="webhook" <?php selected($t, 'webhook'); ?>>n8n / Webhook</option>
                                <option value="sms" <?php selected($t, 'sms'); selected($t, 'melipayamak'); ?>>پنل پیامک</option>
                                <option value="telegram" <?php selected($t, 'telegram'); ?>>ربات تلگرام</option>
                            </select>
                            <input type="text" name="webhook_name[]" value="<?php echo esc_attr($wh['name']??''); ?>" placeholder="نام مستعار" style="width:200px">
                        </div>
                        <div class="conn-fields field-webhook field-telegram" style="<?php echo ($t === 'sms' || $t === 'melipayamak') ? 'display:none' : ''; ?>">
                            <input type="text" name="webhook_url[]" value="<?php echo esc_attr($wh['url']??''); ?>" placeholder="URL یا Token" class="full-width" style="direction:ltr;">
                        </div>
                        <div class="conn-fields field-sms" style="<?php echo ($t !== 'sms' && $t !== 'melipayamak') ? 'display:none' : ''; ?>">
                            <div class="flex-row">
                                <input type="text" name="sms_user[]" value="<?php echo esc_attr($wh['sms_user']??''); ?>" placeholder="نام کاربری">
                                <input type="text" name="sms_pass[]" value="<?php echo esc_attr($wh['sms_pass']??''); ?>" placeholder="رمز عبور">
                                <input type="text" name="sms_from[]" value="<?php echo esc_attr($wh['sms_from']??''); ?>" placeholder="شماره فرستنده">
                            </div>
                        </div>
                        <div style="margin-top:10px;">
                            <button type="button" class="button button-secondary button-small test-connection-btn">تست اتصال ⚡</button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
             <div class="sajj-card" style="margin-top:20px;">
                <label><strong>پروکسی تلگرام:</strong></label>
                <input type="text" name="telegram_proxy" value="<?php echo esc_attr(get_option('hub_telegram_proxy')); ?>" class="regular-text full-width" placeholder="ip:port">
            </div>
        </div>

        <hr>
        <p class="submit"><input type="submit" name="hub_save_settings" class="button button-primary button-hero" value="ذخیره تنظیمات"></p>
    </form>
</div>

<script type="text/html" id="tmpl-rule-container">
    <div class="sajj-card rule-row" data-index="{{data.rule_idx}}">
        <div class="sajj-header">
            <h3 style="margin:0">سناریو شماره {{data.rule_idx + 1}}</h3>
            <span class="dashicons dashicons-trash remove-rule" title="حذف سناریو"></span>
        </div>
        <div class="flex-row" style="margin-bottom:15px;">
            <div style="flex: 1;"><label>نام سناریو:</label><input type="text" name="rules[{{data.rule_idx}}][name]" class="full-width" placeholder="مثلا پیامک مدیر"></div>
            <div style="flex: 1;">
                <label>نوع تریگر:</label>
                <select name="rules[{{data.rule_idx}}][trigger]" class="full-width trigger-selector">
                    <option value="order_status">تغییر وضعیت سفارش (WooCommerce)</option>
                    <option value="order_created">سفارش جدید (ایجاد شده)</option>
                    <option value="cf7_submit">ثبت فرم تماس (CF7)</option>
                </select>
            </div>
            <div style="flex: 1;" class="trigger-meta-box">
                <div class="trigger-meta meta-order_status">
                    <label>اگر وضعیت شد:</label>
                    <select name="rules[{{data.rule_idx}}][sub_trigger]" class="full-width">
                        <option value="">-- همه وضعیت‌ها --</option>
                        <?php foreach($wc_statuses as $k=>$v): ?>
                            <option value="<?php echo str_replace('wc-', '', $k); ?>"><?php echo $v; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="trigger-meta meta-cf7_submit" style="display:none;">
                    <label>انتخاب فرم:</label>
                    <select name="rules[{{data.rule_idx}}][cf7_form_id]" class="full-width">
                        <option value="">-- همه فرم‌ها --</option>
                        <?php foreach($cf7_forms as $id=>$title): ?>
                            <option value="<?php echo $id; ?>"><?php echo $title; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="conditions-wrapper" style="background:#f9f9f9; padding:15px; border-radius:5px; margin-bottom:15px; border:1px solid #eee;">
            <strong>شرط‌های اجرا:</strong>
            <select name="rules[{{data.rule_idx}}][match_type]" style="margin-right:10px;"><option value="all">همه برقرار باشد (AND)</option><option value="any">حداقل یکی برقرار باشد (OR)</option></select>
            <div class="conditions-list" style="margin-top:10px;"></div>
            <button type="button" class="button button-small add-condition-btn" style="margin-top:10px;">+ افزودن شرط</button>
        </div>

        <div class="actions-wrapper">
            <div class="sajj-header" style="border-bottom:1px dashed #ccc; margin-bottom:10px; padding-bottom:5px;">
                <strong>اکشن‌های اجرایی:</strong>
                <button type="button" class="button button-small add-action-btn">+ اکشن جدید</button>
            </div>
            <div class="actions-list"></div>
        </div>
    </div>
</script>

<script type="text/html" id="tmpl-condition-row">
    <div class="condition-row flex-row" style="margin-bottom:8px; align-items:center;">
        <select name="rules[{{data.rule_idx}}][conditions][{{data.cond_idx}}][field]" style="flex:1;">
            <option value="total">جمع مبلغ سفارش</option>
            <option value="billing_city">شهر صورت‌حساب</option>
            <option value="status">وضعیت سفارش</option>
            <option value="user_role">نقش کاربر</option>
        </select>
        <select name="rules[{{data.rule_idx}}][conditions][{{data.cond_idx}}][operator]">
            <option value="==">برابر با</option>
            <option value="!=">مخالف با</option>
            <option value=">">بزرگتر از (مبلغ)</option>
            <option value="<">کوچکتر از (مبلغ)</option>
            <option value="contains">شامل کلمه</option>
        </select>
        <input type="text" name="rules[{{data.rule_idx}}][conditions][{{data.cond_idx}}][value]" placeholder="مقدار..." style="flex:1;">
        <span class="dashicons dashicons-trash remove-condition" style="cursor:pointer; color:#d63638;"></span>
    </div>
</script>

<script type="text/html" id="tmpl-action-row">
    <div class="action-card sajj-card" style="margin-bottom:15px; border-right:3px solid #2271b1; position:relative;">
        <div class="action-actions" style="position:absolute; top:10px; left:10px; display:flex; gap:5px;">
            <label class="toggle-switch"><input type="checkbox" name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][enabled]" checked><span class="slider"></span></label>
            <span class="dashicons dashicons-admin-page duplicate-action" title="تکثیر" style="cursor:pointer; color:#555;"></span>
            <span class="dashicons dashicons-trash remove-action" title="حذف" style="cursor:pointer; color:#d63638;"></span>
        </div>
        
        <div class="flex-row" style="margin-bottom:10px;">
            <div style="flex:1;">
                <label>نوع رسانه:</label>
                <select name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][type]" class="full-width action-type-select">
                    <option value="sms">پیامک</option>
                    <option value="telegram">تلگرام</option>
                    <option value="webhook">Webhook / n8n</option>
                    <option value="email">ایمیل</option>
                </select>
            </div>
            <div class="action-conn-wrapper" style="flex:1;">
                <label>اتصال مبدا:</label>
                <select name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][connection_id]" class="full-width">
                    <option value="">-- انتخاب --</option>
                    <?php foreach($webhooks as $wh): ?><option value="<?php echo $wh['id']; ?>"><?php echo $wh['name']; ?> (<?php echo $wh['type']; ?>)</option><?php endforeach; ?>
                </select>
            </div>
            <div style="flex:1;">
                <label>گیرنده هدف:</label>
                <input type="text" name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][target]" class="full-width" placeholder="{phone} یا 0912..">
            </div>
        </div>

        <div class="flex-row" style="margin-bottom:10px; background:#f0f2f5; padding:8px; border-radius:4px;">
            <label style="margin-top:6px;">زمان اجرا:</label>
            <input type="number" name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][delay_value]" value="0" style="width:60px;">
            <select name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][delay_unit]">
                <option value="immediate">آنی (بلافاصله)</option>
                <option value="minutes">دقیقه بعد</option>
                <option value="hours">ساعت بعد</option>
                <option value="days">روز بعد</option>
            </select>
            <small style="color:#666; margin-right:15px; margin-top:5px;">(صفر به معنی آنی است)</small>
        </div>

        <label>متن پیام / Payload:</label>
        <textarea name="rules[{{data.rule_idx}}][actions][{{data.act_idx}}][message]" class="full-width" rows="3" placeholder="متن با پشتیبانی از {order_id} و ..."></textarea>
    </div>
</script>