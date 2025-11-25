import { Brackets, ILike, In, MoreThan, Not } from "typeorm";
import { AppDataSource } from "../../config/db";
import { logger } from "../../lib/logger";
import { Conversation } from "../entities/conversation.entities";
import { ConversationParticipant } from "../entities/conversation.participant.entities";
import { Users } from "../entities/users.enities";
import { UserInteraction } from "../entities/user.interactions.entities";
import { getIo } from "../../../infrastructure/webserver/express";
import { Message } from "../entities/message.entity";
import { DatingMessageFormate, formatCreateMediaMessage, formatMessage, formatParticipant } from "../responseDto/userResponseDto";
import { Request, Response } from "express";
import { ErrorResponse, successResponse } from "../../helpers/apiResponse";
import { addMessage } from "./message.model";
import { getUserDeviceTokens, sendPushNotificationByTokens } from "./device.table.model";
import { BlockedUser } from "../entities/blocked.user.entities";
import { unMatchUsers } from "../entities/unmatched.user.entities";
import { NotificationType } from "../../enum";
import { DatingMessage } from "../entities/message_meetings.entities";
import { getDistanceFromLatLng } from "./user.model";


export async function addConversations(
    reqBody: any,
    userId: number,
    callback: (error: any, result: any) => void
) {
    try {
        const io = getIo()
        
        let group_image: string | null = null;
        let group_name: string | null = null;

        const conversationRepository = AppDataSource.getRepository(Conversation);
        const participantRepository = AppDataSource.getRepository(ConversationParticipant);
        const userRepository = AppDataSource.getRepository(Users);
        const messageRepo = AppDataSource.getRepository(Message)


        let participants = reqBody.partcipants;
        if (typeof reqBody.participants === "string") {
            participants = JSON.parse(reqBody.participants);
        }

        // Ensure current user is in participants list
        if (!participants.some((participant: { user_id: number }) => participant.user_id === userId)) {
            return callback(`Current user with ID ${userId} is not in the participants list.`, null);
        }

        // Fetch user details for naming
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

            // Check if the conversation already exists
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
                    .where("conversation.id != :userId", {userId: userId})
                    .orderBy("messages.created_at","DESC")
                    .getOne();
        
                const otherParticipant = getConversation?.participants.filter(p => p.user_id !== userId) ?? []

                const unreadCount = await messageRepo.count({
                where: {
                    conversation_id: existingConversation.id,
                    sender_id: Not(userId),
                    id: MoreThan(otherParticipant[0].last_read_message_id),
                    status: "sent"
                }
                });
        
                const latestMessage = await messageRepo.findOne({
                where: { conversation_id: existingConversation.id},
                order: { created_at: "DESC" },
                relations: ["sender"], // optional
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

            // **Set default group name for one-to-one chat**
            group_name = `${currentUser.name} & ${receiverUserDetails.name}`;
        }else{
            // create group
            try {
                if(reqBody.image){
                    group_image = reqBody.image
                }
            } catch (error) {
                console.log(error)
            }


        }

        // **Create new conversation**
        const conversation = conversationRepository.create({
            type: reqBody.type,
            
        });
        await conversationRepository.save(conversation);

        // **Prepare participants list**
        const participantsToSave = participants.map((participant: { user_id: number; role?: string }) => {
            return participantRepository.create({
                conversation_id: conversation.id,
                user: { id: participant.user_id },
                role:  "member"
            });
        });

        await participantRepository.save(participantsToSave);

        const getConversation = await conversationRepository
        .createQueryBuilder("conversation")
        .leftJoinAndSelect("conversation.participants","participants")
        .leftJoinAndSelect("conversation.messages","messages")
        .leftJoinAndSelect("participants.user","user")
        .where("conversation.id != :userId", {userId: userId})
        // .where("conversation.id != :conversationId", {conversationId: conversation.id})
        .orderBy("messages.created_at","DESC")
        .getOne();
        
        const otherParticipant = getConversation?.participants.filter(p => p.user_id !== userId) ?? []

        const unreadCount = await messageRepo.count({
          where: {
            conversation_id: conversation.id,
            sender_id: Not(userId),
            id: MoreThan(otherParticipant[0].last_read_message_id),
            status: "sent"
          }
        });
        
        const latestMessage = await messageRepo.findOne({
          where: { conversation_id: conversation.id},
          order: { created_at: "DESC" },
          relations: ["sender"], // optional
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
         const message_type = "text"
        const response = await commonFunctionOfMessagesConversation(userId, conversation_id,skip,limit,page,message_type,search)

        return callback(null, response)
    } catch (error) {
        return callback(error, null)
    }
}

export async function getLocationMessagesOfChat(
    userId: number,
    conversation_id: number,
    page: number,
    limit:number,
    search: string,
    callback:(error:any, result:any) => void
){
    try {
       
        const skip = (page - 1) * limit;
        const message_type = "location"
        const response = await commonFunctionOfMessagesConversation(userId, conversation_id,skip,limit,page, message_type, search)

        return callback(null, response)
    } catch (error) {
        return callback(error, null)
    }
}

const commonFunctionOfMessagesConversation = async (userId:number, conversation_id:number,skip:number,limit:number,page:number, message_type?:string, search?: string)=>{
    try {
        const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);
        const messageRepo = AppDataSource.getRepository(Message);
        const blockedRepo = AppDataSource.getRepository(BlockedUser);
        const unMatchdRepo = AppDataSource.getRepository(unMatchUsers);
        const datingMessageRepo = AppDataSource.getRepository(DatingMessage);
        const userRepo = AppDataSource.getRepository(Users);

        const whereClause:any = {
            conversation_id,
        } 
        if(message_type && message_type === "location"){
            whereClause.message_type = message_type
        }
        if(search){
            whereClause.content = ILike(`%${search}%`)
        }
        const participant = await conversationParticipantRepo.findOne({
            where: {conversation_id, user_id:userId}
        });
        
        const loggedInUser = await userRepo.findOne({where:{id : userId} , select:["latitude","longitude"]})
        const otherUser = await conversationParticipantRepo.createQueryBuilder("cp")
        .leftJoinAndSelect("cp.user", "user")
        .where("cp.conversation_id = :conversation_id", { conversation_id })
        .andWhere("cp.user_id != :userId", { userId })
        .select(["cp.id", "user.id","user.latitude", "user.longitude"]) // include cp.id
        .getOne();
        
        if(participant?.last_cleared_message_id){
            whereClause.id =  MoreThan(participant?.last_cleared_message_id);
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

        
        const isBlocked = await blockedRepo.findOne({
            where: {
                conversation_id : conversation_id,
                blocked: {id: userId}
            }
        })

        const is_unmatched = await unMatchdRepo.findOne({
            where: {
                conversation_id: conversation_id,
                unMatchUser: {id: userId}
            }
        })
        const now = new Date()
        let distAKm = "";
        let distBKm = "";
        // Formated message
        const formatMessages = await Promise.all(
            messages.map( async (msg) => {
                // ✅ Attach dating message details if exists
                let datingDetails = null;
                if(msg.message_type === "location"){
                    datingDetails = await datingMessageRepo.findOne({
                        where: {message_id: msg.id},relations:["datingCreator","datingPartner"]
                    });

                    // ✅ Check if schedule_time is expired and update
                    if((datingDetails?.meeting_status === "rescheduled" || datingDetails?.meeting_status === "pending") && datingDetails?.schedule_time && new Date(datingDetails.schedule_time) < now){
                        datingDetails.meeting_status = "expired";
                        await datingMessageRepo.update(datingDetails.id,{
                            meeting_status: "expired"
                        });

                        // Also mark message's location as inactive (if not already)
                        if (msg.is_location_active) {
                            msg.is_location_active = false;
                            await messageRepo.update(msg.id, { is_location_active: false });
                        }
                    }
                
                    // Step 5: Calculate distance from each user (optional)
                    const distA = getDistanceFromLatLng(Number(loggedInUser?.latitude), Number(loggedInUser?.longitude), Number(datingDetails?.latitude), Number(datingDetails?.longitude));
                    const distB = getDistanceFromLatLng(Number(otherUser?.user.latitude), Number(otherUser?.user.longitude), Number(datingDetails?.latitude), Number(datingDetails?.longitude));
                    distAKm = (distA / 1000).toFixed(2);
                    distBKm = (distB / 1000).toFixed(2);

                    
                }

                const baseFormated = formatMessage(msg);
                const distance = distAKm
                return {
                    ...baseFormated,
                    dating_details: datingDetails
                    ? DatingMessageFormate(datingDetails, distance) : null,
                }
            })
        )
        const pagination = {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        }

        const response = {
            messages: formatMessages,
            isBlocked: !!isBlocked,
            isUnmatched: !!is_unmatched,
            pagination
        }
        return response;
    } catch (error) {
        console.log("errr......",error)
        throw error
    }
}
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
        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);
        const unMatchedUserRepo = AppDataSource.getRepository(unMatchUsers);

        //Get the list of un_match user by the  current user
        const un_match_users = await unMatchedUserRepo.find({
            where: {
                user: {id: userId}
            },
            relations:["unMatchUser"]
        });
        
        const unMatchUsersIds = un_match_users.map(entry => entry.unMatchUser.id);
        //Get the list of users blocked by the current user
        const blockedUsers = await blockedUserRepo.find({
            where: {blocker: {id: userId} },
            relations: ["blocked"]
        });
        const blockedUserIds = blockedUsers.map(entry => entry.blocked.id);

        // Step 1: Get the conversations IDs where this user is a participant
        const participantEntries = await participantRepo.find({
            where: { user: { id: userId }, is_unmatched_user: false },
            relations: ["conversation","conversation.participants","conversation.participants.user"],
            select: ["conversation"]
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

        // Step 2: Fetch those conversations with participants and latest message
        let query = await conversationsRepo
            .createQueryBuilder("conversation")
            .leftJoinAndSelect("conversation.participants", "participants")
            .leftJoinAndSelect("participants.user", "user");

        query = query
        .where("conversation.id IN (:...conversationIds)", { conversationIds:  conversationsIds});
        
        // Apply search on the other participant's user name
        if (search && search.trim() !== "") {
            query = query.andWhere(
                "(user.name ILIKE :search)",
                { search: `%${search}%` }
            );
        }

        const [conversations, total] = await query
            // .where("conversation.id IN (:...conversationIds)", { conversationIds: conversationsIds })
            .orderBy("conversation.created_at", "DESC")
            // .skip(skip)
            // .take(limit)
            .getManyAndCount();

        // Step 3: Extract latest message for each conversation
        const conversationsWithLatestMessage = await Promise.all(
            conversations.map(async (convo) => {

                const participantEntry = convo.participants.find(p => p.user_id === userId);
                const otherParticipant = convo.participants.find(p => p.user_id !== userId);

                // Skip this conversation if otherParticipant is blocked by the current user
                if (!otherParticipant || blockedUserIds.includes(otherParticipant.user.id ?? 0) || unMatchUsersIds.includes(otherParticipant.user.id ?? 0) || otherParticipant.user.is_deleted === true) {
                    return null; // Exclude this convo
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
                    relations: ["sender"], // optional
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

        // ✅ Remove null values (blocked convos) from results
        const filteredConversations = conversationsWithLatestMessage.filter(Boolean);

        // Sort conversations by last_message created_at.created_at at DESC
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

export const findOneConversation = async (
    conversation_id: number,
    userId: number,
    callback:(error:any, result:any) => void
)=>{
    try {
        const conversationsRepo = AppDataSource.getRepository(Conversation);
        const participantRepo = AppDataSource.getRepository(ConversationParticipant);
        const messageRepo = AppDataSource.getRepository(Message);
        console.log("conversation....",conversation_id)
        // Step 1: Fetch the conversation with participants
        const conversation = await conversationsRepo
            .createQueryBuilder("conversation")
            .leftJoinAndSelect("conversation.participants", "participants")
            .leftJoinAndSelect("participants.user", "user")
            .where("conversation.id = :conversationId", { conversationId: conversation_id })
            .getOne();

        if (!conversation) {
            return callback("Conversation not found", null);
        }

        const participantEntry = conversation.participants.find(p => p.user_id === userId);
        const otherParticipant = conversation.participants.find(p => p.user_id !== userId);

        if (!participantEntry) {
            return callback("You are not a participant in this conversation", null);
        }

        if (!otherParticipant) {
            return callback("No other participant found in conversation", null);
        }

        // Step 2: Unread count
        const lastReadMessageId = participantEntry.last_read_message_id ?? 0;

        const unreadCount = await messageRepo.count({
            where: {
                conversation_id: conversation.id,
                sender_id: Not(userId),
                id: MoreThan(lastReadMessageId),
                status: "sent"
            }
        });

        // Step 3: Latest message
        const latestMessage = await messageRepo.findOne({
            where: { conversation_id: conversation.id },
            order: { created_at: "DESC" },
            relations: ["sender"]
        });

        const formattedResult = {
            id: conversation.id,
            type: conversation.type,
            created_at: conversation.created_at,
            participant: formatParticipant(otherParticipant),
            last_message: latestMessage ? formatMessage(latestMessage) : null,
            unread_count: unreadCount,
            is_notification_mute: participantEntry.is_notification_mute
        };

        return callback(null, formattedResult);
    } catch (error) {
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}
export async function getConversationsInfo(
    userId: number,
    conversation_id: number,
    callback:(error:any, result:any) => void
){
    console.log("user & conver id.........",userId, conversation_id)
    try {
        const conversationParticipantRepostory = AppDataSource.getRepository(ConversationParticipant);
                const conversation = await conversationParticipantRepostory
                .createQueryBuilder("CP")
                .where("CP.user_id = :userId",{userId})
                .andWhere("CP.conversation_id = :conversation_id",{conversation_id})
                .getOne();
                console.log("conversation parti.....................",conversation)
        return callback(null,conversation)
    } catch (error) {
        console.error("Error in get conversation Info.",error)
        callback(error,null)
    }
}

export async function getConversationDetails(userId:number, conversation_id:number){
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const messageRepo = AppDataSource.getRepository(Message);

    const getConversation = await conversationRepository
        .createQueryBuilder("conversation")
        .leftJoinAndSelect("conversation.participants","participants")
        .leftJoinAndSelect("conversation.messages","messages")
        .leftJoinAndSelect("participants.user","user")
        .where("conversation.id = :conversation_id", {conversation_id: conversation_id})
        .orderBy("messages.created_at","DESC")
        .getOne();
    const senderDetails = getConversation?.participants.filter(p => p.user_id === userId) ?? []
    // const unreadCount = await messageRepo.count({
    // where: {
    //     conversation_id: getConversation?.id,
    //     sender_id: userId,
    //     id: MoreThan(otherParticipant[0].last_read_message_id),
    //     status: "sent"
    // }
    // });

    const latestMessage = await messageRepo.findOne({
    where: { conversation_id: getConversation?.id},
    order: { created_at: "DESC" },
    relations: ["sender"], // optional
    });

    const response = {
    id: getConversation?.id,
    type: getConversation?.type,
    created_at: getConversation?.created_at,
    participant: senderDetails.length > 0 ? formatParticipant(senderDetails[0]) : {},
    last_message: latestMessage ? formatMessage(latestMessage) : null,
    unread_count: 0,
    };
    return response
}

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
                        // Emit personal socket update
                        io.to(`personal_data_${receiver.user_id}`).emit("new_message_received", {
                            ...response,
                            message_id: messageId,
                            created_at: messageCreatedDate
                        })
                        const conversation = await getConversationDetails(userId, conversation_id)

                        // Get conversation settings
                        await getConversationsInfo(receiver.user_id, conversation_id, async(error:any, convoInfo:any) => {
                            if (error) {
                                return callback("Failed to send_message",null);
                            }

                            if(!convoInfo.is_notification_mute){
                                await getUserDeviceTokens(receiver.user_id, async(error:any, tokens:any) => {
                                    if (error) {
                                        console.error("Error getting tokens:", error);
                                        io.emit("error_message", { message: error });
                                        return;
                                    }

                                    if(tokens.length > 0){
                                        // const notificationObj = {
                                        //     title: receiver.user.name,
                                        //     body: content,
                                        //     // additionalData: { receiveMessage: reqBody }
                                        // }

                                        const notificationObj = {
                                            title: receiver.user.name,
                                            body: content,
                                            additionalData:{
                                                type: NotificationType.CHAT_MESSAGE,
                                                conversation: conversation,
                                                // sender:formatUserResponse(sender),
                                                // channel_name: channelName,
                                                // callId: String(callRecord.id)
                                            },
                                        }

                                        try {
                                            const response = await sendPushNotificationByTokens(notificationObj, tokens);
                                            io.emit("success", { message: `Push notification sent to user: ${receiver.user.name}` });
                                            console.log("Push notification sent:", response);
                                        } catch (error) {
                                            console.error("Notification error:", error);
                                            io.emit("error_message", { message: error });
                                        }
                                    }
                                })
                            }else{
                                logger.debug("Push notification not sent because the receiver has muted notifications.")
                            }
                        })
                    })
                )
                const response = formatCreateMediaMessage(result)
                return callback(null, {...response, message_id: messageId})
            }
        })
        
    } catch (error) {
        return callback(error,null)
    }
}

export const saveCafeAddressLocation = async(
    sender_id: number,
    matchuserId: number,
    conversation_id: number,
    cafe_location: any,
    schedule_time: Date,
    message_id: number,
    created_at: string,
    callback:(error:any, result:any) => void
)=>{
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        const messageCreatedDate = created_at ? new Date(created_at) : new Date()
        const messageId = message_id || Date.now()

        const {name, address, rating, imageUrl, latitude, longitude,  placeId, canceled_reason, distance_km} = cafe_location;
        const io = getIo()
        const userRepo = AppDataSource.getRepository(Users);
        const loggedInUser = await userRepo.findOne({where:{id: sender_id} });
        const datingMessageRepo = AppDataSource.getRepository(DatingMessage);
        
        const matchUser = await userRepo.findOne({where:{id: matchuserId} });
        const messageRep = AppDataSource.getRepository(Message);

        if(!loggedInUser || !matchUser){
            return callback("One or both users not found.",null)
        }

        // ✅ Step 1: Create new message entry
        const content = `${name}`;
        const contentTitle = `Shared a café location: ${name}`;
        const message_type = "location";

        const newMessage = messageRep.create({
            conversation_id,
            sender_id,
            content,
            message_type,
            message_id: messageId || Date.now(),
            created_at: messageCreatedDate
        });
        const savedMessage = await messageRep.save(newMessage);

        // ✅ Step 2: Mark previous location entries inactive (if any)
        // await datingMessageRepo.update(
        //     { message: { conversation_id }, meeting_status: In(["pending", "confirmed"]) },
        //     { meeting_status: "canceled" }
        // );
        
        

        
        // ✅ Step 3: Insert into dating_messages table
        const newDatingMessage = datingMessageRepo.create({
            message: {id :  savedMessage.id},
            name, 
            address,
            latitude,
            longitude,
            meeting_status:"pending",
            schedule_time,
            image_url: imageUrl || null,
            rating: rating || null,
            place_id: placeId || null,
            canceled_reason:canceled_reason || null,
            distance_km: distance_km || null,
            datingCreator:{id: sender_id},
            datingPartner:{id: matchuserId} 
        });
        await datingMessageRepo.save(newDatingMessage);
        await queryRunner.commitTransaction();

        const savedMessageWithSender = await messageRep.findOne({
            where: { id: savedMessage.id },
            relations: ['sender'],
        });

        const datingMessage = await datingMessageRepo.findOne({
            where: { id: newDatingMessage.id },
            relations: ['datingCreator','datingPartner'],
        });

        if(!datingMessage) {
            return callback("Dating message not found.",null)
        }

        const response = await formatMessage(savedMessageWithSender);
        
        const distA = getDistanceFromLatLng(Number(loggedInUser?.latitude), Number(loggedInUser?.longitude), Number(latitude), Number(longitude));
        const distB = getDistanceFromLatLng(Number(matchUser.latitude), Number(matchUser?.longitude), Number(latitude), Number(longitude));

        const distance = (distA / 1000).toFixed(2);
        const distanceB = (distB / 1000).toFixed(2);
                    
        console.log(`sender ==> personal_data_${sender_id}`)
        io.to(`personal_data_${sender_id}`).emit("new_message_received",{
            ...response,
            // message_id: messageId,
            created_at: messageCreatedDate,
            dating_details:DatingMessageFormate(datingMessage,distance)
        })

        io.to(`personal_data_${matchuserId}`).emit("new_message_received",{
            ...response,
            // message_id: messageId,
            created_at: messageCreatedDate,
            dating_details: DatingMessageFormate(datingMessage, distanceB)
        })

      await getUserDeviceTokens(matchuserId, async(error:any, tokens:any)=>{
        if(error){
            console.error("Error get tokens",error)
            return callback("Error get tokens",null)
        }else{

            const conversation = await getConversationDetails(sender_id, conversation_id)   
            if(tokens.length > 0){
                const notificationObj = {
                    title: loggedInUser.name /* + ' ' + data.sender.last_name */,
                    body: contentTitle,
                    additionalData:{
                        type: NotificationType.CHAT_MESSAGE,
                        conversation: conversation,
                        // sender:formatUserResponse(sender),
                        // channel_name: channelName,
                        // callId: String(callRecord.id)
                    },
                }
                await sendPushNotificationByTokens(notificationObj, tokens)
                .then((response) => {
                    console.log("Push notification sent:",response)
                })
                .catch((error) => {
                    console.error("Error:",error)
                    return callback("failed to send push notification.",null)
                })
            }
        }
    })

    findOneConversation(conversation_id, sender_id, (error:any, result:any) => {
        if(error){
            return callback("Something when wrong to save location message.",null)
        }
        return callback(null,result)
    })
        
    } catch (error) {
        console.log("errror,,",error)
        return callback(error,null)
    }
}

