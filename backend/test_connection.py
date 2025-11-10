from pymongo import MongoClient

# الرابط من ملف .env أو مباشرة
MONGO_URL = "mongodb+srv://admin:132321@qytr.yhtkwu2.mongodb.net/?appName=QYTR"
DB_NAME = "QYTR"

try:
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    # اختبار الحصول على أسماء الكوليكشنز (المجموعات)
    collections = db.list_collection_names()
    print(f"✅ تم الاتصال بقاعدة البيانات '{DB_NAME}'. الكوليكشنات الحالية: {collections}")
except Exception as e:
    print(f"❌ فشل الاتصال: {e}")
