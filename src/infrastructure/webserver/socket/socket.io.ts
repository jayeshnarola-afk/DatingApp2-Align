import { Server } from "socket.io";
import { AppDataSource } from "../../../api/config/db";
import { Users } from "../../../api/domain/entities/users.enities";
import { addMessage } from "../../../api/domain/models/message.model";
import { addConversations, getConversationDetails, getConversationsInfo } from "../../../api/domain/models/conversation.model";
import { getUserDeviceTokens, sendPushNotificationByTokens } from "../../../api/domain/models/device.table.model";
import { CallHistory } from "../../../api/domain/entities/call.history.entities";
import { DatingMessageFormate, formatMessage, formatUserResponse, sender_details } from "../../../api/domain/responseDto/userResponseDto";
import { ConversationParticipant } from "../../../api/domain/entities/conversation.participant.entities";
import { Message } from "../../../api/domain/entities/message.entity";
import { In, Not } from "typeorm";
import { Conversation } from "../../../api/domain/entities/conversation.entities";
import { NotificationType } from "../../../api/enum";
import { UserInteraction } from "../../../api/domain/entities/user.interactions.entities";
import { saveNotificationHistory } from "../../../api/domain/models/notification.history.model";
import { NotificationHistory } from "../../../api/domain/entities/notification.history.entities";
import { DeviceTable } from "../../../api/domain/entities/device.token.entities";
import { now } from "fp-ts/lib/Date";
import { DatingMessage } from "../../../api/domain/entities/message_meetings.entities";

interface UserSocketMap {
    [userId: string]: string
}
interface UserOnlineStatusMap {
    [userId: number] : boolean
}

