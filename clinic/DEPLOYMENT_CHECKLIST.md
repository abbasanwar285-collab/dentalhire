# ✅ قائمة التحقق قبل النشر
## Pre-Deployment Checklist

## 🔐 الأمان (Security)

### متطلبات إلزامية
- [ ] إزالة جميع المفاتيح من `.env` ونقلها إلى `.env.local`
- [ ] التأكد من أن `.env.local` في `.gitignore`
- [ ] تطبيق سياسات RLS الآمنة في Supabase
- [ ] تغيير مفاتيح API المكشوفة
- [ ] تفعيل Two-Factor Authentication في Supabase
- [ ] مراجعة صلاحيات المستخدمين
- [ ] فحص الكود بحثاً عن `console.log` حساس

### اختبار الأمان
```bash
# 1. التأكد من عدم وجود مفاتيح في الكود
grep -r "eyJhbGciOiJIUzI1NiIs" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# 2. فحص console.log
grep -r "console.log" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | wc -l

# 3. التأكد من gitignore
cat .gitignore | grep -E "\.env|\.local"
```

## 🧪 الاختبارات

### اختبارات الوحدة
- [ ] تشغيل جميع الاختبارات: `npm test`
- [ ] تغطية الكود > 80%: `npm run test:coverage`
- [ ] عدم وجود اختبارات فاشلة

### اختبارات التكامل
- [ ] اختبار تسجيل الدخول
- [ ] اختبار إضافة مريض
- [ ] اختبار إضافة موعد
- [ ] اختبار المزامنة
- [ ] اختبار العمل offline

### اختبارات الأداء
- [ ] Lighthouse score > 90
- [ ] Time to First Byte < 200ms
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s

## 🏗️ البناء

### التحقق من البناء
```bash
# 1. بناء الإنتاج
npm run build

# 2. التحقق من عدم وجود أخطاء
# يجب أن ينتهي البناء بدون أخطاء

# 3. معاينة الإنتاج
npm run preview
```

### التحقق من الحجم
- [ ] حجم bundle الإجمالي < 2MB
- [ ] حجم main.js < 500KB
- [ ] الصور مُحسّنة (WebP)

## 📱 الموبايل

### Android
- [ ] بناء APK ناجح
- [ ] اختبار على جهاز حقيقي
- [ ] اختبار الأداء على شبكة بطيئة
- [ ] التحقق من الأذونات (Camera, Storage)

### iOS
- [ ] بناء IPA ناجح
- [ ] اختبار على iPhone/iPad
- [ ] التحقق من App Store guidelines

## 🗄️ قاعدة البيانات

### Supabase
- [ ] تطبيق جميع migrations
- [ ] فهرسة الجداول
- [ ] تفعيل RLS على جميع الجداول
- [ ] اختبار صلاحيات المستخدمين
- [ ] النسخ الاحتياطي

```sql
-- التحقق من RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'appointments', 'expenses', 'inventory_items');
```

## 🌐 النشر

### Pre-deployment
- [ ] تحديث رقم الإصدار
- [ ] كتابة changelog
- [ ] مراجعة README
- [ ] تحديث التوثيق

### Deployment Steps
```bash
# 1. Git commit
# 2. Git push
# 3. Deploy to hosting
# 4. Run smoke tests
# 5. Monitor logs
```

## 📊 المراقبة

### الأدوات المطلوبة
- [ ] Sentry للأخطاء
- [ ] Google Analytics
- [ ] Uptime monitoring
- [ ] Performance monitoring

### التنبيهات
- [ ] خطأ 500
- [ ] انخفاض الأداء
- [ ] فشل المزامنة
- [ ] مشاكل RLS

## 🔄 النسخ الاحتياطي

### قاعدة البيانات
```bash
# النسخ الاحتياطي اليومي
# تخزين لمدة 30 يوم
```

### الملفات
- [ ] إعداد تلقائي للنسخ الاحتياطي
- [ ] اختبار استعادة النسخة
- [ ] تخزين خارجي (AWS S3, etc.)

## 📋 قائمة ما قبل الإطلاق

### يوم قبل الإطلاق
- [ ] اختبار شامل end-to-end
- [ ] مراجعة نهائية للأمان
- [ ] تحضير خطة rollback
- [ ] إخطار المستخدمين (إذا لزم)

### يوم الإطلاق
- [ ] نشر في وقت هادئ
- [ ] مراقبة الـ logs
- [ ] اختبار سريع
- [ ] الإعلان عن الإطلاق

## 🆘 خطة الطوارئ

### Rollback Plan
```bash
# 1. استعادة قاعدة البيانات
# 2. revert Git commit
# 3. redeploy
# 4. notify users
```

### Contact List
- [ ] فريق التطوير
- [ ] مدير النظام
- [ ] الدعم الفني

## ✅ التوقيعات

**تم المراجعة بواسطة:** _________________  **التاريخ:** _______

**تم الموافقة على النشر بواسطة:** _________________  **التاريخ:** _______

**تم النشر بواسطة:** _________________  **التاريخ:** _______

---

**ملاحظات:**
- لا تنشر بدون إكمال جميع العناصر الإلزامية (🔴)
- احتفظ بهذه القائمة لمتابعة التحديثات المستقبلية
- راجع القائمة بعد كل تحديث رئيسي
