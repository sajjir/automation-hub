<?php
// اطمینان از اینکه متغیرهای سراسری در دسترس هستند
$webhooks = get_option( 'hub_webhooks', [] );
$rules    = get_option( 'hub_rules', [] );
$globals  = get_option( 'hub_global_status', ['n8n'=>1, 'sms'=>1, 'telegram'=>1] ); 
$wc_statuses = function_exists('wc_get_order_statuses') ? wc_get_order_statuses() : [];
$cf7_forms   = $this->get_cf7_forms(); 
$auth_settings = wp_parse_args(get_option('hub_auth_settings', []), ['active'=>0, 'unified_login'=>0, 'redirect_url'=>'', 'rate_limit'=>120]);
?>

<script>
    var hub_webhooks_json = <?php echo json_encode($webhooks); ?>;
</script>

<div class="wrap hub-wrap">
    <h1 class="wp-heading-inline">⚙️ اتوماسیون هاب <small>(نسخه ۱.۲)</small></h1>
    <hr class="wp-header-end">
    
    <form method="post" action="">
        <?php wp_nonce_field( 'hub_save_action', 'hub_nonce' ); ?>
        
        <h2 class="nav-tab-wrapper">
            <a href="#tab-dashboard" class="nav-tab nav-tab-active">داشبورد و سناریوها</a>
            <a href="#tab-connections" class="nav-tab">اتصالات</a>
            <a href="#tab-auth" class="nav-tab">تنظیمات ورود</a>
            <a href="#tab-logs" class="nav-tab">لاگ‌ها</a>
        </h2>

        <div id="tab-dashboard" class="hub-tab-content">
            
            <div class="sajj-card global-toggles-card">
                <div class="sajj-header">
                    <h3>وضعیت کانال‌ها (Global)</h3>
                </div>
                <div class="flex-row" style="gap: 30px;">
                    <label class="toggle-switch">
                        <input type="checkbox" name="global_n8n" id="global_n8n" value="1" <?php checked($globals['n8n']); ?>>
                        <span class="slider"></span> <strong>🌐 n8n</strong>
                    </label>
                    <label class="toggle-switch">
                        <input type="checkbox" name="global_sms" id="global_sms" value="1" <?php checked($globals['sms']); ?>>
                        <span class="slider"></span> <strong>💬 پیامک</strong>
                    </label>
                    <label class="toggle-switch">
                        <input type="checkbox" name="global_telegram" id="global_telegram" value="1" <?php checked($globals['telegram']); ?>>
                        <span class="slider"></span> <strong>✈️ تلگرام</strong>
                    </label>
                </div>
            </div>

            <div class="sajj-header" style="margin-top:30px; border-bottom:2px solid #2271b1;">
                <h3>سناریوهای فعال</h3>
                <button type="button" class="button button-primary" id="add-rule-btn">➕ افزودن سناریو</button>
            </div>

            <div id="rules-container">
                <?php 
                if ( empty( $rules ) ) { $rules = [ [] ]; }
                foreach ( $rules as $i => $rule ): 
                    $trigger = $rule['trigger'] ?? 'order_status';
                ?>
                <div class="sajj-card rule-row" data-index="<?php echo $i; ?>">
                    <div class="sajj-header">
                        <h3 style="margin:0">سناریو شماره <?php echo $i + 1; ?></h3>
                        <span class="dashicons dashicons-trash remove-row" title="حذف سناریو"></span>
                    </div>
                    
                    <div class="flex-row">
                        <div style="flex: 1; min-width: 250px;">
                            <label>نام سناریو:</label>
                            <input type="text" name="rule_name[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['name'] ?? ''); ?>" class="full-width" placeholder="عنوان یادداشت...">
                        </div>
                        <div style="flex: 1; min-width: 250px;">
                            <label>نوع تریگر:</label>
                            <select name="rule_trigger[<?php echo $i; ?>]" class="full-width trigger-selector">
                                <option value="order_status" <?php selected($trigger, 'order_status'); ?>>تغییر وضعیت سفارش (WooCommerce)</option>
                                <option value="order_created" <?php selected($trigger, 'order_created'); ?>>سفارش جدید (ایجاد شده)</option>
                                <option value="cf7_submit" <?php selected($trigger, 'cf7_submit'); ?>>ثبت فرم تماس (CF7)</option>
                                <option value="auth_request" <?php selected($trigger, 'auth_request'); ?>>درخواست ورود (OTP)</option>
                                <option value="user_register" <?php selected($trigger, 'user_register'); ?>>ثبت نام کاربر جدید</option>
                            </select>
                        </div>
                        
                        <div style="flex: 1; min-width: 250px;" class="trigger-conditions">
                            <div class="condition-box cond-order_status" style="<?php echo ($trigger !== 'order_status') ? 'display:none' : ''; ?>">
                                <label>اگر وضعیت شد:</label>
                                <select name="rule_sub_trigger[<?php echo $i; ?>]" class="full-width">
                                    <option value="">-- همه وضعیت‌ها --</option>
                                    <?php foreach($wc_statuses as $k=>$v): ?>
                                        <option value="<?php echo str_replace('wc-', '', $k); ?>" <?php selected(($rule['sub_trigger']??''), str_replace('wc-', '', $k)); ?>><?php echo $v; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="condition-box cond-cf7_submit" style="<?php echo ($trigger !== 'cf7_submit') ? 'display:none' : ''; ?>">
                                <label>انتخاب فرم:</label>
                                <select name="rule_cf7_form_id[<?php echo $i; ?>]" class="full-width">
                                    <option value="">-- همه فرم‌ها --</option>
                                    <?php foreach($cf7_forms as $id=>$title): ?>
                                        <option value="<?php echo $id; ?>" <?php selected(($rule['cf7_form_id']??''), $id); ?>><?php echo $title; ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <input type="text" name="rule_cf7_mobile_field[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['cf7_mobile_field'] ?? ''); ?>" placeholder="نام فیلد موبایل (مثلا: your-phone)" class="full-width" style="margin-top:5px; font-size:12px;">
                            </div>
                        </div>
                    </div>

                    <h2 class="nav-tab-wrapper rule-tabs">
                        <a href="#" class="nav-tab nav-tab-active tab-link-n8n" data-target="tab-n8n">🌐 n8n</a>
                        <a href="#" class="nav-tab tab-link-sms" data-target="tab-sms">💬 پیامک</a>
                        <a href="#" class="nav-tab tab-link-tg" data-target="tab-tg">✈️ تلگرام</a>
                    </h2>

                    <div class="tab-content tab-n8n">
                        <label><input type="checkbox" name="rule_active_n8n[<?php echo $i; ?>]" value="1" <?php checked(isset($rule['active_n8n'])); ?>> فعال‌سازی ارسال به n8n</label>
                        <select name="rule_webhook_id[<?php echo $i; ?>]" class="full-width rule-conn-select" style="margin-top:10px;">
                            <option value="">-- انتخاب کانال n8n --</option>
                            <?php foreach($webhooks as $wh): if($wh['type']!='webhook') continue; ?>
                                <option value="<?php echo $wh['id']; ?>" <?php selected(($rule['webhook_id']??''), $wh['id']); ?>><?php echo $wh['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                        <textarea name="rule_message_n8n[<?php echo $i; ?>]" rows="2" class="full-width rule-msg-input" placeholder="پیام ضمیمه (اختیاری)" style="margin-top:5px;"><?php echo esc_textarea($rule['message_n8n']??''); ?></textarea>
                        <div style="margin-top:8px; text-align:left;">
                            <button type="button" class="button button-secondary button-small test-rule-btn" data-type="webhook">تست آنی ⚡</button>
                        </div>
                    </div>

                    <div class="tab-content tab-sms" style="display:none;">
                        <label><input type="checkbox" name="rule_active_sms[<?php echo $i; ?>]" value="1" <?php checked(isset($rule['active_sms'])); ?>> فعال‌سازی پیامک</label>
                        <div class="flex-row" style="margin-top:10px;">
                            <select name="rule_sms_provider_id[<?php echo $i; ?>]" class="rule-conn-select">
                                <option value="">-- سامانه پیامک --</option>
                                <?php foreach($webhooks as $wh): if($wh['type']!='sms' && $wh['type']!='melipayamak') continue; ?>
                                    <option value="<?php echo $wh['id']; ?>" <?php selected(($rule['sms_provider_id']??''), $wh['id']); ?>><?php echo $wh['name']; ?></option>
                                <?php endforeach; ?>
                            </select>
                            <select name="rule_sms_target[<?php echo $i; ?>]">
                                <option value="customer" <?php selected(($rule['sms_target']??''), 'customer'); ?>>مشتری (خودکار)</option>
                                <option value="custom" <?php selected(($rule['sms_target']??''), 'custom'); ?>>شماره خاص</option>
                            </select>
                            <input type="text" name="rule_sms_custom_num[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['sms_custom_num']??''); ?>" placeholder="شماره مدیر (اگر انتخاب شد)">
                        </div>
                        <textarea name="rule_message_sms[<?php echo $i; ?>]" rows="3" class="full-width rule-msg-input" placeholder="متن پیامک..."><?php echo esc_textarea($rule['message_sms']??''); ?></textarea>
                        <div style="margin-top:8px; text-align:left;">
                            <button type="button" class="button button-secondary button-small test-rule-btn" data-type="sms">تست آنی ⚡</button>
                        </div>
                    </div>

                    <div class="tab-content tab-tg" style="display:none;">
                        <label><input type="checkbox" name="rule_active_tg[<?php echo $i; ?>]" value="1" <?php checked(isset($rule['active_tg'])); ?>> فعال‌سازی تلگرام</label>
                        <div class="flex-row" style="margin-top:10px;">
                            <select name="rule_tg_bot_id[<?php echo $i; ?>]" class="rule-conn-select">
                                <option value="">-- ربات --</option>
                                <?php foreach($webhooks as $wh): if($wh['type']!='telegram') continue; ?>
                                    <option value="<?php echo $wh['id']; ?>" <?php selected(($rule['tg_bot_id']??''), $wh['id']); ?>><?php echo $wh['name']; ?></option>
                                <?php endforeach; ?>
                            </select>
                            <input type="text" name="rule_tg_chat_id[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['tg_chat_id']??''); ?>" placeholder="Chat ID گیرنده">
                        </div>
                        <textarea name="rule_message_tg[<?php echo $i; ?>]" rows="3" class="full-width rule-msg-input" placeholder="پیام تلگرام..."><?php echo esc_textarea($rule['message_tg']??''); ?></textarea>
                        <div style="margin-top:8px; text-align:left;">
                            <button type="button" class="button button-secondary button-small test-rule-btn" data-type="telegram">تست آنی ⚡</button>
                        </div>
                    </div>

                    <div class="variables-wrapper">
                        <strong style="display:block; margin-bottom:5px; font-size:12px;">📌 متغیرهای قابل استفاده (کلیک کنید):</strong>
                        
                        <div class="var-list guide-cf7_submit" style="<?php echo ($trigger !== 'cf7_submit') ? 'display:none' : ''; ?>">
                            <span class="var-tag" data-insert="{field:your-name}">فیلد دلخواه: {field:name}</span>
                            <span class="var-tag" data-insert="{form_title}">نام فرم</span>
                            <span class="var-tag" data-insert="{form_id}">شناسه فرم</span>
                            <span class="var-tag" data-insert="[_date]">تاریخ</span>
                            <span class="var-tag" data-insert="[_remote_ip]">IP</span>
                        </div>

                        <div class="var-list guide-order_status guide-order_created" style="<?php echo (strpos($trigger, 'order') === false) ? 'display:none' : ''; ?>">
                            <span class="var-tag" data-insert="{order_id}">شماره سفارش</span>
                            <span class="var-tag" data-insert="{status}">وضعیت</span>
                            <span class="var-tag" data-insert="{total}">مبلغ</span>
                            <span class="var-tag" data-insert="{full_name}">نام مشتری</span>
                            <span class="var-tag" data-insert="{phone}">موبایل</span>
                            <span class="var-tag" data-insert="{items_summary}">اقلام</span>
                        </div>
                        
                         <div class="var-list guide-auth_request" style="<?php echo ($trigger !== 'auth_request') ? 'display:none' : ''; ?>">
                            <span class="var-tag" data-insert="{otp}">کد تایید</span>
                            <span class="var-tag" data-insert="{phone}">شماره موبایل</span>
                        </div>
                    </div>
                    
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <div id="tab-connections" class="hub-tab-content" style="display:none;">
            <div class="sajj-card">
                 <div class="sajj-header">
                    <h2>مدیریت کانال‌ها (Webhooks & SMS & Bots)</h2>
                    <button type="button" class="button" id="add-webhook-btn">➕ افزودن کانال</button>
                </div>
                <div id="webhooks-container">
                    <?php 
                    if ( empty( $webhooks ) ) { $webhooks = [ [] ]; }
                    foreach ( $webhooks as $wh ): 
                        $t = $wh['type'] ?? 'webhook';
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
                            <button type="button" class="button button-secondary test-connection-btn">تست اتصال ⚡</button>
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
        
        <div id="tab-auth" class="hub-tab-content" style="display:none;">
            <div class="sajj-card">
                <div class="sajj-header"><h3>🔐 تنظیمات سیستم ورود (OTP)</h3></div>
                <table class="form-table">
                    <tr>
                        <th>وضعیت سیستم</th>
                        <td><label><input type="checkbox" name="hub_auth_active" value="1" <?php checked($auth_settings['active']); ?>> فعال‌سازی</label></td>
                    </tr>
                    <tr>
                        <th>یکپارچه‌سازی ووکامرس</th>
                        <td><label><input type="checkbox" name="hub_auth_unified" value="1" <?php checked($auth_settings['unified_login']); ?>> جایگزینی فرم‌های پیش‌فرض</label></td>
                    </tr>
                    <tr>
                        <th>محدودیت ارسال (ثانیه)</th>
                        <td><input type="number" name="hub_auth_rate_limit" value="<?php echo esc_attr($auth_settings['rate_limit']); ?>" class="small-text"></td>
                    </tr>
                </table>
            </div>
        </div>

        <div id="tab-logs" class="hub-tab-content" style="display:none;">
            <div class="sajj-card">
                <h3>آخرین لاگ‌های سیستم</h3>
                <textarea readonly style="width:100%; height:400px; direction:ltr; font-family:monospace; font-size:11px;"><?php 
                    $log_file = WP_CONTENT_DIR . '/uploads/hub-debug.log';
                    if(file_exists($log_file)) {
                        $lines = file($log_file);
                        echo implode("", array_slice($lines, -50));
                    } else { echo "هنوز لاگی ثبت نشده است."; }
                ?></textarea>
            </div>
        </div>

        <hr>
        <p class="submit"><input type="submit" name="hub_save_settings" class="button button-primary button-hero" value="ذخیره تنظیمات"></p>
    </form>
</div>