export const connectedSocketUser: UserSocketMap = {} 
export const userOnlineStatusMap : UserOnlineStatusMap = {}
export const handleSocketEvents = (io:Server) => {
    /** Handle WebSocket connection */
    io.on("connection", (socket) => {
        console.log("New client connected successfully:", socket.id);

        socket.on("join_self", (data) => {
            const {user_id} = data;
            socket.join(user_id)
            connectedSocketUser[user_id] = socket.id;
            socket.join(`personal_data_${data.user_id}`)
            socket.emit("join_self",{user_id})
        });
        socket.on("user_online_status", async(data) => {
            try {
                const {user_id, is_online} = data;
                const userRepository = AppDataSource.getRepository(Users)
                if(is_online){
                    const now = new Date()
                    socket.broadcast.emit("user_status",{user_id, is_online, lastSeen: null, last_online: now})
                    userOnlineStatusMap[Number(user_id)] = true;
                    
                    // update into database lastseen
                    await userRepository.update({ id: user_id }, { last_seen: null, is_online: true, last_online: now });

                }else{
                    delete connectedSocketUser[user_id];
                    const last_seen = new Date();
                    socket.broadcast.emit("user_status", {user_id, is_online, lastSeen:last_seen, last_online: last_seen})
                    userOnlineStatusMap[Number(user_id)] = false
                    
                    // update into database lastseen
                    await userRepository.update({id: user_id}, {last_seen, is_online: false, last_online: last_seen}) 
                }
            } catch (error) {
                socket.emit("error_message",{message: "Something is wrong in user-online-status"})
            }
        })
        
        socket.on("join_room",async(data): Promise<any> => {
            const {conversation_id, user_id} = data

            if(!conversation_id || !user_id){
                return socket.emit("error_message",{message: "Invalid room or user_id."})
            }
            // join the specified conversation room
            socket.join(`room_${conversation_id}`);
            console.log(`User ${user_id} joined room_${conversation_id}`);

            // Notify the user
            socket.emit("room_joined",{conversation_id})
        });

       

        socket.on("send_message", async (data, callback):Promise<any> => {
            const {conversation_id, sender_id, content, message_type, images, message_id, created_at} = data
            console.log("-------------------> created_at --------> ",typeof created_at, created_at);
            const messageCreatedDate = created_at ? new Date(created_at) : new Date()
            const messageId = message_id || Date.now();
            try {
                console.log("sender....", sender_id);
                const userRepo = AppDataSource.getRepository(Users)
                await addMessage(conversation_id,sender_id, content, message_type, images,[],null,null, null,messageId,messageCreatedDate,async(error:any, result:any): Promise<any> => {
                    if(error){
                        if(callback){
                            callback({resStatus:"failed"})
                        }
                        console.log("Error sending message:",error)
                        socket.emit
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

                        console.log(`sender ==> personal_data_${sender_id}`)
                        io.to(`personal_data_${sender_id}`).emit("new_message_received",{
                            ...response,
                            created_at: messageCreatedDate,
                            message_id: messageId
                        })
                        
                        for (const receiver of result.receiver) {
                            console.log("receiver...", receiver.user_id)
                            const receiver_socket_id = connectedSocketUser[receiver.user_id.toString()];
                        console.log(`receiver ==> personal_data_${receiver.user_id}`)
                        
                            // if(receiver_socket_id){
                                io.to(`personal_data_${receiver.user_id}`).emit("new_message_received",{
                                    ...response,
                                    created_at: messageCreatedDate,
                                    message_id: messageId
                                })
                            // }
                            
                            await getConversationsInfo(receiver.user_id, conversation_id, async(error:any, result:any)=>{
                                if(error){
                                    console.error("Error sending messag:",error)
                                    socket.emit("error_message",{message: "Failed to send_message"})
                                }else{
                                    await getUserDeviceTokens(receiver.user_id, async(error:any, tokens:any)=>{
                                        if(error){
                                            console.error("Error get tokens",error)
                                            socket.emit("error_message",{message: error})
                                        }else{
                                            if(tokens.length > 0){
                                                const notificationObj = {
                                                    title: sender.name /* + ' ' + data.sender.last_name */,
                                                    body: content,
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
                                                    socket.emit("success",{message:`Push notification sent to user: ${data.sender_id}`})
                                                    console.log("Push notification sent:",response)
                                                })
                                                .catch((error) => {
                                                    console.error("Error:",error)
                                                    socket.emit("error_message",{message: error})
                                                })
                                            }
                                        }
                                    })
                                }
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

        socket.on("mark_as_read", async (data):Promise<any>=>{
            const {conversation_id, user_id, last_read_message_id} = data;
            try {
                const participantRepo = AppDataSource.getRepository(ConversationParticipant);
                const messageRepo = AppDataSource.getRepository(Message);

                // 1. Update last_read_message_id in conversation participant
                await participantRepo.update(
                    {
                        conversation_id: conversation_id,
                        user_id: user_id
                    },{
                        last_read_message_id: last_read_message_id
                    }
                )
                
                // 2. Update all unseen message as "seen"
                await messageRepo.createQueryBuilder()
                .update()
                .set({status: "read"})
                .where("conversation_id = :conversation_id", {conversation_id: conversation_id})
                .andWhere("id <= :lastReadMessageId",{lastReadMessageId: last_read_message_id})
                .andWhere("sender_id != :userId",{userId: user_id})
                .andWhere("status != 'read'")
                .execute();
                
        
                const messager_sender = await participantRepo.findOne({where:{conversation_id: conversation_id, user_id: Not(user_id)} });            
                // 3. Optionally notify the sender about "seen" status

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
        
        socket.on("typing",async(data): Promise<any>=>{
            const {conversation_id, sender_id, is_typing} = data
            try {
                const conversaionRepo = AppDataSource.getRepository(Conversation)
                const ConversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant)

                const conversation = await conversaionRepo.findOne({where:{id: conversation_id} })
                if(!conversation){
                    return socket.emit("typing_error",{message: "Conversation not found."})
                }
                
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
    
        socket.on("join_call", async (data):Promise<any> => {
            try {
                const {call_id, receiver_id} = data;
                // const callHistoryRepo = AppDataSource.getRepository(CallHistory);

                // const call = await callHistoryRepo.findOne({where:{id: call_id, receiver_id: receiver_id} })
                // if(!call){
                //     return socket.emit("error_message",{message: "Call not found"})
                // }
                
                // update call status to "answered" and mark it as seen
                // call.call_status = 'answered';
                // call.is_seen = true;
                // await callHistoryRepo.save(call);

                // Emit success response
                socket.emit("join-call-success",{message:"you joined call successfully."})
            } catch (error) {
                if(error instanceof Error){
                    socket.emit("error_message",{message: error.message})
                }
            }
        })

        socket.on("end-call",async(data):Promise<any> => {
            try {
                const {user_id, callId, duration, conversation_id} = data;
                
                const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);

                const other_participant = await conversationParticipantRepo.findOne({where: {conversation_id: conversation_id, user_id: Not(user_id)}});

                // const callHistoryRepo = AppDataSource.getRepository(CallHistory);

                // const call = await callHistoryRepo.findOne({where:{id: callId } })
                // const ended_call_user = call?.caller_id === user_id ? call?.receiver_id : call?.caller_id
       
                // if(!call){
                //     return socket.emit("error_message",{message: "Call not found"})
                // }

                // update call
                // if(call.call_status === "ongoing" || call.call_status === "answered"){
                //     call.call_status = "ended"
                // }
                // call.duration = duration || 0;
                // call.call_ended_by = user_id;

                // await callHistoryRepo.save(call);
                

                // Emit event confirming the call has ended
                io.to(`personal_data_${other_participant?.user_id}`).emit("call_ended", {
                    message:"Call ended successfull.", 
                    callId, 
                    conversation_id
                });

                
                const conversationReporsitory = AppDataSource.getRepository(Conversation)
                const chatDetails = await conversationReporsitory.findOne({
                    where: {id: conversation_id},
                    relations: ["participants","messages"]  // Joining related tables
                });

                if(!chatDetails){
                    return socket.emit("error_message",{message: "Conversation not found."})
                }

                const otherParticipants = chatDetails.participants.filter((p) => p.user_id !== user_id);
                
                await Promise.all(
                    otherParticipants.map(async (participantId) => {
                        await getUserDeviceTokens(participantId.user_id,async (error, tokens):Promise<any> =>{
                            if(error){
                                return socket.emit("error_message",{message: "User tokens not found"})
                            }else{
                                if(tokens.length > 0){
                                    const notificationObj = {
                                        title: "End-call",
                                        body: "End call notification",
                                        additionalData:{
                                            type: NotificationType.AGORA_END_CALL,
                                            // callType: callType,
                                            // conversation_id: conversation_id,
                                            // sender:formatUserResponse(senderDetails),
                                            // channel_name: channelName,
                                            callId: String(callId)
                                        }
                                    }
                                    
                                    await sendPushNotificationByTokens(notificationObj, tokens)
                                    // const title = "Notification title";
                                    // const body = "Notification body"
                                    // await saveNotificationHistory(userId, participantId.user_id, title, body)
                                }
                            }
                        })
                    })
                )
                
            } catch (error) {
                return socket.emit("error_message",{message: "Something wrong to end-call"})
            }
        })

        socket.on("initially_unread_notification",async(data) => {
            const {user_id} = data;
            try {
                const notificationRepo = AppDataSource.getRepository(NotificationHistory);

                const count = await notificationRepo.count(
                    {
                        where: {
                            receiver:{id: user_id}, is_read: false     
                        }
                    }
                );
                if(count > 0){
                    io.to(`personal_data_${user_id}`).emit(`new_notification_arrived`, {
                        is_new_notification: true,
                    });
                }
            } catch (error) {
                 io.emit("error_message",{message: "Something wrong to initially unread notification"})
            }
        })

        socket.on("fetch_current_location",async (data):Promise<any> => {
            try {
                const {user_id, latitude, longitude} = data;

                // validate data
                if(!user_id || !latitude || !longitude){
                    return io.emit("error_message",{message: "user_id or latitude or longitude field are required"})
                }

                // Find user and update location
                const userRepository = AppDataSource.getRepository(Users);
                const user = await userRepository.findOne({where: {id: user_id} });

                if(!user){
                    return io.emit("error_message",{message : "User not found"})
                }

                user.latitude = latitude;
                user.longitude = longitude;
                await userRepository.save(user)
                // Broadcast updated location to all clients
                return io.emit("current_location_updated",{user_id, latitude, longitude})
            } catch (error) {
                io.emit("error_message",{message: "Something wrong to update user current location"})
            }
        });

        socket.on("check_user_liked",async(data):Promise<any> => {
            console.log("++++++++++++++ check_user_liked +++++++++++++++++")
            try {
                const {target_user_id, loggedInUserId, interaction_type, notificationObj} = data;
                
                const userInteractionRepository = AppDataSource.getRepository(UserInteraction);
                const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);
                const userRepo = AppDataSource.getRepository(Users);

                const loggedInUser = await userRepo.findOne({where: {id: loggedInUserId}})
                if(!loggedInUser){
                    return io.emit("error_message",{message : "Logged in user not found"})
                }

                const targetUser = await userRepo.findOne({where:{id: target_user_id} });
                if(!targetUser){
                    return io.emit("error_message",{message : "target user not found."})
                } 

                // Check if user has already liked the target user
                const existingInteraction = await userInteractionRepository.findOne({
                    where: {
                        user: { id: loggedInUserId },
                        targetUser: { id: target_user_id },
                        interaction_type: interaction_type as "like" | "dislike",
                    },
                });

                if(existingInteraction){
                    existingInteraction.created_at = new Date();
                    existingInteraction.interaction_type = interaction_type as "like" | "dislike";
                    await userInteractionRepository.save(existingInteraction);

                    return io.to(`personal_data_${loggedInUserId}`).emit("user_already_liked",{
                        is_already_liked: false,
                        // message : `You have already ${interaction_type}d this user.`
                    })
                }

                const oppositeInteraction = await userInteractionRepository.findOne({
                    where: {
                        user: {id: target_user_id}, // target user liked me before
                        targetUser: {id: loggedInUserId},
                        interaction_type: "like"
                    },
                    relations:["targetUser"]
                });
                
                await userInteractionRepository.delete({user_id: loggedInUserId, target_user_id: target_user_id, interaction_type: "dislike"});
               
                const userInteraction = userInteractionRepository.create({
                    targetUser: {id: target_user_id},
                    user: {id: loggedInUserId},
                    interaction_type:interaction_type as "like" | "dislike",
                    created_at: new Date()
                })
                const result = await userInteractionRepository.save(userInteraction);

                if(!oppositeInteraction && interaction_type === "like"){
                    const pushNotificationObj = {
                        title: `${loggedInUser.name}`,
                        body: `Has invited you to match!`,
                        additionalData: {
                            type: NotificationType.INVITATION,
                            sender: sender_details(loggedInUser)
                        }
                    }
            
                    await getUserDeviceTokens(target_user_id, async(error, tokens):Promise<any> => {
                        if(error){
                            if(error instanceof Error){
                                return io.emit("error_message",{message: error.message})
                            }
                        }
                        const title = `${loggedInUser.name}`;
                        const body = `Has invited you to match!`;
                        await sendPushNotificationByTokens(pushNotificationObj, tokens)
                        const notificationType = NotificationType.INVITATION
                        await saveNotificationHistory(
                            loggedInUserId, 
                            target_user_id, 
                            title, 
                            body,
                            null,
                            notificationType,
                            null,
                            null,
                            null,
                            null,
                            null
                        )
                    })

                    io.to(`personal_data_${target_user_id}`).emit(`new_notification_arrived`,{
                        is_new_notification: true
                    })
                    console.log("++++++++++++ First time create match +++++++++++++")
                }else if(oppositeInteraction && interaction_type === "like"){

                    
                    const notificationRepo = AppDataSource.getRepository(NotificationHistory);
                    

                   

                    io.to(`personal_data_${target_user_id}`).emit(`new_notification_arrived`,{
                        is_new_notification: true
                    })

                    const userId = loggedInUserId;
                    const type = "one-to-one";
                    let partcipants: any = []
                    partcipants.push({"user_id":target_user_id},{"user_id": userId})
                    
                    if(!type || !partcipants || partcipants.length === 0){
                        io.emit("error_message",{message: "Invalid input data for create conversation."})
                    }
                    
                    addConversations({type, partcipants}, userId,async (error, result)=>{
                        if(error){
                            io.emit("error_message",{message: "Error from create conversation."})
                        }
       

                        const user1Conversations = await conversationParticipantRepo.find({
                            where: { user_id: loggedInUserId },
                            select: ["conversation_id","is_unmatched_user"],
                        });
                        
                        if(user1Conversations.length > 0){
                            
                            const conversationIds = user1Conversations.filter(c => c.is_unmatched_user === true).map(c => c.conversation_id);

                            if(conversationIds.length > 0){
                                const userIds = [loggedInUserId, target_user_id]
                                await conversationParticipantRepo.update(
                                    { user_id: In(userIds), conversation_id: In(conversationIds)},
                                    { is_unmatched_user: false}
                                )
                            }
                        }

                        const user2Conversations = await conversationParticipantRepo.find({
                            where: { user_id: target_user_id },
                            select: ["conversation_id","is_unmatched_user"],
                        });
                        
                        const commonConversation = user1Conversations.find(c1 =>
                            user2Conversations.some(c2 => c2.conversation_id === c1.conversation_id)
                        );
                        
                        if(notificationObj){
                        const {notification_id, notification_type} = notificationObj

                            // user like back from notification
                            await notificationRepo.update(
                                {id: notification_id,notification_type: NotificationType.INVITATION},
                                {notification_type:NotificationType.LIKE_BACK, conversation_id: commonConversation?.conversation_id}
                            )
                        }else{
                            // when user like back from home page (like right swipe)
                            await notificationRepo.update(
                                {receiver:{id: loggedInUserId}, sender: {id: target_user_id}, notification_type : NotificationType.INVITATION },
                                {notification_type: NotificationType.LIKE_BACK, conversation_id: commonConversation?.conversation_id}
                            )
                        }
                        
                        const matchNotification = {
                            title: "It's a Match!",
                            body: "You and " + loggedInUser.name + " liked each other.",
                            additionalData: {
                                // type: NotificationType.MATCH,
                                type: NotificationType.LIKE_BACK,
                                sender: sender_details(loggedInUser),
                                conversation_id: commonConversation?.conversation_id
                            }
                        };
            
                        await getUserDeviceTokens(target_user_id, async(error, tokens):Promise<any> => {
                            if(error){
                                if(error instanceof Error){
                                    return io.emit("error_message",{message: error.message})
                                }
                            }
                    
                            await sendPushNotificationByTokens(matchNotification, tokens);
                        });

                        const title = "New Interaction";
                        const body = "You and " + loggedInUser.name + " liked each other."
                        const notificationType = NotificationType.LIKE_BACK
                        await saveNotificationHistory(
                            loggedInUserId, 
                            target_user_id, 
                            title, 
                            body, 
                            null, 
                            notificationType, 
                            null,
                            null,
                            null,
                            null,
                            commonConversation?.conversation_id);
                         io.to(`personal_data_${loggedInUserId}`).emit("user_already_liked",{
                            is_already_liked: true,
                            targetUser: formatUserResponse(targetUser),
                            conversation_id: commonConversation?.conversation_id ?? null
                        })
                        return
                    })
                }else{
                    io.to(`personal_data_${loggedInUserId}`).emit("user_already_liked",{
                        is_already_liked: false, 
                    })
                }
                
            } catch (error) {
                io.emit("error_message",{message: "Something wrong to check_user_liked"})
            }
        })

        io.on("logout", (data) => {
            const { user_id, fcm_token} = data;
            try {
                delete connectedSocketUser[user_id];
                const last_seen = new Date();
                socket.broadcast.emit("user_status", { user_id, is_online: false, last_seen: last_seen, last_online: last_seen});
                userOnlineStatusMap[user_id] = false;

                const userRepo = AppDataSource.getRepository(Users);
                const deviceRepo = AppDataSource.getRepository(DeviceTable);

                // Update last_seen only when the user goes offline
                userRepo.update({id: user_id}, {last_seen: last_seen, is_online: false, last_online: last_seen});
                
            } catch (error) {
                console.error("Error in typing event:", error);
                socket.emit("logout-error", { message: "An error occurred" });
            }
        });

        socket.on("set_user_is_online",async (data) => {
            try {
            const now = new Date();
            const {userId} = data;
            
            const userRepo = AppDataSource.getRepository(Users);
            const user = await userRepo.findOne({where:{id: userId} ,select:["is_online"]});

            await userRepo.update(
                {id: userId, is_deleted: false},
                {last_online: now, is_online: true, last_seen: null}
            )
            if(!user?.is_online){
                socket.broadcast.emit("user-online-success",{userOnline: "set_user_is_online",userId,last_online: now, isOnline: true, lastSeen: null });
            }
            
            } catch (error) {
                console.error("Error in set_user_is_online event:", error);
                socket.emit("set_user_is_online_error", { message: "An error occurred" });
            }
        })
        
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
}