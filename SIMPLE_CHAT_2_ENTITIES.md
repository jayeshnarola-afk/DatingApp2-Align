# 🚀 Simple Chat Module - Sirf 2 Entities

## Minimum 2 Entities Ke Saath Chat Setup

---

## ✅ **2 Core Entities:**

1. **`Conversation`** - Chat conversations store karta hai
2. **`Message`** - Messages store karta hai

**Note:** Agar read receipts, last read message tracking, notification mute chahiye to 3rd entity `ConversationParticipant` bhi chahiye.

---

## 📁 **Files Copy Karo:**

### **1. Entities (Sirf 2 Files)**

```
src/api/domain/entities/
├── ✅ conversation.entities.ts
└── ✅ message.entity.ts
```

### **2. Models (2 Files)**

```
src/api/domain/models/
├── ✅ conversation.model.ts
└── ✅ message.model.ts
```

### **3. Controller (1 File)**

```
src/api/interface/controllers/app/admin/
└── ✅ conversationController.ts
```

### **4. Socket.IO (1 File)**

```
src/infrastructure/webserver/socket/
└── ✅ socket.io.ts (sirf chat events copy karo)
```

### **5. Routes (Add to existing file)**

Routes ko apne existing routes file mein add karo:
- `POST /chat/create-conversation`
- `GET /chat/conversations`
- `GET /chat/messages/:conversation_id`
- `POST /chat/message/send-message`

### **6. Helper Files**

```
src/api/domain/responseDto/
└── ✅ userResponseDto.ts (formatMessage function)

src/api/middlewares/
├── ✅ uploadMedia.ts
└── ✅ verifyToken.ts

src/api/helpers/
└── ✅ apiResponse.ts
```

---

## 🗄️ **Simplified Database Structure**

### **1. Conversation Entity (Simplified)**

```typescript
// src/api/domain/entities/conversation.entities.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Message } from "./message.entity";

@Entity({name: "conversations"})
export class Conversation {
    @PrimaryGeneratedColumn()
    "id": number;
    
    @Column({
        type: "enum",
        enum: ["one-to-one", "group"]
    })
    "type": "one-to-one" | "group";

    @Column({type: "simple-array", nullable: true})
    "participant_ids": number[]; // Direct participants store kar sakte ho

    @CreateDateColumn()
    "created_at": Date;
    
    @OneToMany(() => Message, (message) => message.conversation)
    "messages": Message[]
}
```

### **2. Message Entity (Same as Original)**

```typescript
// src/api/domain/entities/message.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Conversation } from "./conversation.entities";
import { Users } from "./users.enities";

@Entity({name: "message"})
export class Message {
    @PrimaryGeneratedColumn()
    "id":number;

    @Column({type:"int", nullable: false})
    "conversation_id": number;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {onDelete: "CASCADE"})
    @JoinColumn({name: "conversation_id"})
    "conversation": Conversation;

    @Column({type: "int", nullable: false})
    "sender_id": number;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "sender_id"})
    "sender": Users;

    @Column({type: "text", nullable: true})
    "content": string;
    
    @Column({type: "varchar", length: 50})
    "message_type": "text" | "image" | "video" | "file" | "location";

    @Column({type: "json", nullable: true})
    "images":object

    @Column({type: "varchar", length:50, default: "sent"})
    "status": string;   // sent, delivered, read

    @Column({type: "varchar",length:255, default: null})
    "media_url": string;

    @CreateDateColumn()
    "created_at": Date;

    @UpdateDateColumn()
    "updated_at": Date;
    
    @Column({type: "timestamp", nullable: true})
    "deleted_at": Date
}
```

---

## 📦 **Dependencies**

```bash
npm install socket.io typeorm multer firebase-admin jsonwebtoken express cors dotenv

npm install -D @types/multer @types/node @types/express @types/jsonwebtoken typescript
```

---

## 🗄️ **Database Migrations (2 Tables)**

### **1. Create Conversations Table**

```typescript
// migration: create_conversations.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateConversations1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "conversations",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "type",
                        type: "enum",
                        enum: ["one-to-one", "group"],
                        default: "'one-to-one'"
                    },
                    {
                        name: "participant_ids",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("conversations");
    }
}
```

### **2. Create Message Table**

