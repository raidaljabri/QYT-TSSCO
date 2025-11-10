from motor.motor_asyncio import AsyncIOMotorClient

# رابط اتصال MongoDB Atlas
MONGO_DETAILS = "mongodb+srv://admin:132321@qytr.yhtkwu2.mongodb.net/?appName=QYTR"

# إنشاء العميل
client = AsyncIOMotorClient(MONGO_DETAILS)

# اختيار قاعدة البيانات
database = client.QYTR  # اسم قاعدة البيانات الآن QYTR

# اختيار الكوليكشن
quotes_collection = database.quotes  # اسم الكوليكشن
