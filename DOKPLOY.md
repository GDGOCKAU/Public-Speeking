# نشر الموقع على Dokploy

المشروع مجهز ليعمل كتطبيق Docker واحد: يبني واجهة Vite ثم يشغلها مع Express وSocket.IO على المنفذ `5001`. قاعدة البيانات تنشأ كخدمة PostgreSQL مستقلة داخل Dokploy، والجداول ينشئها التطبيق تلقائيًا عند أول تشغيل.

## قبل البدء

1. ارفع المشروع إلى مستودع GitHub خاص أو عام. تأكد أن الملفات `Dockerfile` و`.dockerignore` و`package-lock.json` موجودة في المستودع، ولا ترفع ملف `.env`.
2. جهّز دومينًا مثل `event.example.com` واجعل سجل `A` يشير إلى عنوان IP لخادم Dokploy.

## 1. إنشاء المشروع وقاعدة البيانات

1. افتح Dokploy واختر **Projects** ثم **Create Project**، وسمّه مثلًا `gdg-live-event`.
2. افتح بيئة `production` داخل المشروع.
3. اختر **Create Service** ثم **Database** ثم **PostgreSQL**.
4. استخدم اسم خدمة مثل `gdg-postgres`، واسم قاعدة `gdg_event`، واسم مستخدم وكلمة مرور قويين، ثم أنشئ القاعدة واضغط **Deploy**.
5. بعد تشغيلها افتح تبويب **Connection** وانسخ **Internal Connection URL**. لا تحتاج إلى External Port.

## 2. إنشاء التطبيق

1. داخل نفس بيئة `production` اختر **Create Service** ثم **Application**، وسمّه `gdg-live-event`.
2. في **General / Source** اختر GitHub ثم المستودع والفرع المطلوبين، واجعل **Build Path** هو `.` إذا كان هذا المشروع في جذر المستودع. إذا لم يكن GitHub مربوطًا، اربطه من **Git Providers** وثبّت Dokploy GitHub App على هذا المستودع.
3. اجعل **Build Type** هو `Dockerfile`، ثم استخدم:
   - **Dockerfile Path:** `Dockerfile`
   - **Docker Context Path:** `.`
   - **Docker Build Stage:** اتركه فارغًا
4. في تبويب **Environment** الصق محتوى `dokploy.env.example` بعد استبدال القيم:

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://...القيمة المنسوخة من Internal Connection URL...
ADMIN_PASSWORD=كلمة-مرور-طويلة-وفريدة
SESSION_SECRET=قيمة-عشوائية-طويلة-لا-تقل-عن-32-حرفًا
PUBLIC_ORIGIN=https://event.example.com
```

لا تضف `VITE_API_URL` في الإنتاج؛ الواجهة والـ API يعملان على الدومين نفسه.

## 3. ربط الدومين والنشر

1. افتح تبويب **Domains** في التطبيق واختر **Add Domain**.
2. أدخل الدومين بلا `https://`، واجعل **Path** هو `/` و**Container Port** هو `5001`.
3. فعّل HTTPS واختر شهادة **Let's Encrypt**. يجب أن يكون سجل DNS موجهًا إلى الخادم قبل هذه الخطوة.
4. لا تضف أي إعداد في **Advanced > Ports**؛ الدومين يمر عبر Traefik مباشرة إلى منفذ الحاوية.
5. اضغط **Deploy** وانتظر نجاح مرحلتي البناء والتشغيل.

### إعدادات السعة للفعالية

- شغّل **Replica واحدة فقط** من التطبيق. حالة Socket.IO محفوظة داخل العملية؛ تشغيل أكثر من نسخة يتطلب Redis adapter وsticky sessions.
- [الحد الأدنى الرسمي لخادم Dokploy](https://docs.dokploy.com/docs/core/installation) هو 2GB RAM و30GB مساحة. عند تشغيل Dokploy والتطبيق وPostgreSQL على الخادم نفسه، استخدم 4GB RAM و2 vCPU لراحة أكبر أثناء الفعالية.
- اتصال PostgreSQL مضبوط على 20 اتصالًا، وهو مناسب لفعالية تضم 40–60 حاضرًا.

## 4. التحقق

- افتح `https://event.example.com/api/health` ويجب أن ترى `{"ok":true}`.
- افتح الصفحة الرئيسية للتسجيل.
- افتح `/admin` وسجل الدخول بقيمة `ADMIN_PASSWORD`.
- جرّب `/screen` و`/screen/team/1` و`/screen/team/2`.
- إذا غيّرت الدومين لاحقًا، حدّث `PUBLIC_ORIGIN` ثم أعد النشر.

## النسخ الاحتياطي والتحديثات

- فعّل النسخ الاحتياطي من إعدادات خدمة PostgreSQL في Dokploy قبل الحدث.
- لنشر تحديث: ارفع التغييرات إلى الفرع الموصول ثم اضغط **Redeploy**، أو فعّل النشر التلقائي من إعدادات Git.
- بيانات الفعالية موجودة في PostgreSQL ولا تضيع عند إعادة بناء حاوية التطبيق.
