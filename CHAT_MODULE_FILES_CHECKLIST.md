# 📋 Chat Module Files Checklist

## Files Jo Copy Karne Hain

### ✅ **1. Database Entities**

```
src/api/domain/entities/
├── ✅ conversation.entities.ts              (REQUIRED)
├── ✅ conversation.participant.entities.ts (REQUIRED)
├── ✅ message.entity.ts                     (REQUIRED)
└── ✅ message_meetings.entities.ts         (OPTIONAL - location/dating ke liye)
```

### ✅ **2. Database Models (Business Logic)**

```
src/api/domain/models/
├── ✅ conversation.model.ts                 (REQUIRED)
└── ✅ message.model.ts                      (REQUIRED)
```

### ✅ **3. Controllers**

```
src/api/interface/controllers/app/admin/
└── ✅ conversationController.ts             (REQUIRED)
```

### ✅ **4. Routes**

Files to modify:
```
src/api/interface/routes/
└── ✅ app.routes.ts                          (ADD chat routes)
```

### ✅ **5. Socket.IO Handler**

```
src/infrastructure/webserver/socket/
└── ✅ socket.io.ts                          (REQUIRED - events copy karo)
```

**Important Socket.IO Events:**
- `send_message`
- `join_room`
- `join_self`
- `mark_as_read`
- `typing`
- `user_online_status`
- `receive_message`
- `new_message_received`

### ✅ **6. Response DTOs**

```
src/api/domain/responseDto/
└── ✅ userResponseDto.ts                    (REQUIRED - formatMessage, formatParticipant functions)
```

### ✅ **7. Enums**

```
src/api/enum/
└── ✅ index.ts                              (REQUIRED - NotificationType enum)
```

### ✅ **8. Middlewares**

```
src/api/middlewares/
├── ✅ uploadMedia.ts                        (REQUIRED - media uploads ke liye)
└── ✅ verifyToken.ts                        (REQUIRED - authentication ke liye)
```

### ✅ **9. Helpers**

```
src/api/helpers/
├── ✅ apiResponse.ts                        (REQUIRED - successResponse, ErrorResponse)
└── ✅ firebaseConfig.ts                     (OPTIONAL - agar Firebase use kar rahe ho)
```

### ✅ **10. Express Server Setup**

Files to modify:
```
src/infrastructure/webserver/express/
└── ✅ index.ts                              (ADD Socket.IO setup)
```

### ✅ **11. Database Config**

Files to modify:
```
src/api/config/
├── ✅ db.ts                                 (ADD entities to TypeORM config)
└── ✅ constants.ts                         (OPTIONAL - error messages ke liye)
```

### ✅ **12. Migration Files**

```
src/api/domain/migration/
├── ✅ 1740137176905-create_conversations.ts
├── ✅ 1740137686346-create_conversations_participant.ts
├── ✅ 1740138348605-create_message_table.ts
└── ✅ 1752656624900-create_dating_message_table.ts (OPTIONAL)
```

---

## 📦 **Dependencies Install Karo**

```bash
npm install socket.io typeorm multer firebase-admin jsonwebtoken express cors dotenv

npm install -D @types/multer @types/node @types/express @types/jsonwebtoken typescript
```

---

## 🔧 **Configuration Files**

### ✅ **.env Variables**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database

# Firebase (optional)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=3000
```

---

## 🎯 **Quick Integration Steps**

1. ✅ **Files Copy Karo** - Upar wali files copy karo
2. ✅ **Dependencies Install Karo** - npm install karo
3. ✅ **Database Migrations** - Migrations run karo
4. ✅ **TypeORM Config** - Entities register karo
5. ✅ **Express Server** - Socket.IO setup karo
6. ✅ **Routes** - Chat routes add karo
7. ✅ **Environment Variables** - .env file setup karo
8. ✅ **Test** - API endpoints test karo

---

## 📝 **Copy Karne Ka Order**

1. **Pehle Entities** copy karo (database models)
2. **Phir Models** copy karo (business logic)
3. **Phir Controllers** copy karo (API handlers)
4. **Phir Routes** add karo (API endpoints)
5. **Phir Socket.IO** setup karo (real-time)
6. **Phir DTOs & Helpers** copy karo (utilities)
7. **Phir Migrations** run karo (database setup)

---

## ⚠️ **Important Notes**

1. **User Entity Update** - Apne `Users` entity mein `conversations` relation add karo
2. **Authentication** - `verifyToken` middleware properly configured ho
3. **Database** - TypeORM properly setup ho
4. **Socket.IO** - `getIo()` function properly export ho
5. **Firebase** - Agar Firebase use nahi kar rahe, to media upload logic change karo

---

## ✅ **Verification Checklist**

- [ ] Sab files copy ho gayi hain
- [ ] Dependencies install ho gayi hain
- [ ] Database migrations run ho gayi hain
- [ ] TypeORM entities register ho gayi hain
- [ ] Socket.IO properly setup hai
- [ ] Routes properly configured hain
- [ ] Environment variables set kiye gaye hain
- [ ] API endpoints test kiye gaye hain
- [ ] Socket.IO events test kiye gaye hain

---

**Good Luck! 🚀**