export const acceptDaingLocation = async(
    userId:number, 
    message_id: number,
    is_accepted:boolean,
    callback:(error:any, result:any) => void
)=>{
    try {
        const io = getIo()
        const datingMessageRepo = AppDataSource.getRepository(DatingMessage);
        const messageRepo = AppDataSource.getRepository(Message);
        const userRepo = AppDataSource.getRepository(Users);

        const user = await userRepo.findOne({where:{id: userId},select:["name","latitude","longitude"] });
        if(!user){
            return callback("User not found.",null)
        }

        // ✅ 1. Find dating message with related message
        const datingMessage = await datingMessageRepo.findOne({
            where: { id: message_id },
            relations: ["message",'datingCreator','datingPartner']
        });

        if (!datingMessage) {
            return callback("Dating message not found.",null)
        }

        // ✅ 2. Update meeting status
        datingMessage.meeting_status = is_accepted ? "confirmed" : "rejected";
        await datingMessageRepo.save(datingMessage);

        // ✅ 3. Fetch the original message for sending back to socket
        const message = await messageRepo.findOne({
            where: { id: datingMessage.message_id },
            relations: ["sender"]
        });
        if(!message){
            return callback("Message not found.", null)
        }

        const distA = getDistanceFromLatLng(Number(user?.latitude), Number(user?.longitude), Number(datingMessage?.latitude), Number(datingMessage?.longitude));
        const distance = (distA / 1000).toFixed(2);
        

        // ✅ 4. Attach dating details in response
        const response = {
            ...formatMessage(message),
            dating_details: datingMessage ? DatingMessageFormate(datingMessage, distance) : null
        };

        // ✅ 5. Emit to both users
        io.to(`personal_data_${datingMessage.dating_creator}`).emit("new_message_received", response);
        io.to(`personal_data_${datingMessage.dating_partner}`).emit("new_message_received", response);
                        
        const conversation = await getConversationDetails(datingMessage.dating_creator, message?.conversation_id)

        await getUserDeviceTokens(datingMessage.dating_creator,async (error, tokens) =>{
            if(error){
                return callback("User tokens not found", null)
            }else{
                if(tokens.length > 0){
                    const action = is_accepted === true ? "Accepted" : "Rejected";
                    const notificationObj = {
                        title: `${user.name}` /* + ' ' + data.sender.last_name */,
                        body: `${action.charAt(0).toUpperCase() + action.slice(1)} your dating invitation request.`,
                        additionalData:{
                            type: NotificationType.CHAT_MESSAGE,
                            conversation: conversation,
                            // sender:formatUserResponse(sender),
                            // channel_name: channelName,
                            // callId: String(callRecord.id)
                        },
                    }
                    await sendPushNotificationByTokens(notificationObj, tokens)
                    .then((response) => {
                        console.log("Push notification sent:",response)
                    })
                    .catch((error) => {
                        console.error("Error:",error)
                    })
                }
            }
        })
        
        return callback(null, "Accepted successfully.");
    } catch (error) {
        return callback(error,null)
    }
}