```typescript
// migration: create_message_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateMessageTable1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "message",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "conversation_id",
                        type: "int"
                    },
                    {
                        name: "sender_id",
                        type: "int"
                    },
                    {
                        name: "content",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "message_type",
                        type: "varchar",
                        length: "50",
                        default: "'text'"
                    },
                    {
                        name: "images",
                        type: "json",
                        isNullable: true
                    },
                    {
                        name: "media_url",
                        type: "varchar",
                        length: "255",
                        isNullable: true
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "50",
                        default: "'sent'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            }),
            true
        );

        // Foreign Keys
        await queryRunner.createForeignKey(
            "message",
            new TableForeignKey({
                columnNames: ["conversation_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "conversations",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "message",
            new TableForeignKey({
                columnNames: ["sender_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("message");
    }
}
```

---

## ⚙️ **Simplified Model Functions**

### **Create Conversation (Simplified)**

```typescript
// src/api/domain/models/conversation.model.ts
export async function addConversations(
    reqBody: any,
    userId: number,
    callback: (error: any, result: any) => void
) {
    try {
        const conversationRepository = AppDataSource.getRepository(Conversation);
        const { type, participants } = reqBody;

        // Check if one-to-one conversation already exists
        if (type === 'one-to-one') {
            const receiverId = participants.find((p: any) => p.user_id !== userId)?.user_id;
            if (receiverId) {
                const existing = await conversationRepository
                    .createQueryBuilder('conv')
                    .where('conv.type = :type', { type: 'one-to-one' })
                    .andWhere('conv.participant_ids LIKE :userId', { userId: `%${userId}%` })
                    .andWhere('conv.participant_ids LIKE :receiverId', { receiverId: `%${receiverId}%` })
                    .getOne();

                if (existing) {
                    return callback(null, existing);
                }
            }
        }

        // Create new conversation
        const participantIds = [...participants.map((p: any) => p.user_id), userId];
        const conversation = conversationRepository.create({
            type,
            participant_ids: participantIds.join(',')
        });

        const saved = await conversationRepository.save(conversation);
        return callback(null, saved);
    } catch (error) {
        return callback(error, null);
    }
}
```

### **Get Messages (Simplified)**

```typescript
// src/api/domain/models/message.model.ts
export async function getMessages(
    conversation_id: number,
    page: number = 1,
    limit: number = 20
) {
    const messageRepository = AppDataSource.getRepository(Message);
    const skip = (page - 1) * limit;

    const [messages, total] = await messageRepository.findAndCount({
        where: { conversation_id },
        relations: ['sender'],
        order: { created_at: 'DESC' },
        skip,
        take: limit
    });

    return {
        messages,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
```

---

## 🔌 **Socket.IO Events (Simplified)**

```typescript
// src/infrastructure/webserver/socket/socket.io.ts
socket.on("send_message", async (data, callback) => {
    const { conversation_id, sender_id, content, message_type } = data;
    
    try {
        // Save message to database
        const message = await addMessage(conversation_id, sender_id, content, message_type);
        
        // Emit to conversation room
        io.to(`room_${conversation_id}`).emit("receive_message", message);
        
        // Emit to personal rooms
        io.to(`personal_data_${sender_id}`).emit("new_message_received", message);
        
        if (callback) {
            callback({ resStatus: "success", ...message });
        }
    } catch (error) {
        if (callback) {
            callback({ resStatus: "failed" });
        }
    }
});

socket.on("join_room", (data) => {
    const { conversation_id, user_id } = data;
    socket.join(`room_${conversation_id}`);
    socket.emit("room_joined", { conversation_id });
});
```

---

## ✅ **Quick Checklist**

- [ ] 2 Entities copy kiye (`Conversation`, `Message`)
- [ ] 2 Models copy kiye
- [ ] Controller copy kiya
- [ ] Socket.IO events add kiye
- [ ] Routes add kiye
- [ ] Migrations run kiye
- [ ] TypeORM config mein entities register kiye
- [ ] Express server mein Socket.IO setup kiya

---

## 🎯 **Key Differences (Simplified vs Full Version)**

| Feature | Simplified (2 Entities) | Full Version (3 Entities) |
|---------|-------------------------|--------------------------|
| Basic Chat | ✅ | ✅ |
| Group Chat | ✅ | ✅ |
| Read Receipts | ❌ | ✅ |
| Last Read Message | ❌ | ✅ |
| Notification Mute | ❌ | ✅ |
| Participant Management | Basic (array) | Advanced (separate table) |

**Agar read receipts chahiye, to `ConversationParticipant` entity bhi add karo!**

---

## 🚀 **Quick Start**

1. **Entities copy karo** - `Conversation` aur `Message`
2. **Migrations run karo** - 2 tables create hongi
3. **Models copy karo** - Business logic
4. **Socket.IO setup karo** - Real-time messaging
5. **Routes add karo** - API endpoints

**Done! Chat ready hai! 🎉**


