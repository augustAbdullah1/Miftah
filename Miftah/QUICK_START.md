# 🚀 تشغيل سريع - مفتاح | Quick Start - Miftah

## ⚡ **تشغيل فوري - 3 دقائق | Instant Run - 3 Minutes**

### 📋 **المتطلبات | Requirements:**
- Node.js (v16+)
- npm أو yarn
- Expo Go app على الجوال

---

## 🎯 **خطوات التشغيل السريع | Quick Run Steps:**

### 1️⃣ **تحميل المشروع | Download Project:**
```bash
# إذا كان لديك Git
git clone [repository-url]
cd Miftah

# أو فك ضغط ملف ZIP
unzip miftah-app.zip
cd Miftah
```

### 2️⃣ **تثبيت المكتبات | Install Dependencies:**
```bash
npm install
# أو
yarn install
```

### 3️⃣ **تشغيل التطبيق | Start App:**
```bash
# للجوال والويب معاً
npx expo start

# للويب فقط
npx expo start --web

# للجوال فقط
npx expo start --tunnel
```

### 4️⃣ **فتح التطبيق | Open App:**

**📱 على الجوال:**
1. حمّل تطبيق **Expo Go** من متجر التطبيقات
2. امسح QR Code الظاهر في Terminal
3. التطبيق سيفتح تلقائياً

**💻 على المتصفح:**
- اضغط `w` في Terminal
- أو افتح: `http://localhost:8081`

---

## 🔧 **إعدادات سريعة | Quick Settings:**

### 🌍 **تغيير اللغة | Change Language:**
- في التطبيق: الإعدادات → اللغة
- العربية ← → English

### 🌙 **الوضع المظلم | Dark Mode:**
- سيتم تطبيقه تلقائياً حسب إعدادات جهازك
- أو من الإعدادات → المظهر

---

## ✅ **التحقق من التشغيل | Verify Installation:**

**✓ يجب أن ترى:**
- شاشة ترحيب مع شعار مفتاح
- خيارات تسجيل الدخول/إنشاء حساب
- تأثيرات Glass و Blur
- دعم اللغة العربية مع RTL

**❌ إذا واجهت مشاكل:**
```bash
# مسح Cache
npx expo r -c

# إعادة تثبيت المكتبات
rm -rf node_modules package-lock.json
npm install

# تشغيل مع Tunnel للجوال
npx expo start --tunnel
```

---

## 🎮 **تجربة سريعة | Quick Demo:**

### 1. **إنشاء حساب تجريبي:**
- اسم: Test User
- بريد: test@example.com
- كلمة مرور: Test123!

### 2. **تصفح الميزات:**
- 🏠 الصفحة الرئيسية
- 🔍 البحث عن منتجات
- 💬 الدردشة (تجريبية)
- 🎯 نظام المزايدة

### 3. **تجربة الذكاء الاصطناعي:**
- إضافة منتج → سيقترح الفئة تلقائياً
- البحث الذكي بالوصف
- كشف الاحتيال في المنتجات

---

## 📱 **للحصول على APK | Get APK:**

### طريقة سريعة:
```bash
# بناء محلي (تجريبي)
npx expo export --platform android
```

### طريقة احترافية:
```bash
# إنشاء حساب Expo
npx expo register

# تسجيل دخول
npx expo login

# بناء APK
npx eas-cli build --platform android --profile preview
```

---

## 🆘 **مساعدة سريعة | Quick Help:**

**🔥 أوامر مفيدة:**
```bash
# إعادة تشغيل
npx expo r

# مسح Cache
npx expo r -c

# تحديث Expo
npm install -g @expo/cli@latest

# فحص المشاكل
npx expo doctor
```

**📞 دعم فوري:**
- GitHub Issues للمشاكل التقنية
- Discord للدعم المباشر

---

**🎉 مبروك! التطبيق جاهز للاستخدام**
**🎉 Congratulations! App is Ready to Use**

⏱️ **وقت التشغيل المتوقع: 2-3 دقائق**
⏱️ **Expected Setup Time: 2-3 minutes**