export const cancelDatingLocation= async(
    userId: number,
    message_id: number,
    reason: string,
    callback:(error:any, result:any) => void
)=>{
    try {
        const io = getIo();
        const datingMessageRepo = AppDataSource.getRepository(DatingMessage);
        const messageRepo = AppDataSource.getRepository(Message);
        const userRepo = AppDataSource.getRepository(Users);

        const user = await userRepo.findOne({where:{id: userId},select:["name","latitude","longitude"] });
        if(!user){
            return callback("User not found.",null)
        }

        // ✅ 1. Find dating message with related message
        const datingMessage = await datingMessageRepo.findOne({
            where: {  id: message_id },
            relations: ["message",'datingCreator','datingPartner']
        });

        if (!datingMessage) {
            return callback("Dating message not found.",null)
        }

        // ✅ 2. Update status to canceled
        datingMessage.meeting_status = "canceled";
        datingMessage.canceled_reason = reason;
        await datingMessageRepo.save(datingMessage);

        // ✅ 3. Fetch original message for response
        const message = await messageRepo.findOne({
            where: { id: datingMessage.message_id },
            relations: ["sender"]
        });

        if(!message){
            return callback("Message not found.", null)
        }

        const distA = getDistanceFromLatLng(Number(user?.latitude), Number(user?.longitude), Number(datingMessage?.latitude), Number(datingMessage?.longitude));
        const distance = (distA / 1000).toFixed(2);

        // ✅ 4. Prepare response with dating details
        const response = {
            ...formatMessage(message),
            dating_details: datingMessage ? DatingMessageFormate(datingMessage, distance) : null
        };

        // ✅ 5. Emit to both participants
        io.to(`personal_data_${datingMessage.dating_creator}`).emit("new_message_received", response);
        io.to(`personal_data_${datingMessage.dating_partner}`).emit("new_message_received", response);

        const conversation = await getConversationDetails(datingMessage.dating_creator, message?.conversation_id)

        await getUserDeviceTokens(datingMessage.dating_partner,async (error, tokens) =>{
            if(error){
                return callback("User tokens not found", null)
            }else{
                if(tokens.length > 0){
                    const notificationObj = {
                        title: `${user.name}` /* + ' ' + data.sender.last_name */,
                        body: "Canceled your dating invitation request.",
                        additionalData:{
                            type: NotificationType.CHAT_MESSAGE,
                            conversation: conversation,
                            // sender:formatUserResponse(sender),
                            // channel_name: channelName,
                            // callId: String(callRecord.id)
                        },
                    }
                    await sendPushNotificationByTokens(notificationObj, tokens)
                    .then((response) => {
                        console.log("Push notification sent:",response)
                    })
                    .catch((error) => {
                        console.error("Error:",error)
                    })
                }
            }
        })
        return callback(null, "Canceled successfully.");
    } catch (error) {
        return callback(error,null)
    }
}

