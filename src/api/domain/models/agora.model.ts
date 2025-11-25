import { env } from "../../../infrastructure/env"
import { getIo } from "../../../infrastructure/webserver/express";
import { userOnlineStatusMap } from "../../../infrastructure/webserver/socket/socket.io";
import { AppDataSource } from "../../config/db";
import { agoraToken } from "../../helpers/utility";
import { Conversation } from "../entities/conversation.entities";
import {v4 as uuidv4} from "uuid"
import { Users } from "../entities/users.enities";
import { getUserDeviceTokens, sendPushNotificationByTokens } from "./device.table.model";

import { saveNotificationHistory } from "./notification.history.model";
import { CallType } from "../../enum";
import { formatUserResponse } from "../responseDto/userResponseDto";

export async function createAgoraToken(
    userId: number,
    callType: string,
    chatId:number,
    callback:(error:any, result:any)=> void
){
    try {
        const io = getIo()
        const isInComeingCall = true
        const conversationReporsitory = AppDataSource.getRepository(Conversation);
        const usersReporsitory = AppDataSource.getRepository(Users);

        const channelName = uuidv4();
        const uid = 0;

        const APP_ID = env.APP_ID || "";
        const APP_CERTIFICATE = env.APP_CERTIFICATE || "";
        const chatDetails = await conversationReporsitory.findOne({
            where: {id: chatId},
            relations: ["participants","messages"]  // Joining related tables
        });

        // exclude caller from participants
        
        if(!chatDetails){
            return callback("Chat not found",null)
        }

        const otherParticipants = chatDetails.participants.filter((p) => p.user_id !== userId);
        const senderDetails = await usersReporsitory.findOne({where:{id: userId}})

        if(!senderDetails){
            return callback("Sender not found.",null)
        }
        // @ts-ignore
        delete senderDetails?.password;

        const token = await agoraToken(APP_ID,APP_CERTIFICATE, channelName, uid)
        // const token = "007eJxTYMjnkdt/pmuW3MV9/lKv9Z9E84mvqDr0+O9KD8GIk8eOpa5XYEg0NjA0s7QwSTRINDJJNjdJNDA0NzIwSUkzN00yTzI1m2x6M32x8830nP+GDIwMjAwsDIwMID4TmGQGkyxgUoXBwMQyySTN0EzXKC3VVNfEIilF19LC1FTX3MLAKNXM2MzC0CKZgQEA4wYwJw=="

        
        // Notify all participants
        await Promise.all(
            otherParticipants.map(async (participantId) => {
                const partcipant:any = participantId.user_id.toString()
                const onlineReceiver = userOnlineStatusMap[partcipant]
                if(onlineReceiver){
                    console.log("onlineReceiver is done")
                    io.to(onlineReceiver).emit("receiver-agora-token-generated",{
                        partcipant,
                        token,
                        channelName,
                        callType,
                        conversationId: chatId,
                        sender: senderDetails,
                    })
                }
                await getUserDeviceTokens(participantId.user_id,async (error, tokens) =>{
                    if(error){
                        return callback("User tokens not found", null)
                    }else{
                        if(tokens.length > 0){
                            const notificationObj = {
                                title: senderDetails?.name,
                                body: "Call notification",
                                additionalData:{
                                    token,
                                    type: CallType.AGORA_CALL_INVITATION,
                                    callType: callType,
                                    conversation_id: chatId,
                                    sender:formatUserResponse(senderDetails),
                                    channel_name: channelName,
                                    // callId: String(callRecord.id),
                                    receiver_id: participantId.user_id,
                                    isInComeingCall
                                }
                            }
                            await sendPushNotificationByTokens(notificationObj, tokens)
                            const title = "Notification title";
                            const body = "Notification body"
                            // await saveNotificationHistory(userId, participantId.user_id, title, body)
                        }
                    }
                })
            })
        )
        if(token){
            return callback(null,{
                token,
                channelName,
                APP_ID,
                callType,
            })
        }else{
            return callback(`Something went wrong generating the agora token`,null)
        }
    } catch (error) {
        return callback(error, null)
    }
}


export const getAgoraAppIdLogic = async(
    callback:(error:any, result: any) => void
)=>{
    const APP_ID = env.APP_ID || "";
    const lookingForRepo = await AppDataSource.query(
        `SELECT * FROM public.looking_for_list ORDER BY id ASC`
    )

    try {
        return callback(null,{APP_ID, looking_for: lookingForRepo})
    } catch (error) {
        return callback(
            {
                status: 500,
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "An unexpected error occurred.",
            },
            null
        );
    }
}