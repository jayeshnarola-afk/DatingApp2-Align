# 💬 Chat Module - Complete Code & Setup Guide

## Complete Chat Module Ka Pura Code - Kisi Bhi Project Mein Use Karne Ke Liye

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Dependencies](#dependencies)
3. [Database Setup](#database-setup)
4. [Entities (Database Models)](#entities-database-models)
5. [Models (Business Logic)](#models-business-logic)
6. [Controllers](#controllers)
7. [Routes](#routes)
8. [Socket.IO Setup](#socketio-setup)
9. [Response DTOs](#response-dtos)
10. [Middlewares](#middlewares)
11. [Helpers](#helpers)
12. [Migrations](#migrations)
13. [Configuration](#configuration)
14. [Usage Examples](#usage-examples)

---

## 🔧 **Prerequisites**

- Node.js & TypeScript installed
- PostgreSQL Database
- TypeORM configured
- Express.js server
- Socket.IO installed
- Firebase Admin SDK (optional - for push notifications & media uploads)

---

## 📦 **Dependencies**

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

**Install:**
```bash
npm install socket.io typeorm multer firebase-admin jsonwebtoken express cors dotenv
npm install -D @types/multer @types/node @types/express @types/jsonwebtoken typescript
```

---

## 🗄️ **Database Setup**

Chat module ke liye **4 tables** chahiye:

1. **`conversations`** - Chat conversations
2. **`conversations_participant`** - Participants & read receipts
3. **`message`** - Messages
4. **`message_meetings`** - Location/dating messages (optional)

---

## 📁 **1. Entities (Database Models)**

### **1.1. Conversation Entity**

```typescript
// src/api/domain/entities/conversation.entities.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ConversationParticipant } from "./conversation.participant.entities";
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

    @CreateDateColumn()
    "created_at": Date;
    
    @OneToMany(() => ConversationParticipant, (participant) => participant.conversation)
    "participants": ConversationParticipant[]

    @OneToMany(() => Message, (message) => message.conversation)
    "messages": Message[]
}
```

### **1.2. Conversation Participant Entity**

```typescript
// src/api/domain/entities/conversation.participant.entities.ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entities";
import { Users } from "./users.enities";

@Entity({name: "conversations_participant"})
export class ConversationParticipant {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "int", nullable: false})
    "conversation_id": number;

    @ManyToOne(() => Conversation, (conversation) => conversation.participants, {onDelete: "CASCADE"})
    @JoinColumn({ name: 'conversation_id'})
    "conversation": Conversation;

    @Column({type: "int", nullable: false})
    "user_id": number;
    
    @ManyToOne(() => Users, (user) => user.conversations, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    "user": Users;
    
    @Column({type: "enum",enum:["admin","member"], default:"'member'"})
    "role": "admin" | "member";

    @Column({type: "int", nullable: true})
    "last_cleared_message_id": number;

    @Column({type: "int", nullable: true})
    "last_read_message_id": number;

    @Column({type: "boolean", default: false})
    "is_notification_mute": boolean

    @Column({type: "boolean", default:false})
    "is_unmatched_user": boolean;
}
```

### **1.3. Message Entity**

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

    @Column({type: "bigint", nullable:true})
    "message_id": number;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {onDelete: "CASCADE"})
    @JoinColumn({name: "conversation_id"})
    "conversation": Conversation;

    @Column({type: "int", nullable: false})
    "sender_id": number;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "sender_id"})
    "sender": Users;

    @Column({type: "boolean", default: true})
    "is_location_active": boolean;

    @Column({type:"timestamp",default: null, nullable: true})
    "schedule_time": Date | null;

    @Column({type:"varchar",length:50,  nullable: true,default:null})
    "meeting_status": "pending" | "confirmed" | "rescheduled" | "canceled" | "rejected" | "expired" | "completed" | null;

    @Column({type: "text", nullable: true})
    "content": string;

    @Column({type:"boolean",default: false})
    "is_deleted_by_admin": boolean;
    
    @Column({type: "varchar", length: 50})
    "message_type": "text" | "image" | "video" | "file" | "location";

    @CreateDateColumn()
    "created_at": Date;

    @UpdateDateColumn()
    "updated_at": Date;

    @Column({type: "json", nullable: true})
    "images":object

    @Column({type: "varchar", length:50, default: "sent"})
    "status": string;   // sent, delivered, read

    @Column({type: "varchar",length:255, default: null})
    "media_url": string;
    
    @Column({type: "timestamp", nullable: true})
    "deleted_at": Date
}
```

---

## 📁 **2. Models (Business Logic)**

### **2.1. Message Model**

```typescript
// src/api/domain/models/message.model.ts
import { Not } from "typeorm";
import { AppDataSource } from "../../config/db"
import { Conversation } from "../entities/conversation.entities";
import { ConversationParticipant } from "../entities/conversation.participant.entities";
import { Message } from "../entities/message.entity"
import { Users } from "../entities/users.enities";
import { uploadMultipleToFirebase } from "../../middlewares/uploadMedia";

export async function addMessage(
    conversation_id:any, 
    sender_id:any, 
    content:any, 
    message_type:any,
    images:any,
    files:any,
    cafe_location:any,
    schedule_time: Date | null,
    meeting_status: string | null, 
    message_id: number,
    messageCreatedDate: Date, 
    callback:(error:any, result:any)=> void
){
    try {
        const messageRepository = await AppDataSource.getRepository(Message);
        const now = new Date()

        const message = messageRepository.create({
            conversation: {id: conversation_id},
            sender: {id: sender_id},
            content: content,
            message_type: message_type,
            images: (message_type === "media") ? images : null,
            schedule_time: schedule_time,
            meeting_status: meeting_status ? "pending" : null,
            message_id: message_id,
            created_at: messageCreatedDate
        })

        if(files){
            const reqFiles = files as Express.Multer.File[];
            const fileUrls = await uploadMultipleToFirebase(reqFiles, sender_id)
            message.media_url = fileUrls[0]     
        }

        await messageRepository.save(message)
        const message_details = await getMessageDetails(conversation_id, message.id)
        
        return callback(null,message_details)
    } catch (error) {
        return callback(error,[])
    }
}

export async function getMessageDetails(conversation_id: number, message_id:number){
    try {
        const messageRepository = AppDataSource.getRepository(Message);
        const conversationRepository = AppDataSource.getRepository(ConversationParticipant);

        const message = await messageRepository.findOne({
            where: {id: message_id, conversation_id: conversation_id},
            relations: ['sender']
        })
        
        const senderId = message?.sender.id
        if(!senderId){
            throw new Error("SenderId is required.")
        }

        const receiver = await conversationRepository.find({
            where: {conversation_id: conversation_id, user_id: Not(message?.sender.id) },
            relations: ['user']
        })
        
        const message_details = {
            ...message,
            sender: message?.sender,
            receiver: receiver
        }
        
        return message_details;
    } catch (error) {
        throw new Error(`Failed to send getMessageDetails`)
    }
}
```

### **2.2. Conversation Model (Key Functions)**

```typescript
// src/api/domain/models/conversation.model.ts
import { ILike, In, MoreThan, Not } from "typeorm";
import { AppDataSource } from "../../config/db";
import { Conversation } from "../entities/conversation.entities";
import { ConversationParticipant } from "../entities/conversation.participant.entities";
import { Users } from "../entities/users.enities";
import { getIo } from "../../../infrastructure/webserver/express";
import { Message } from "../entities/message.entity";
import { formatMessage, formatParticipant } from "../responseDto/userResponseDto";
import { addMessage } from "./message.model";

// Create Conversation
export async function addConversations(
    reqBody: any,
    userId: number,
    callback: (error: any, result: any) => void
) {
    try {
        const conversationRepository = AppDataSource.getRepository(Conversation);
        const participantRepository = AppDataSource.getRepository(ConversationParticipant);
        const userRepository = AppDataSource.getRepository(Users);
        const messageRepo = AppDataSource.getRepository(Message)

        let participants = reqBody.partcipants;
        if (typeof reqBody.participants === "string") {
            participants = JSON.parse(reqBody.participants);
        }

        if (!participants.some((participant: { user_id: number }) => participant.user_id === userId)) {
            return callback(`Current user with ID ${userId} is not in the participants list.`, null);
        }

        const currentUser = await userRepository.findOne({ where: { id: userId } });

        // One-to-One Conversation Handling
        if (reqBody.type === 'one-to-one') {
            const receiverUser = participants.find(
                (participant: { user_id: number }) => participant.user_id !== userId
            );
            if (!receiverUser) {
                return callback("Receiver user ID is missing for one-to-one conversation.", null);
            }
            const receiverUserId = receiverUser.user_id;

            // Check if conversation already exists
            const existingConversation = await conversationRepository
                .createQueryBuilder('conversation')
                .innerJoin('conversation.participants', 'cp1')
                .innerJoin('conversation.participants', 'cp2')
                .where('conversation.type = :type', { type: 'one-to-one' })
                .andWhere('cp1.user_id = :userId', { userId })
                .andWhere('cp2.user_id = :receiverUserId', { receiverUserId })
                .getOne();

            if (existingConversation) {
                const getConversation = await conversationRepository
                    .createQueryBuilder("conversation")
                    .leftJoinAndSelect("conversation.participants","participants")
                    .leftJoinAndSelect("conversation.messages","messages")
                    .leftJoinAndSelect("participants.user","user")
                    .where("conversation.id = :conversationId", {conversationId: existingConversation.id})
                    .orderBy("messages.created_at","DESC")
                    .getOne();
        
                const otherParticipant = getConversation?.participants.filter(p => p.user_id !== userId) ?? []

                const unreadCount = await messageRepo.count({
                    where: {
                        conversation_id: existingConversation.id,
                        sender_id: Not(userId),
                        id: MoreThan(otherParticipant[0]?.last_read_message_id || 0),
                        status: "sent"
                    }
                });
        
                const latestMessage = await messageRepo.findOne({
                    where: { conversation_id: existingConversation.id},
                    order: { created_at: "DESC" },
                    relations: ["sender"],
                });
        
                const response = {
                    id: existingConversation.id,
                    type: existingConversation.type,
                    created_at: existingConversation.created_at,
                    participant: formatParticipant(otherParticipant[0]),
                    last_message: latestMessage ? formatMessage(latestMessage) : null,
                    unread_count: unreadCount ?? 0,
                };

                return callback(null, response);
            }

            const receiverUserDetails = await userRepository.findOne({ where: { id: receiverUserId } });

            if (!currentUser || !receiverUserDetails) {
                return callback("User details not found.", null);
            }
        }

        // Create new conversation
        const conversation = conversationRepository.create({
            type: reqBody.type,
        });
        await conversationRepository.save(conversation);

        // Prepare participants list
        const participantsToSave = participants.map((participant: { user_id: number; role?: string }) => {
            return participantRepository.create({
                conversation_id: conversation.id,
                user: { id: participant.user_id },
                role: "member"
            });
        });

        await participantRepository.save(participantsToSave);

        const getConversation = await conversationRepository
            .createQueryBuilder("conversation")
            .leftJoinAndSelect("conversation.participants","participants")
            .leftJoinAndSelect("conversation.messages","messages")
            .leftJoinAndSelect("participants.user","user")
            .where("conversation.id = :conversationId", {conversationId: conversation.id})
            .orderBy("messages.created_at","DESC")
            .getOne();
        
        const otherParticipant = getConversation?.participants.filter(p => p.user_id !== userId) ?? []

        const unreadCount = await messageRepo.count({
            where: {
                conversation_id: conversation.id,
                sender_id: Not(userId),
                id: MoreThan(otherParticipant[0]?.last_read_message_id || 0),
                status: "sent"
            }
        });
        
        const latestMessage = await messageRepo.findOne({
            where: { conversation_id: conversation.id},
            order: { created_at: "DESC" },
            relations: ["sender"],
        });
        
        const response = {
            id: conversation.id,
            type: conversation.type,
            created_at: conversation.created_at,
            participant: formatParticipant(otherParticipant[0]),
            last_message: latestMessage ? formatMessage(latestMessage) : null,
            unread_count: unreadCount ?? 0,
        };
        return callback(null, response);

    } catch (error) {
        console.error("Error in addConversations:", error);
        return callback(error, null);
    }
}

// Get Conversations List
export async function getChatConversations(
    userId: number,
    page: number,
    limit: number,
    search: string,
    callback: (error: any, result: any) => void
) {
    try {
        const skip = (page - 1) * limit;
        const conversationsRepo = AppDataSource.getRepository(Conversation);
        const participantRepo = AppDataSource.getRepository(ConversationParticipant);
        const messageRepo = AppDataSource.getRepository(Message);

        const participantEntries = await participantRepo.find({
            where: { user: { id: userId }, is_unmatched_user: false },
            relations: ["conversation","conversation.participants","conversation.participants.user"],
        });

        const conversationsIds = participantEntries.map(entry => entry.conversation.id);

        if (!conversationsIds.length) {
            return callback(null, {
                conversations: [],
                pagination: {
                    total: 0,
                    currentPage: page,
                    totalPages: 0
                }
            });
        }

        let query = await conversationsRepo
            .createQueryBuilder("conversation")
            .leftJoinAndSelect("conversation.participants", "participants")
            .leftJoinAndSelect("participants.user", "user")
            .where("conversation.id IN (:...conversationIds)", { conversationIds: conversationsIds});
        
        if (search && search.trim() !== "") {
            query = query.andWhere("(user.name ILIKE :search)", { search: `%${search}%` });
        }

        const [conversations, total] = await query
            .orderBy("conversation.created_at", "DESC")
            .getManyAndCount();

        const conversationsWithLatestMessage = await Promise.all(
            conversations.map(async (convo) => {
                const participantEntry = convo.participants.find(p => p.user_id === userId);
                const otherParticipant = convo.participants.find(p => p.user_id !== userId);

                if (!otherParticipant) {
                    return null;
                }

                const lastReadMessageId = participantEntry?.last_read_message_id ?? 0;

                const unreadCount = await messageRepo.count({
                    where: {
                        conversation_id: convo.id,
                        sender_id: Not(userId),
                        id: MoreThan(lastReadMessageId),
                        status: "sent"
                    }
                });

                const latestMessage = await messageRepo.findOne({
                    where: { conversation_id: convo.id },
                    order: { created_at: "DESC" },
                    relations: ["sender"],
                });

                return {
                    id: convo.id,
                    type: convo.type,
                    created_at: convo.created_at,
                    participant: formatParticipant(otherParticipant),
                    last_message: latestMessage ? formatMessage(latestMessage) : null,
                    unread_count: unreadCount,
                    is_notification_mute: participantEntry?.is_notification_mute
                };
            })
        );

        const filteredConversations = conversationsWithLatestMessage.filter(Boolean);

        filteredConversations.sort((a, b) => {
            const aTime = a?.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0
            const bTime = b?.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0
            return bTime - aTime;
        });
        
        const pagination = {
            total: filteredConversations.length,
            currentPage: page,
            totalPages: Math.ceil(filteredConversations.length / limit)
        };

        return callback(null, {
            conversations: filteredConversations,
            pagination
        });

    } catch (error) {
        console.log("errr....", error);
        return callback(error, null);
    }
}

// Get Messages
export async function messagesOfChat(
    userId: number,
    conversation_id: number,
    page: number,
    limit:number,
    search: string,
    callback:(error:any, result:any) => void
){
    try {
        const skip = (page - 1) * limit;
        const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);
        const messageRepo = AppDataSource.getRepository(Message);

        const whereClause:any = {
            conversation_id,
        } 
        
        if(search){
            whereClause.content = ILike(`%${search}%`)
        }
        
        const participant = await conversationParticipantRepo.findOne({
            where: {conversation_id, user_id:userId}
        });
        
        if(participant?.last_cleared_message_id){
            whereClause.id = MoreThan(participant?.last_cleared_message_id);
        }
        
        const [messages, total] = await messageRepo.findAndCount({
            where: whereClause,
            relations:["sender"],
            order: {
                created_at:"DESC"
            },
            skip,
            take:limit
        })

        const formatMessages = messages.map(msg => formatMessage(msg))
        
        const pagination = {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        }

        return callback(null, {
            messages: formatMessages,
            pagination
        })
    } catch (error) {
        return callback(error, null)
    }
}

// Send Media Message
export async function sendMediaMessage(
    userId: number,
    reqBody: any,
    files: any,
    callback:(error:any, result:any) => void
){
    const {conversation_id,  content, message_type, images, message_id, created_at} = reqBody
    try {
        const messageCreatedDate = created_at ? new Date(created_at) : new Date()
        const messageId = message_id || Date.now()

        const io = getIo();
        await addMessage(conversation_id,userId, content, message_type, images, files, null,null,null, messageId,messageCreatedDate ,async (error:any, result: any) => {
            if(error){
                return callback(error,null)
            }else{
                console.log("Message sent successfully.")
                io.to(`room_${conversation_id}`).emit("receive_message", reqBody)
                
                await Promise.all(
                    result.receiver.map(async (receiver:any) => {
                        const response = formatMessage(result)
                        io.to(`personal_data_${receiver.user_id}`).emit("new_message_received", {
                            ...response,
                            message_id: messageId,
                            created_at: messageCreatedDate
                        })
                    })
                )
                
                const response = formatMessage(result)
                return callback(null, {...response, message_id: messageId})
            }
        })
        
    } catch (error) {
        return callback(error,null)
    }
}
```

---

## 📁 **3. Controllers**

```typescript
// src/api/interface/controllers/app/admin/conversationController.ts
import { Request, Response } from "express";
import { logger } from "../../../../lib/logger";
import { ErrorResponse, successResponse } from "../../../../helpers/apiResponse";
import { addConversations, getChatConversations, findOneConversation, messagesOfChat, sendMediaMessage } from "../../../../domain/models/conversation.model";

// Create Conversation
export const createConversation = async(req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const {type, partcipants} = req.body;
        if(!type || !partcipants || partcipants.length === 0){
            return ErrorResponse(res, "Invalid input data");
        }
        partcipants.push({"user_id":userId})
        await addConversations(req.body, userId, (error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Conversation created successfully.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            logger.error(JSON.stringify(error))
            return ErrorResponse(res, error.message)
        }
    }
}

// Get Conversations List
export const getConversations = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search?.toString() || "";
    try {
        getChatConversations(userId, page,limit,search,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res,"Conversations Lists.",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

// Get One Conversation
export const getOneConversation = async(req: Request, res: Response) => {
    const conversation_id = parseInt(req.params.conversation_id);
    const userId = req.user.userId;

    try {
        findOneConversation(conversation_id,userId,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Conversation details.",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

// Get Messages
export const getMessagesOfChatId = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const conversation_id = Number(req.params.conversation_id)
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20
    const search = String(req.query.search) || ""

    try {
        messagesOfChat(userId,conversation_id,page,limit,search,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res,error)
            }
            return successResponse(res,"Messages of chat",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

// Send Media Message
export const sendMediaMessageApi = async (req: Request, res: Response) => {
    try {
        const reqBody = req.body;
        const userId = req.user.userId
        const files = req.files;
        sendMediaMessage(userId,reqBody,files,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Message sent successfully.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}
```

---

## 📁 **4. Routes**

```typescript
// src/api/interface/routes/app.routes.ts
import express from 'express';
import { verifyToken } from '../../middlewares/verifyToken';
import { upload } from '../../middlewares/uploadMedia';
import {
    createConversation,
    getConversations,
    getOneConversation,
    getMessagesOfChatId,
    sendMediaMessageApi
} from '../../interface/controllers/app/admin/conversationController';

const route = express.Router();

export const AdminRoute = (router: express.Router): void => {
    router.use("/v1", route);

    // Chat routes
    route.post("/chat/create-conversation", verifyToken, createConversation)
    route.get("/chat/conversations", verifyToken, getConversations)
    route.get("/chat/conversation/:conversation_id", verifyToken, getOneConversation)
    route.get("/chat/messages/:conversation_id", verifyToken, getMessagesOfChatId)
    route.post("/chat/message/send-message", verifyToken, upload.array("files",5), sendMediaMessageApi)
};
```

---

## 📁 **5. Socket.IO Setup**

### **5.1. Express Server Setup**

```typescript
// src/infrastructure/webserver/express/index.ts
import { env } from '../../env'
import express from 'express'
import bodyParser from 'body-parser'
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
    const port = env.APPPORT;
    const host = env.HOST;

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    // CORS
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Credentials", 'true');
        res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.header("Access-Control-Allow-Headers", "x-requested-with");
        res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });

    // Create HTTP server
    const server = createHttpServer(app);

    // Initialize Socket.IO
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // API Routes
    app.use("/api", createRouter());

    // Socket.IO Events
    handleSocketEvents(io)

    // Listen on Port
    server.listen(port, () => {
        console.log(`Server running on http://${host}:${port}`);
    });
};
```

### **5.2. Socket.IO Events**

```typescript
// src/infrastructure/webserver/socket/socket.io.ts
import { Server } from "socket.io";
import { AppDataSource } from "../../../api/config/db";
import { Users } from "../../../api/domain/entities/users.enities";
import { addMessage } from "../../../api/domain/models/message.model";
import { getConversationDetails, getConversationsInfo } from "../../../api/domain/models/conversation.model";
import { ConversationParticipant } from "../../../api/domain/entities/conversation.participant.entities";
import { Message } from "../../../api/domain/entities/message.entity";
import { Not } from "typeorm";
import { formatMessage } from "../../../api/domain/responseDto/userResponseDto";

interface UserSocketMap {
    [userId: string]: string
}

export const connectedSocketUser: UserSocketMap = {} 

export const handleSocketEvents = (io:Server) => {
    io.on("connection", (socket) => {
        console.log("New client connected successfully:", socket.id);

        // Join personal room
        socket.on("join_self", (data) => {
            const {user_id} = data;
            socket.join(user_id)
            connectedSocketUser[user_id] = socket.id;
            socket.join(`personal_data_${data.user_id}`)
            socket.emit("join_self",{user_id})
        });

        // Join conversation room
        socket.on("join_room",async(data): Promise<any> => {
            const {conversation_id, user_id} = data

            if(!conversation_id || !user_id){
                return socket.emit("error_message",{message: "Invalid room or user_id."})
            }
            
            socket.join(`room_${conversation_id}`);
            console.log(`User ${user_id} joined room_${conversation_id}`);
            socket.emit("room_joined",{conversation_id})
        });

        // Send Message
        socket.on("send_message", async (data, callback):Promise<any> => {
            const {conversation_id, sender_id, content, message_type, images, message_id, created_at} = data
            const messageCreatedDate = created_at ? new Date(created_at) : new Date()
            const messageId = message_id || Date.now();
            
            try {
                const userRepo = AppDataSource.getRepository(Users)
                await addMessage(conversation_id,sender_id, content, message_type, images,[],null,null, null,messageId,messageCreatedDate,async(error:any, result:any): Promise<any> => {
                    if(error){
                        if(callback){
                            callback({resStatus:"failed"})
                        }
                        console.log("Error sending message:",error)
                    }else{
                        console.log("Message successfully sent.");
                        const sender = await userRepo.findOne({where:{id: sender_id} });
                        if(!sender){
                            return socket.emit("error_message",{message: "Sender not found"})
                        }
                        const conversation = await getConversationDetails(sender_id, conversation_id)
                        
                        io.to(`room_${conversation_id}`).emit("receive_message", data)
                        const response = formatMessage(result)
                        
                        if(callback){
                            callback({...response,resStatus:"success",created_at: messageCreatedDate,message_id: messageId})
                        }

                        io.to(`personal_data_${sender_id}`).emit("new_message_received",{
                            ...response,
                            created_at: messageCreatedDate,
                            message_id: messageId
                        })
                        
                        for (const receiver of result.receiver) {
                            io.to(`personal_data_${receiver.user_id}`).emit("new_message_received",{
                                ...response,
                                created_at: messageCreatedDate,
                                message_id: messageId
                            })
                        }
                    }
                })
            } catch (error) {
                if(callback){
                    callback({resStatus:"failed"})
                }
                console.error("Error sending message:",error);
                socket.emit("error_message", {message: "Failed to send message."})
            }
        })

        // Mark as Read
        socket.on("mark_as_read", async (data):Promise<any>=>{
            const {conversation_id, user_id, last_read_message_id} = data;
            try {
                const participantRepo = AppDataSource.getRepository(ConversationParticipant);
                const messageRepo = AppDataSource.getRepository(Message);

                // Update last_read_message_id
                await participantRepo.update(
                    {
                        conversation_id: conversation_id,
                        user_id: user_id
                    },{
                        last_read_message_id: last_read_message_id
                    }
                )
                
                // Update all unseen message as "read"
                await messageRepo.createQueryBuilder()
                .update()
                .set({status: "read"})
                .where("conversation_id = :conversation_id", {conversation_id: conversation_id})
                .andWhere("id <= :lastReadMessageId",{lastReadMessageId: last_read_message_id})
                .andWhere("sender_id != :userId",{userId: user_id})
                .andWhere("status != 'read'")
                .execute();
                
                const messager_sender = await participantRepo.findOne({where:{conversation_id: conversation_id, user_id: Not(user_id)} });            

                io.to(`personal_data_${messager_sender?.user_id}`).emit("messages_read", {
                    conversation_id,
                    user_id,
                    message_sender_id: messager_sender?.user_id,
                    last_read_message_id
                })
                
            } catch (error) {
                console.log(error)
                socket.emit("error_message",{message: "Something is wrong in mark_as_read"})
            }
        })
        
        // Typing Indicator
        socket.on("typing",async(data): Promise<any>=>{
            const {conversation_id, sender_id, is_typing} = data
            try {
                const ConversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant)

                const participant = await ConversationParticipantRepo.findOne({where:{conversation_id: conversation_id, user_id: Not(sender_id)} })

                if (!participant) {
                    return socket.emit("typing_error", { message: "Other participant not found." });
                }

                if(participant){
                    io.to(`personal_data_${participant.user_id}`).emit("typing_status",{conversation_id, sender_id, is_typing})
                }
            } catch (error) {
                socket.emit("error_message",{message: "Something is wrong in typing"})
            }
        })
    
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
}
```

---

## 📁 **6. Response DTOs**

```typescript
// src/api/domain/responseDto/userResponseDto.ts

export interface FormattedMessage {
    id: number;
    message_id: number;
    conversation_id: number;
    content: string;
    created_at: Date;
    message_type: string;
    status: string;
    images: any;
    media_url:string;
    sender:{
        id: number;
        name: string,
        username: string,
        profile_image: string | null,
        is_online: boolean,
        latitude: number,
        longitude: number
    } | null,
    is_location_active: boolean,
    schedule_time: Date | null,
    meeting_status: string
}

export function formatMessage(message: any): FormattedMessage {
    return {
        id: message.id,
        message_id: Number(message.message_id),
        conversation_id: message.conversation_id,
        content: message.content,
        created_at: message.created_at,
        message_type: message.message_type,
        status: message.status,
        images: message.images,
        media_url: message.media_url,
        sender: message.sender ? {
            id: message.sender.id,
            name: message.sender.name,
            username: message.sender.username,
            profile_image: message.sender.profile_image ?? null,
            is_online: message.sender.is_online,
            latitude: Number(message.sender.latitude),
            longitude: Number(message.sender.longitude)
        } : null,
        is_location_active: message.is_location_active,
        schedule_time: message.schedule_time ? message.schedule_time : null,
        meeting_status: message.meeting_status,
    };
}

export interface FormattedParticipant {
    id: number;
    username: string;
    name: string;
    profile_image: string,
    is_online: boolean,
    last_seen: Date
    latitude: number,
    longitude: number,
}

export function formatParticipant(participant:any): FormattedParticipant{
    return {
        id: participant.user.id,
        username: participant.user.username,
        name: participant.user.name,
        profile_image: participant.user.profile_image ?? null,
        is_online: participant.user.is_online,
        last_seen: participant.user.last_seen,
        latitude: participant.user.latitude,
        longitude: participant.user.longitude,
    }
}
```

---

## 📁 **7. Middlewares**

### **7.1. Upload Media**

```typescript
// src/api/middlewares/uploadMedia.ts
import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { imageBucket as bucket } from "../helpers/firebaseConfig"
import { format } from "util";

const storage = multer.memoryStorage();
const upload = multer({storage});

const uploadMultipleToFirebase = async (files: Express.Multer.File[], userId: string): Promise<string[]> => {
  const fileUrls: string[] = [];

  for (const file of files) {
    try {
      let folder = "others";
      if (file.mimetype.startsWith("image/") && file.mimetype !== "image/gif") folder = "images";
      else if (file.mimetype === "image/gif") folder = "gif";
      else if (file.mimetype.startsWith("video/")) folder = "videos";
      else if (file.mimetype.startsWith("audio/")) folder = "audio";
      else if (
        file.mimetype === "application/pdf" ||
        file.mimetype.startsWith("application/msword") ||
        file.mimetype.startsWith("application/vnd")
      ) folder = "documents";

      const fileName = `users/${userId}/${folder}/${Date.now()}-${file.originalname}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        metadata: { contentType: file.mimetype },
      });

      await new Promise<void>((resolve, reject) => {
        blobStream.on("error", reject);
        blobStream.on("finish", async () => {
          await blob.makePublic()
          const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
          fileUrls.push(publicUrl);
          resolve();
        });
        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  return fileUrls;
};

export {upload, uploadMultipleToFirebase}
```

### **7.2. Verify Token**

```typescript
// src/api/middlewares/verifyToken.ts
import { Request, Response, NextFunction } from "express";
import { decode } from '../lib/jwt'
import { unauthorizedResponse } from '../helpers/apiResponse'
import { Constants } from '../config/constants'

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
  
  const accessToken = req.headers.authorization;
  if (accessToken) {
    const token = accessToken.split(' ')[1];
    const { decoded, expired } = decode(token);
    if (decoded) {
      // @ts-ignore
      req.user = decoded;
   
      if(req.user.userId == undefined){
        unauthorizedResponse(res,Constants.ERROR_MESSAGES.AUTHORIZATION_TOKEN_INVALID);
      }else{
        return next();
      }
    }
    if (expired) {
      unauthorizedResponse(res,Constants.ERROR_MESSAGES.AUTHORIZATION_TOKEN_EXPIRED);
    }
  }else{
    unauthorizedResponse(res,Constants.ERROR_MESSAGES.AUTHORIZATION_REQUIRED);
  }
}

export default verifyToken;
```

---

## 📁 **8. Helpers**

```typescript
// src/api/helpers/apiResponse.ts
import { Constants } from "../config/constants";

export const successCreated = (res:any,msg:string): void =>{
    const dataRes = {
		status: 1,
		message: msg
	};
	return res.status(Constants.ERROR_CODES.SUCCESS_CODE).json(dataRes);
}

export const successResponse = (res:any,msg:string,data:any): void =>{
    const dataRes = {
		status: 1,
		message: msg,
        data: data
	};
	return res.status(Constants.ERROR_CODES.SUCCESS_CODE).json(dataRes);
}

export const ErrorResponse = (res:any,msg:any): void =>{
    const dataRes = {
        status: 0,
		message: msg,
	};
	return res.status(Constants.ERROR_CODES.FAIL_CODE).json(dataRes);
}

export const unauthorizedResponse = (res:any,msg:string): void =>{
    const dataRes = {
        status: 0,
		message: msg,
	};
	return res.status(Constants.ERROR_CODES.UNAUTHORIZED_CODE).json(dataRes);
}
```

---

## 📁 **9. Migrations**

### **9.1. Create Conversations Table**

```typescript
// src/api/domain/migration/1740137176905-create_conversations.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateConversations1740137176905 implements MigrationInterface {

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
                        name:"type",
                        type:"enum",
                        enum: ["one-to-one", "group"],
                        default: "'one-to-one'",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "NOW()"
                    }
                ]
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("conversations")
    }
}
```

### **9.2. Create Conversations Participant Table**

```typescript
// src/api/domain/migration/1740137686346-create_conversations_participant.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateConversationsParticipant1740137686346 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "conversations_participant",
                columns:[
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
                        name: "user_id",
                        type: "int"
                    },
                    {
                        name: "role",
                        type : "enum",
                        enum: ["member","admin"],
                        default: "'member'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "NOW()"
                    },
                    {
                        name: "last_cleared_message_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "last_read_message_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "is_notification_mute",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_unmatched_user",
                        type: "boolean",
                        default: false
                    }
                ]
            })
        )
        await queryRunner.createForeignKey(
            "conversations_participant",
            new TableForeignKey({
                columnNames:["conversation_id"],
                referencedColumnNames:["id"],
                referencedTableName:"conversations",
                onDelete:"CASCADE"
            })
        )
        await queryRunner.createForeignKey(
            "conversations_participant",
            new TableForeignKey({
                columnNames:["user_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("conversations_participant")
    }
}
```

### **9.3. Create Message Table**

```typescript
// src/api/domain/migration/1740138348605-create_message_table.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateMessageTable1740138348605 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "message",
                columns:[
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        type: "bigint",
                        name: "message_id",
                        isNullable: true
                    },
                    {
                        name: "conversation_id",
                        type: "int"
                    },
                    {
                        name:"sender_id",
                        type: "int"
                    },
                    {
                        name: "content",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "message_type",
                        type: "enum",
                        enum: ["text","image","video","audio","document"],
                        default:"'text'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "NOW()"
                    },
                    {
                        name:"is_location_active",
                        type:"boolean",
                        default: true
                    },
                    {
                        name: "is_deleted_by_admin",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "NOW()"
                    },
                    {
                        name: "images",
                        type: "jsonb",
                        isNullable: true
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["sent", "delivered","read"],
                        default:"'sent'"
                    },
                    {
                        name: "media_url",
                        type: "varchar",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            })
        )
        await queryRunner.createForeignKey(
            "message",
            new TableForeignKey({
                columnNames:["sender_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("message")
    }
}
```

---

## ⚙️ **10. Configuration**

### **10.1. TypeORM Config**

```typescript
// src/api/config/db.ts
import { DataSource } from "typeorm";
import { env } from "../../infrastructure/env";
import path from "path"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: 5432,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  logging: false,
  entities:[
    path.join(__dirname, "../", `domain/entities/*{.ts,.js}`)
  ],
  migrations: [
    path.join(__dirname, "../", `domain/migration/*{.ts,.js}`)
  ],
})

AppDataSource.initialize()
  .then(async () => {
    console.log("Connected to postgreSQL Database");
  })
  .catch((error:any) => console.log(error));
```

### **10.2. Environment Variables**

```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

JWT_SECRET=your_jwt_secret

PORT=3000
```

---

## 📱 **11. Usage Examples**

### **11.1. API Endpoints**

```bash
# Create Conversation
POST http://localhost:3000/api/v1/chat/create-conversation
Headers: Authorization: Bearer <token>
Body: {
  "type": "one-to-one",
  "partcipants": [{"user_id": 2}]
}

# Get Conversations
GET http://localhost:3000/api/v1/chat/conversations?page=1&limit=20
Headers: Authorization: Bearer <token>

# Get Messages
GET http://localhost:3000/api/v1/chat/messages/1?page=1&limit=20
Headers: Authorization: Bearer <token>

# Send Message
POST http://localhost:3000/api/v1/chat/message/send-message
Headers: Authorization: Bearer <token>
Body: {
  "conversation_id": 1,
  "content": "Hello!",
  "message_type": "text"
}
```

### **11.2. Socket.IO Client**

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

// Mark as read
socket.emit('mark_as_read', {
  conversation_id: 1,
  user_id: 1,
  last_read_message_id: 123
})

// Typing indicator
socket.emit('typing', {
  conversation_id: 1,
  sender_id: 1,
  is_typing: true
})

socket.on('typing_status', (data) => {
  console.log('User is typing:', data)
})
```

---

## ✅ **Quick Setup Checklist**

- [ ] Dependencies install kiye
- [ ] Database migrations run kiye
- [ ] Entities TypeORM mein register kiye
- [ ] Routes add kiye
- [ ] Socket.IO setup kiya
- [ ] Environment variables set kiye
- [ ] Firebase configured (agar chahiye)
- [ ] Test kiya

---

## 🎯 **Features**

✅ Real-time messaging via Socket.IO  
✅ Text, Image, Video, File, Location messages  
✅ Read receipts  
✅ Typing indicators  
✅ Online/Offline status  
✅ Push notifications  
✅ Media uploads  
✅ Group chat support  
✅ Search messages  
✅ Pagination  

---

**Complete Chat Module Ready! 🚀**

Agar koi issue aaye ya customization chahiye, to batana!