export const rescheduledDatingLocation = async (
    userId: number,
    message_id: number, 
    schedule_time: string,
    callback:(error:any, result:any) => void
) => {
    try {
        const io = getIo()
        const messageDatingRepo = AppDataSource.getRepository(DatingMessage);
        const messageRepo = AppDataSource.getRepository(Message);
        const userRepo = AppDataSource.getRepository(Users);

        const user = await userRepo.findOne({where:{id: userId},select:["name","latitude","longitude"] });
        if(!user){
            return callback("User not found.",null)
        }

        const oldDatingMessage = await messageDatingRepo.findOne(
            {
                where:{id: message_id},
                relations:['datingCreator','datingPartner'] 
            });
        if(!oldDatingMessage){
            return callback("Old message not found.",null)
        }

        oldDatingMessage.meeting_status = "rescheduled";
        oldDatingMessage.schedule_time = new Date(schedule_time);
        oldDatingMessage.created_at = new Date();
        await messageDatingRepo.save(oldDatingMessage);

        // ✅ 3. Fetch original message for response
        const message = await messageRepo.findOne({
            where: { id: oldDatingMessage.message_id },
            relations: ["sender"]
        });

        if(!message){
            return callback("Message not found.", null)
        }

        const distA = getDistanceFromLatLng(Number(user?.latitude), Number(user?.longitude), Number(oldDatingMessage?.latitude), Number(oldDatingMessage?.longitude));
        const distance = (distA / 1000).toFixed(2);
        const response1 = formatMessage(message);
        const response = {
            ...response1,
            dating_details: oldDatingMessage ? DatingMessageFormate(oldDatingMessage, distance) : null
        };

        io.to(`personal_data_${oldDatingMessage.dating_creator}`).emit("new_message_received",response)
        io.to(`personal_data_${oldDatingMessage.dating_partner}`).emit("new_message_received",response)

        const conversation = await getConversationDetails(oldDatingMessage.dating_creator, message?.conversation_id)

        await getUserDeviceTokens(oldDatingMessage.dating_partner,async (error, tokens) =>{
            if(error){
                return callback("User tokens not found", null)
            }else{
                if(tokens.length > 0){
                    const notificationObj = {
                        title: `${user.name}` /* + ' ' + data.sender.last_name */,
                        body: "Rescheduled your dating invitation request.",
                        additionalData:{
                            type: NotificationType.CHAT_MESSAGE,
                            conversation: conversation,
                            // sender:formatUserResponse(sender),
                            // channel_name: channelName,
                            // callId: String(callRecord.id)
                        },
                    }
                    await sendPushNotificationByTokens(notificationObj, tokens)
                    .then((response) => {
                        console.log("Push notification sent:",response)
                    })
                    .catch((error) => {
                        console.error("Error:",error)
                    })
                }
            }
        })

        return callback(null,"Reschedule successfully.")
    } catch (error) {
        return callback(error,null)
    }
}