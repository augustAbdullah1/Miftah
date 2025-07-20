#!/bin/bash

echo "🔥 بناء APK لتطبيق مفتاح..."

# إنشاء مجلد APK
mkdir -p apk-final

# طريقة 1: Cordova APK
echo "📱 إنشاء APK باستخدام Cordova..."

# إنشاء مشروع Cordova
if ! command -v cordova &> /dev/null; then
    echo "تثبيت Cordova..."
    npm install -g cordova
fi

# إنشاء مشروع Cordova جديد
cordova create apk-final/miftah-cordova com.miftah.app "Miftah" --template blank

# نسخ ملفات التطبيق
cp -r docs/* apk-final/miftah-cordova/www/

cd apk-final/miftah-cordova

# إضافة منصة Android
cordova platform add android

# بناء APK
cordova build android

echo "✅ APK جاهز في: platforms/android/app/build/outputs/apk/"

# العودة للمجلد الأساسي
cd ../..

echo "🎉 تم بناء APK بنجاح!"
echo "📱 الملف موجود في: apk-final/miftah-cordova/platforms/android/app/build/outputs/apk/"