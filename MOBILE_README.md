## 📱 Social Circle - Mobile App (React Native)

تحويل تطبيق Social Circle إلى تطبيق **React Native** يعمل على **iOS و Android**

### 🚀 المميزات

- ✅ تطبيق واحد لـ iOS و Android
- ✅ واجهة مستخدم جميلة وسلسة
- ✅ المصادقة والتسجيل
- ✅ عرض الفيد (Feed)
- ✅ إدارة الاتصالات
- ✅ نظام الرسائل
- ✅ ملف المستخدم الشخصي
- ✅ دعم WebSocket للرسائل الفورية

### 📁 البنية

```
mobile/
├── App.tsx              # التطبيق الرئيسي
├── package.json         # الحزم والتبعيات
├── tsconfig.json       # إعدادات TypeScript
├── app.json            # إعدادات Expo
├── screens/
│   ├── SplashScreen.tsx
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── home/
│   │   └── HomeScreen.tsx
│   ├── profile/
│   │   └── ProfileScreen.tsx
│   ├── connections/
│   │   └── ConnectionsScreen.tsx
│   └── messages/
│       └── MessagesScreen.tsx
├── components/         # مكونات قابلة لإعادة الاستخدام
├── hooks/             # React hooks مخصصة
├── utils/             # وظائف مساعدة
└── types/             # تعريفات TypeScript
```

### 📦 التبعيات الرئيسية

- **Expo** - منصة React Native
- **React Native** - إطار العمل
- **React Navigation** - التوجيه
- **React Query** - إدارة البيانات
- **Axios** - العملاء HTTP
- **AsyncStorage** - التخزين المحلي

### 🛠️ التثبيت والإعداد

#### المتطلبات الأساسية
```bash
node --version  # 16+
npm --version   # 8+
```

#### 1. تثبيت Expo CLI
```bash
npm install -g expo-cli
```

#### 2. تثبيت الحزم
```bash
cd mobile
npm install
```

#### 3. تثبيت التطبيقات المطلوبة
- **iOS**: Xcode (Mac فقط)
- **Android**: Android Studio + Android SDK

#### 4. بدء التطبيق

**للتطوير:**
```bash
npm start        # يبدأ متوسط Expo
```

**لـ iOS:**
```bash
npm run ios      # يتطلب Mac
```

**لـ Android:**
```bash
npm run android
```

**لـ Web:**
```bash
npm run web
```

### 🔗 الاتصال بـ Backend

تأكد من أن الخادم يعمل على:
```
http://localhost:5000
```

عدّل `API_URL` في الملفات إذا احتجت إلى تغيير العنوان:
```typescript
const API_URL = 'http://YOUR_SERVER_URL:5000/api';
```

### 📲 الشاشات الرئيسية

1. **Login Screen** - تسجيل الدخول
2. **Signup Screen** - إنشاء حساب جديد
3. **Home Screen** - عرض الفيد
4. **Connections Screen** - إدارة الاتصالات
5. **Messages Screen** - الرسائل
6. **Profile Screen** - الملف الشخصي

### 🔐 المصادقة

- يتم حفظ التوكن في `AsyncStorage`
- يتم التحقق من التوكن عند بدء التطبيق
- تسجيل الخروج يمسح البيانات المخزنة

### 🎨 التصميم

- تصميم مستجيب يتكيف مع جميع الأجهزة
- ألوان متناسقة (Indigo Primary)
- Shadow و Elevation لـ Material Design

### 📝 أمثلة الاستخدام

#### جلب البيانات
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  }
});
```

#### التخزين المحلي
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// حفظ
await AsyncStorage.setItem('key', 'value');

// استرجاع
const value = await AsyncStorage.getItem('key');

// حذف
await AsyncStorage.removeItem('key');
```

### 🐛 استكشاف الأخطاء

#### الخطأ: "Cannot find module"
```bash
npm install
npm start --clear
```

#### الخطأ: Port في الاستخدام
```bash
# غيّر المنفذ في App.tsx
```

#### الخطأ: Connection refused
- تأكد من أن الخادم يعمل
- تحقق من `API_URL` في الملفات

### 🚀 النشر

#### iOS:
1. إعداد App Store Connect
2. إنشاء Certificate و Provisioning Profile
3. `eas build --platform ios --auto-submit`

#### Android:
1. إنشاء keystore
2. `eas build --platform android --auto-submit`
3. رفع على Google Play Store

### 📚 المراجع

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [React Query](https://tanstack.com/query)

### 💡 نصائح التطوير

- استخدم Expo Go للاختبار السريع
- استخدم `console.log` للتصحيح
- استخدم React DevTools للتفتيش
- استخدم Redux Devtools للحالة العامة

### 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

### 📄 الترخيص

MIT License - انظر ملف LICENSE للتفاصيل

---

**Happy Coding! 🎉**
