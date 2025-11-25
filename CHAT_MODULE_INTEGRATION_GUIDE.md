# 📱 Chat Module Integration Guide

## Dusre Project Mein Chat Module Integrate Karne Ka Step-by-Step Guide

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Required Dependencies](#required-dependencies)
3. [Database Setup](#database-setup)
4. [Files to Copy](#files-to-copy)
5. [Integration Steps](#integration-steps)
6. [Configuration](#configuration)
7. [Testing](#testing)

---

## 🔧 **Prerequisites**

1. **Node.js & TypeScript** installed
2. **PostgreSQL Database** setup
3. **TypeORM** configured
4. **Express.js** server running
5. **Socket.IO** installed
6. **Firebase Admin SDK** (for push notifications & media uploads)

---

## 📦 **Required Dependencies**

Apne `package.json` mein ye dependencies add karein:

```json
{
  "dependencies": {
    "socket.io": "^4.8.1",
    "typeorm": "^0.3.20",
    "multer": "^1.4.4",
    "firebase-admin": "^13.1.0",
    "jsonwebtoken": "^8.5.1",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/multer": "^1.4.12",
    "@types/node": "^17.0.45",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^8.5.9",
    "typescript": "^4.9.5"
  }
}
```

---

## 🗄️ **Database Setup**

### Step 1: Database Migrations Create Karo

Chat ke liye **3 main tables** chahiye:

1. **`conversations`** - Chat conversations store karta hai
2. **`conversations_participant`** - Conversation mein participants track karta hai
3. **`message`** - Messages store karta hai
4. **`message_meetings`** (optional) - Location/dating messages ke liye

### Step 2: Migration Files Copy Karo

Ye migration files copy karo:
- `1740137176905-create_conversations.ts`
- `1740137686346-create_conversations_participant.ts`
- `1740138348605-create_message_table.ts`
- `1752656624900-create_dating_message_table.ts` (optional)

---

## 📁 **Files to Copy**

### **1. Entities (Database Models)**

Copy these files to your project:

```
📦 src/api/domain/entities/
├── conversation.entities.ts
├── conversation.participant.entities.ts
├── message.entity.ts
└── message_meetings.entities.ts (optional - for location/dating features)
```

### **2. Models (Business Logic)**

```
📦 src/api/domain/models/
├── conversation.model.ts
└── message.model.ts
```

### **3. Controllers**

```
📦 src/api/interface/controllers/app/admin/
└── conversationController.ts
```

### **4. Routes**

Routes ko apne existing routes file mein merge karo:

```typescript
// Chat routes add karo
route.post("/chat/create-conversation", verifyToken, createConversation)
route.get("/chat/conversations", verifyToken, getConversations)
route.get("/chat/conversation/:conversation_id", verifyToken, getOneConversation)
route.get("/chat/messages/:conversation_id", verifyToken, getMessagesOfChatId)
route.post("/chat/message/send-message", verifyToken, upload.array("files",5), sendMediaMessageApi)
```

### **5. Socket.IO Handler**

```
📦 src/infrastructure/webserver/socket/
└── socket.io.ts
```

**Important:** Socket.IO events copy karo:
- `send_message`
- `join_room`
- `join_self`
- `mark_as_read`
- `typing`
- `user_online_status`

### **6. Response DTOs**

```
📦 src/api/domain/responseDto/
└── userResponseDto.ts (formatMessage, formatParticipant functions)
```

### **7. Enums**

```
📦 src/api/enum/
└── index.ts (NotificationType enum)
```

### **8. Middlewares**

```
📦 src/api/middlewares/
├── uploadMedia.ts (for media uploads)
└── verifyToken.ts (authentication)
```

### **9. Helpers**

```
📦 src/api/helpers/
├── apiResponse.ts (successResponse, ErrorResponse functions)
└── firebaseConfig.ts (Firebase setup - agar Firebase use kar rahe ho)
```

### **10. Utility Functions**

Agar distance calculation chahiye:
```
📦 src/api/domain/models/
└── user.model.ts (getDistanceFromLatLng function)
```

---

## 🔌 **Integration Steps**

### **Step 1: Express Server Setup with Socket.IO**

Apne Express server file mein Socket.IO integrate karo:

```typescript
// src/infrastructure/webserver/express/index.ts
import { createServer as createHttpServer } from 'http'
import { Server } from 'socket.io'
import { handleSocketEvents } from '../socket/socket.io'

let io: Server | any = null;

export const getIo = () => {
    if(!io){
        throw new Error("Socket.IO not initialized!")
    }
    return io;
}

export const createServer = (): void => {
    const app = express();
    
    // ... existing middleware ...
    
    /** Create HTTP server */
    const server = createHttpServer(app);

    /** Initialize Socket.IO */
    io = new Server(server, {
        cors: {
            origin: "*", // Production mein specific origins use karo
            methods: ["GET", "POST"]
        }
    });

    /** Socket.IO Events */
    handleSocketEvents(io);

    /** Listen on Port */
    server.listen(port, () => {
        console.log(`Server running on http://${host}:${port}`);
    });
};
```

### **Step 2: Database Entities Register Karo**

Apne TypeORM config mein entities register karo:

```typescript
// src/api/config/db.ts
import { Conversation } from "../domain/entities/conversation.entities"
import { ConversationParticipant } from "../domain/entities/conversation.participant.entities"
import { Message } from "../domain/entities/message.entity"
import { DatingMessage } from "../domain/entities/message_meetings.entities"

export const AppDataSource = new DataSource({
  // ... existing config ...
  entities: [
    // ... existing entities ...
    Conversation,
    ConversationParticipant,
    Message,
    DatingMessage // optional
  ],
  migrations: [
    // ... existing migrations ...
    // Chat related migrations add karo
  ]
})
```

### **Step 3: Routes Register Karo**

Apne routes file mein chat routes add karo:

```typescript
// src/api/interface/routes/app.routes.ts
import {
    createConversation,
    getConversations,
    getOneConversation,
    getMessagesOfChatId,
    sendMediaMessageApi
} from '../../controllers/app/admin/conversationController'

// Chat routes
route.post("/chat/create-conversation", verifyToken, createConversation)
route.get("/chat/conversations", verifyToken, getConversations)
route.get("/chat/conversation/:conversation_id", verifyToken, getOneConversation)
route.get("/chat/messages/:conversation_id", verifyToken, getMessagesOfChatId)
route.post("/chat/message/send-message", verifyToken, upload.array("files",5), sendMediaMessageApi)
```

### **Step 4: User Entity Update Karo**

Agar apne `Users` entity mein chat relations nahi hain, to add karo:

```typescript
// src/api/domain/entities/users.enities.ts
import { ConversationParticipant } from "./conversation.participant.entities"

@Entity({name: "users"})
export class Users {
    // ... existing fields ...
    
    @OneToMany(() => ConversationParticipant, (participant) => participant.user)
    conversations: ConversationParticipant[]
}
```

### **Step 5: Dependencies Check Karo**

Ensure kar lo ki sab dependencies properly import ho rahi hain:

- ✅ TypeORM repositories
- ✅ Socket.IO instance (`getIo()`)
- ✅ Firebase Admin (for notifications)
- ✅ Upload middleware (Multer)
- ✅ Authentication middleware (JWT)

---

## ⚙️ **Configuration**

### **Environment Variables**

`.env` file mein ye variables add karo:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database

# Firebase (for push notifications & media)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# JWT (if not already configured)
JWT_SECRET=your_jwt_secret

# Server
PORT=3000
```

### **Firebase Setup** (Optional - agar push notifications chahiye)

```typescript
// src/api/helpers/firebaseConfig.ts
import admin from 'firebase-admin'

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
})

export const admin = admin
export const imageBucket = admin.storage().bucket()
```

---

## 🧪 **Testing**

### **1. Database Tables Verify Karo**

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversations_participant', 'message');
```

### **2. API Endpoints Test Karo**

**Postman/Thunder Client** use karke test karo:

```bash
# Create Conversation
POST http://localhost:3000/api/v1/chat/create-conversation
Headers: Authorization: Bearer <token>
Body: {
  "type": "one-to-one",
  "partcipants": [{"user_id": 2}]
}

# Get Conversations
GET http://localhost:3000/api/v1/chat/conversations
Headers: Authorization: Bearer <token>

# Get Messages
GET http://localhost:3000/api/v1/chat/messages/1?page=1&limit=20
Headers: Authorization: Bearer <token>
```

### **3. Socket.IO Test Karo**

**Socket.IO Client** use karke test karo:

```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3000')

// Join personal room
socket.emit('join_self', { user_id: 1 })

// Join conversation room
socket.emit('join_room', { conversation_id: 1, user_id: 1 })

// Send message
socket.emit('send_message', {
  conversation_id: 1,
  sender_id: 1,
  content: "Hello!",
  message_type: "text"
}, (response) => {
  console.log('Message sent:', response)
})

// Listen for new messages
socket.on('new_message_received', (data) => {
  console.log('New message:', data)
})
```

---

## 🎯 **Important Points**

### **1. Dependencies Adjust Karo**

- Agar apne project mein **different database** use kar rahe ho (MySQL, MongoDB), to entities accordingly modify karo
- Agar **Firebase nahi use** kar rahe, to media upload logic change karo
- Agar **different auth system** hai, to `verifyToken` middleware adjust karo

### **2. Customization**

- Message types customize kar sakte ho (text, image, video, file, location)
- Notification logic customize kar sakte ho
- Response format customize kar sakte ho

### **3. Error Handling**

- Try-catch blocks add karo
- Proper error messages return karo
- Logging implement karo

### **4. Security**

- CORS properly configure karo
- Rate limiting add karo (optional)
- Input validation add karo
- SQL injection prevention (TypeORM already handles this)

---

## 📝 **Quick Checklist**

- [ ] Dependencies install kiye
- [ ] Database migrations run kiye
- [ ] Entities copy kiye
- [ ] Models copy kiye
- [ ] Controllers copy kiye
- [ ] Routes register kiye
- [ ] Socket.IO setup kiya
- [ ] Environment variables set kiye
- [ ] Firebase configured (if needed)
- [ ] API endpoints tested
- [ ] Socket.IO events tested
- [ ] Error handling verified

---

## 🚀 **Next Steps**

1. **Real-time messaging** - Socket.IO events test karo
2. **Push notifications** - Firebase setup verify karo
3. **Media uploads** - File upload functionality test karo
4. **Read receipts** - Message read status verify karo
5. **Typing indicators** - Typing status test karo

---

## ❓ **Common Issues & Solutions**

### **Issue 1: Socket.IO Connection Failed**
- **Solution:** CORS configuration check karo
- Port properly expose hai ya nahi verify karo

### **Issue 2: Database Migration Errors**
- **Solution:** TypeORM entities properly register kiye hain ya nahi check karo
- Database connection verify karo

### **Issue 3: Push Notifications Not Working**
- **Solution:** Firebase credentials verify karo
- Device tokens properly save ho rahe hain ya nahi check karo

### **Issue 4: Media Upload Failing**
- **Solution:** Firebase Storage bucket permissions check karo
- Multer configuration verify karo

---

## 📞 **Support**

Agar koi issue aaye to:
1. Error logs check karo
2. Database queries verify karo
3. Socket.IO events properly emit ho rahe hain ya nahi check karo
4. Authentication middleware properly configured hai ya nahi verify karo

---

**Happy Coding! 🎉**


