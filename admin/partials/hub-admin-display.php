<div class="wrap hub-wrap">
    <h1 class="wp-heading-inline">⚙️ اتوماسیون هاب <small style="font-size:12px; color:#666;">(نسخه حرفه‌ای)</small></h1>
    <hr class="wp-header-end">
    
    <form method="post" action="">
        <?php wp_nonce_field( 'hub_save_action', 'hub_nonce' ); ?>
        
        <h2 class="nav-tab-wrapper">
            <a href="#tab-dashboard" class="nav-tab nav-tab-active">داشبورد و سناریوها</a>
            <a href="#tab-connections" class="nav-tab">اتصالات (Connections)</a>
            <a href="#tab-auth" class="nav-tab">تنظیمات ورود (Auth)</a>
            <a href="#tab-logs" class="nav-tab">لاگ‌ها</a>
        </h2>

        <div id="tab-dashboard" class="hub-tab-content">
            
            <div class="sajj-card global-toggles-card" style="margin-bottom: 20px;">
                <div class="sajj-header" style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:15px;">
                    <h3 style="margin:0;">وضعیت جهانی کانال‌های ارتباطی</h3>
                    <span class="description">خاموش کردن هر کانال، آن را در تمام سناریوها غیرفعال می‌کند.</span>
                </div>
                <div class="flex-row" style="gap: 30px; align-items: center;">
                    <label class="toggle-switch">
                        <input type="checkbox" name="global_n8n" id="global_n8n" value="1" <?php checked($globals['n8n']); ?>>
                        <span class="slider"></span>
                        <strong style="margin-right:8px;">🌐 n8n (وب‌هوک)</strong>
                    </label>
                    <label class="toggle-switch">
                        <input type="checkbox" name="global_sms" id="global_sms" value="1" <?php checked($globals['sms']); ?>>
                        <span class="slider"></span>
                        <strong style="margin-right:8px;">💬 پیامک (SMS)</strong>
                    </label>
                    <label class="toggle-switch">
                        <input type="checkbox" name="global_telegram" id="global_telegram" value="1" <?php checked($globals['telegram']); ?>>
                        <span class="slider"></span>
                        <strong style="margin-right:8px;">✈️ تلگرام</strong>
                    </label>
                </div>
            </div>

            <div class="hub-card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>سناریوهای فعال</h3>
                <button type="button" class="button button-primary" id="add-rule-btn">+ سناریوی جدید</button>
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
                        <div style="flex: 1;">
                            <label>نام سناریو:</label>
                            <input type="text" name="rule_name[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['name'] ?? ''); ?>" class="full-width" placeholder="مثلا: پیامک تشکر خرید">
                        </div>
                        <div style="flex: 1;">
                            <label>نوع تریگر (Trigger):</label>
                            <select name="rule_trigger[<?php echo $i; ?>]" class="full-width trigger-selector">
                                <option value="order_status" <?php selected($trigger, 'order_status'); ?>>تغییر وضعیت سفارش (WooCommerce)</option>
                                <option value="order_created" <?php selected($trigger, 'order_created'); ?>>سفارش جدید (ایجاد شده)</option>
                                <option value="cf7_submit" <?php selected($trigger, 'cf7_submit'); ?>>ثبت فرم تماس (CF7)</option>
                                <option value="auth_request" <?php selected($trigger, 'auth_request'); ?>>درخواست ورود (OTP)</option>
                                <option value="user_register" <?php selected($trigger, 'user_register'); ?>>ثبت نام کاربر جدید</option>
                            </select>
                        </div>
                        
                        <div style="flex: 1;" class="trigger-conditions">
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
                                <input type="text" name="rule_cf7_mobile_field[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['cf7_mobile_field'] ?? ''); ?>" placeholder="نام فیلد موبایل (مثلا: your-phone)" class="full-width" style="margin-top:5px; font-size:12px; border-color:#ddd;">
                            </div>
                        </div>
                    </div>

                    <h2 class="nav-tab-wrapper rule-tabs" style="margin-top:15px; margin-bottom:15px; border-bottom:1px solid #ddd;">
                        <a href="#" class="nav-tab nav-tab-active tab-link-n8n" data-target="tab-n8n">n8n (وب‌هوک)</a>
                        <a href="#" class="nav-tab tab-link-sms" data-target="tab-sms">پیامک (SMS)</a>
                        <a href="#" class="nav-tab tab-link-tg" data-target="tab-tg">تلگرام</a>
                    </h2>

                    <div class="tab-content tab-n8n">
                        <label><input type="checkbox" name="rule_active_n8n[<?php echo $i; ?>]" value="1" <?php checked(isset($rule['active_n8n'])); ?>> فعال‌سازی ارسال به n8n</label>
                        <select name="rule_webhook_id[<?php echo $i; ?>]" class="full-width" style="margin-top:10px;">
                            <option value="">-- انتخاب کانال n8n --</option>
                            <?php foreach($webhooks as $wh): if($wh['type']!='webhook') continue; ?>
                                <option value="<?php echo $wh['id']; ?>" <?php selected(($rule['webhook_id']??''), $wh['id']); ?>><?php echo $wh['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                        <textarea name="rule_message_n8n[<?php echo $i; ?>]" rows="2" class="full-width" placeholder="پیام ضمیمه (اختیاری) - از تگ‌های پایین استفاده کنید" style="margin-top:5px;"><?php echo esc_textarea($rule['message_n8n']??''); ?></textarea>
                        <button type="button" class="button button-small test-action-btn" data-type="webhook" style="margin-top:8px;">تست آنی ⚡</button>
                    </div>

                    <div class="tab-content tab-sms" style="display:none;">
                        <label><input type="checkbox" name="rule_active_sms[<?php echo $i; ?>]" value="1" <?php checked(isset($rule['active_sms'])); ?>> فعال‌سازی پیامک</label>
                        <div class="flex-row" style="margin-top:10px;">
                            <select name="rule_sms_provider_id[<?php echo $i; ?>]">
                                <option value="">-- انتخاب سامانه --</option>
                                <?php foreach($webhooks as $wh): if($wh['type']!='sms') continue; ?>
                                    <option value="<?php echo $wh['id']; ?>" <?php selected(($rule['sms_provider_id']??''), $wh['id']); ?>><?php echo $wh['name']; ?></option>
                                <?php endforeach; ?>
                            </select>
                            <select name="rule_sms_target[<?php echo $i; ?>]">
                                <option value="customer" <?php selected(($rule['sms_target']??''), 'customer'); ?>>ارسال به مشتری/کاربر</option>
                                <option value="custom" <?php selected(($rule['sms_target']??''), 'custom'); ?>>ارسال به شماره خاص</option>
                            </select>
                            <input type="text" name="rule_sms_custom_num[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['sms_custom_num']??''); ?>" placeholder="شماره مدیر (اگر انتخاب شد)">
                        </div>
                        <textarea name="rule_message_sms[<?php echo $i; ?>]" rows="3" class="full-width" placeholder="متن پیامک..."><?php echo esc_textarea($rule['message_sms']??''); ?></textarea>
                        <button type="button" class="button button-small test-action-btn" data-type="sms" style="margin-top:8px;">تست آنی ⚡</button>
                    </div>

                    <div class="tab-content tab-tg" style="display:none;">
                        <label><input type="checkbox" name="rule_active_tg[<?php echo $i; ?>]" value="1" <?php checked(isset($rule['active_tg'])); ?>> فعال‌سازی تلگرام</label>
                        <div class="flex-row" style="margin-top:10px;">
                            <select name="rule_tg_bot_id[<?php echo $i; ?>]">
                                <option value="">-- انتخاب ربات --</option>
                                <?php foreach($webhooks as $wh): if($wh['type']!='telegram') continue; ?>
                                    <option value="<?php echo $wh['id']; ?>" <?php selected(($rule['tg_bot_id']??''), $wh['id']); ?>><?php echo $wh['name']; ?></option>
                                <?php endforeach; ?>
                            </select>
                            <input type="text" name="rule_tg_chat_id[<?php echo $i; ?>]" value="<?php echo esc_attr($rule['tg_chat_id']??''); ?>" placeholder="Chat ID گیرنده">
                        </div>
                        <textarea name="rule_message_tg[<?php echo $i; ?>]" rows="3" class="full-width" placeholder="پیام تلگرام..."><?php echo esc_textarea($rule['message_tg']??''); ?></textarea>
                        <button type="button" class="button button-small test-action-btn" data-type="telegram" style="margin-top:8px;">تست آنی ⚡</button>
                    </div>

                    <div class="variables-wrapper">
                        <strong style="display:block; margin-bottom:5px; font-size:12px;">📌 متغیرهای قابل استفاده (برای درج کلیک کنید):</strong>
                        
                        <div class="var-list guide-cf7_submit" style="<?php echo ($trigger !== 'cf7_submit') ? 'display:none' : ''; ?>">
                            <span class="var-tag" data-insert="{field:your-name}">فیلد دلخواه: {field:name}</span>
                            <span class="var-tag" data-insert="{form_title}">نام فرم</span>
                            <span class="var-tag" data-insert="{form_id}">شناسه فرم</span>
                            <span class="var-tag" data-insert="[_date]">تاریخ شمسی</span>
                            <span class="var-tag" data-insert="[_time]">ساعت</span>
                            <span class="var-tag" data-insert="[_remote_ip]">IP کاربر</span>
                        </div>

                        <div class="var-list guide-order_status guide-order_created" style="<?php echo (strpos($trigger, 'order') === false) ? 'display:none' : ''; ?>">
                            <span class="var-tag" data-insert="{order_id}">شماره سفارش</span>
                            <span class="var-tag" data-insert="{status}">وضعیت</span>
                            <span class="var-tag" data-insert="{total}">مبلغ کل</span>
                            <span class="var-tag" data-insert="{full_name}">نام مشتری</span>
                            <span class="var-tag" data-insert="{phone}">موبایل</span>
                            <span class="var-tag" data-insert="{items_summary}">لیست کالاها</span>
                            <span class="var-tag" data-insert="{_scrape_raw_result_}">اسکرپر قیمت</span>
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
                    <button type="button" class="button" id="add-webhook-btn">+ افزودن کانال</button>
                </div>
                <div id="webhooks-container">
                    <?php 
                    if ( empty( $webhooks ) ) { $webhooks = [ [] ]; }
                    foreach ( $webhooks as $wh ): 
                        $t = $wh['type'] ?? 'webhook';
                    ?>
                    <div class="sajj-card webhook-row">
                        <span class="dashicons dashicons-trash remove-row"></span>
                        <div class="flex-row">
                            <select name="webhook_type[]" class="conn-type-selector">
                                <option value="webhook" <?php selected($t, 'webhook'); ?>>n8n / Webhook</option>
                                <option value="sms" <?php selected($t, 'sms'); ?>>پنل پیامک (IPPanel)</option>
                                <option value="telegram" <?php selected($t, 'telegram'); ?>>ربات تلگرام</option>
                            </select>
                            <input type="text" name="webhook_name[]" value="<?php echo esc_attr($wh['name']??''); ?>" placeholder="نام مستعار (مثلا: انبار)" style="width:200px">
                        </div>
                        
                        <div class="conn-fields field-webhook field-telegram" style="<?php echo ($t === 'sms') ? 'display:none' : ''; ?>">
                            <input type="text" name="webhook_url[]" value="<?php echo esc_attr($wh['url']??''); ?>" placeholder="آدرس Webhook یا توکن ربات" class="full-width" style="direction:ltr;">
                        </div>

                        <div class="conn-fields field-sms" style="<?php echo ($t !== 'sms') ? 'display:none' : ''; ?>">
                            <div class="flex-row">
                                <input type="text" name="sms_user[]" value="<?php echo esc_attr($wh['sms_user']??''); ?>" placeholder="نام کاربری">
                                <input type="text" name="sms_pass[]" value="<?php echo esc_attr($wh['sms_pass']??''); ?>" placeholder="رمز عبور">
                                <input type="text" name="sms_from[]" value="<?php echo esc_attr($wh['sms_from']??''); ?>" placeholder="شماره فرستنده">
                            </div>
                        </div>

                         <div style="margin-top:10px; text-align:left;">
                            <button type="button" class="button button-secondary test-connection-btn">تست اتصال ⚡</button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
             <div class="sajj-card" style="margin-top:20px;">
                <div class="hub-card-header"><h3>⚙️ تنظیمات پروکسی</h3></div>
                <label><strong>پروکسی تلگرام:</strong></label>
                <input type="text" name="telegram_proxy" value="<?php echo esc_attr(get_option('hub_telegram_proxy')); ?>" class="regular-text full-width" placeholder="ip:port">
            </div>
        </div>
        
        <div id="tab-auth" class="hub-tab-content" style="display:none;">
            <div class="sajj-card">
                <div class="hub-card-header"><h3>🔐 تنظیمات سیستم ورود و ثبت‌نام (OTP)</h3></div>
                <table class="form-table">
                    <tr>
                        <th scope="row">سیستم لاگین</th>
                        <td><label><input type="checkbox" name="hub_auth_active" value="1" <?php checked($auth_settings['active']); ?>> فعال‌سازی سیستم ورود با شماره موبایل</label></td>
                    </tr>
                    <tr>
                        <th scope="row">یکپارچه‌سازی</th>
                        <td><label><input type="checkbox" name="hub_auth_unified" value="1" <?php checked($auth_settings['unified_login']); ?>> جایگزینی فرم‌های پیش‌فرض ووکامرس</label></td>
                    </tr>
                    <tr>
                        <th scope="row">محدودیت زمانی (Rate Limit)</th>
                        <td><input type="number" name="hub_auth_rate_limit" value="<?php echo esc_attr($auth_settings['rate_limit']); ?>" class="small-text"> ثانیه</td>
                    </tr>
                    <tr>
                        <th scope="row">آدرس ریدایرکت</th>
                        <td><input type="url" name="hub_auth_redirect" value="<?php echo esc_attr($auth_settings['redirect_url']); ?>" class="regular-text" placeholder="https://..."></td>
                    </tr>
                </table>
            </div>
        </div>

        <div id="tab-logs" class="hub-tab-content" style="display:none;">
            <div class="sajj-card">
                <h3>آخرین لاگ‌های سیستم</h3>
                <p>برای مشاهده جزئیات دقیق، فایل <code>uploads/hub-debug.log</code> را بررسی کنید.</p>
                <textarea readonly style="width:100%; height:400px; direction:ltr; font-family:monospace; font-size:11px; background:#fafafa;"><?php 
                    $log_file = WP_CONTENT_DIR . '/uploads/hub-debug.log';
                    if(file_exists($log_file)) {
                        $lines = file($log_file);
                        $lines = array_slice($lines, -50);
                        echo implode("", $lines);
                    } else {
                        echo "هنوز لاگی ثبت نشده است.";
                    }
                ?></textarea>
            </div>
        </div>

        <hr>
        <p class="submit">
            <input type="submit" name="hub_save_settings" class="button button-primary button-hero" value="ذخیره تنظیمات">
        </p>
    </form>
</div>