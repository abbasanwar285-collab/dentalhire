# عيادتي للأسنان - My Dental Clinic

نظام إدارة عيادات الأسنان المتكامل - تطبيق ويب تقدمي (PWA) يعمل على جميع الأجهزة

## 🌟 المميزات الرئيسية

### 📋 إدارة المرضى
- تسجيل بيانات المرضى الكاملة
- تاريخ طبي شامل لكل مريض
- إدارة العلاجات والإجراءات
- متابعة الأقساط والديون
- نظام التقويم الأسنان

### 📅 إدارة المواعيد
- جدولة المواعيد اليومية
- تنبيهات المواعيد
- تتبع حالة المواعيد (مؤكد، وصل، مكتمل، ملغى)
- عرض تقويمي للمواعيد

### 💰 إدارة المالية
- تتبع الإيرادات والمصروفات
- حساب الأرباح والخسائر
- تقارير مالية مفصلة
- إدارة الديون والأقساط

### 📦 إدارة المخزون
- تتبع مستلزمات العيادة
- التنبيه عند انخفاض المخزون
- إدارة الموردين
- حساب معدلات الاستهلاك

### 👥 إدارة الموظفين
- صلاحيات متعددة (Admin, Doctor, Assistant)
- تتبع أداء الأطباء
- سجل النشاطات والتدقيق

### 🤖 الذكاء الاصطناعي
- تحليل الأشعة السينية
- اقتراحات العلاج الذكية
- تحليل البيانات والتنبؤات
- مساعد ذكي للقرارات

## 🚀 التقنيات المستخدمة

- **Frontend:** React 19 + TypeScript 5 + Vite 6
- **UI Framework:** Tailwind CSS + Lucide Icons
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Authentication:** Supabase Auth
- **Mobile:** Capacitor (Android/iOS)
- **AI Integration:** Google Gemini API

## 📱 المتطلبات

- Node.js 18+
- npm أو yarn
- متصفح حديث (Chrome, Firefox, Safari, Edge)

## ⚙️ التثبيت والتشغيل

### 1. استنساخ المشروع
```bash
git clone https://github.com/yourusername/dental-clinic.git
cd dental-clinic
```

### 2. تثبيت الاعتماديات
```bash
npm install
```

### 3. إعداد المتغيرات البيئية
```bash
cp .env.example .env.local
```

ثم عدل ملف `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 4. تشغيل التطبيق
```bash
# وضع التطوير
npm run dev

# بناء الإنتاج
npm run build

# معاينة البناء
npm run preview
```

### 5. الاختبارات
```bash
# تشغيل الاختبارات
npm test

# الاختبارات مع التغطية
npm run test:coverage
```

## 🔒 الأمان

### إعداد RLS في Supabase

1. اذهب إلى Supabase Dashboard
2. افتح SQL Editor
3. نفذ ملف `supabase/migrations/secure_rls_policies.sql`

### أفضل ممارسات الأمان

- ✅ لا ترفع ملف `.env.local` إلى Git
- ✅ استخدم كلمات مرور قوية
- ✅ فعّل Two-Factor Authentication في Supabase
- ✅ راجع سجلات الأمان بانتظام

## 📁 هيكل المشروع

```
my-dental-clinic/
├── components/          # مكونات React
│   ├── patient/        # مكونات خاصة بالمرضى
│   └── ...
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── pages/              # صفحات التطبيق
├── services/           # الخدمات والـ APIs
├── types/              # أنواع TypeScript
├── utils/              # دوال مساعدة
└── supabase/           # ملفات Supabase
    └── migrations/     # ملفات الهجرة
```

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# وضع المشاهدة
npm run test:watch

# تغطية الكود
npm run test:coverage
```

## 📱 البناء للموبايل

### Android
```bash
# إضافة منصة Android
npx cap add android

# بناء المشروع
npm run build
npx cap sync android

# فتح Android Studio
npx cap open android
```

### iOS
```bash
# إضافة منصة iOS
npx cap add ios

# بناء المشروع
npm run build
npx cap sync ios

# فتح Xcode
npx cap open ios
```

## 🚀 النشر

### Vercel
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel
```

### Netlify
```bash
# بناء المشروع
npm run build

# رفع المجلد dist
```

## 🛠️ أدوات التطوير

### ESLint
```bash
# فحص الأخطاء
npm run lint

# إصلاح الأخطاء تلقائياً
npm run lint:fix
```

### Prettier
```bash
# تنسيق الكود
npm run format
```

## 📊 مراقبة الأداء

### Lighthouse
```bash
# توليد تقرير Lighthouse
npm run build
npx lighthouse http://localhost:4173 --output=html
```

## 🐛 حل المشاكل

### مشكلة: لا يمكن تسجيل الدخول
- ✅ تأكد من إعداد Supabase URL و Anon Key
- ✅ تأكد من تطبيق سياسات RLS
- ✅ راجع Console للأخطاء

### مشكلة: فشل المزامنة
- ✅ تحقق من اتصال الإنترنت
- ✅ راجع Network tab في DevTools
- ✅ تأكد من صلاحيات المستخدم

## 📝 الترخيص

هذا المشروع مرخص بموجب MIT License.

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📞 التواصل

للأسئلة والاستفسارات:
- 📧 البريد الإلكتروني: your-email@example.com
- 💬 Issues: GitHub Issues

## 🙏 الشكر

- [React](https://reactjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Capacitor](https://capacitorjs.com/)
- [Vite](https://vitejs.dev/)

---

<div align="center">
  <strong>صنع بحب ❤️ لفريق عيادتي للأسنان</strong>
</div>
