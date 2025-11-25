import { AppDataSource } from "../../config/db"
import {pushAdmin as admin } from "../../helpers/firebaseConfig"
import { logger } from "../../lib/logger"
import { DeviceTable } from "../entities/device.token.entities"

export async function getUserDeviceTokens(
    userId: number,
    callback:(error:any, result:any)=> void
){
    try {
        const deviceTableRepository = AppDataSource.getRepository(DeviceTable)
        const tokens = await deviceTableRepository.find({
            where: {user:{id: userId} },
            select: ["fcm_token"]
        })
        if(tokens.length > 0){
            return callback(null, tokens)
        }else{
            return callback(null, [])
        }
    } catch (error) {
        callback(error,null)
    }
}

export async function sendPushNotificationByTokens(notificationObj:any, tokens:string[]): Promise<any>{
    try {
        
        const {
            token,
            type,
            callType,
            conversation_id,
            conversation,
            sender,
            channel_name,
            callId,
            receiver_id,
            photo,
            video,
            likeCount,
            video_likes_count,
            commentMessage,
            
        } = notificationObj.additionalData;
      
        if(tokens.length === 0){
            return {error: "No tokens found"}
        }

        // Extract pure tokens string
        const tokenStrings = tokens.map((t:any) => typeof t === "string" ? t : t.fcm_token)
        
        const message :any = {
            tokens: tokenStrings,
            notification: {
                title: notificationObj.title || "Notification",
                body : notificationObj.body || ""
            },
            data:{
                token: token ?? "",
                click_action:"FLUTTER_NOTIFICATION_CLICK",
                sound: "default",
                
                type: type ?? "",
                callType: callType ?? "",
                conversation_id: String(conversation_id) ?? "",
                conversation: JSON.stringify(conversation) ?? "",
                sender: JSON.stringify(sender) ?? "",
                channel_name: channel_name ?? "",
                callId: String(callId) ?? "",
                receiver_id: String(receiver_id) ?? "",
                photo: JSON.stringify(photo) ?? "",
                video: JSON.stringify(video) ?? "",
                likeCount: String(likeCount) ?? "0",
                video_likes_count: String(video_likes_count) ?? "0",
                commentMessage: String(commentMessage) ?? ""
            },
            android:{
                priority: "high",
                notification:{
                    sound: "default"
                }
            },
            apns:{
                // payload:{
                //     aps:{
                //         sound: "default"
                //     }
                // }

                payload: {
                    aps:{
                        "content-available": 1,
                        // "sound": deviceType === "ios" && isInComeingCall ? "bell_standard_call.caf" : "default",
                        "mutable-content": 1,
                        alert: {
                            title:notificationObj.title,
                            body:notificationObj.body
                        }
                    }
                }
            },
            priority:"high",
            
            
        }
        console.log("Push notification send successfully.")
        const response = await admin.messaging().sendEachForMulticast({
            // tokens: tokenStrings,
            ...message, 
            // dryRun:true
        });

        // response.responses.forEach((resp, idx) => {
        //     if (!resp.success) {
        //       console.error("❌ Token Failed:", tokenStrings[idx]);
        //       console.error("➡️ Error Message:", resp.error?.message);
        //       console.error("➡️ Error Code:", resp.error?.code);
        //       console.error("➡️ Full Error:", resp.error);
        //     }
        //   });

        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });

            logger.debug(`Failed to send notifications to some tokens: ${JSON.stringify(failedTokens)}`);
            console.error("Failed tokens:", failedTokens);
        }
        return response
    } catch (error) {
        logger.error("Error sending push notification",error)
        throw new Error(`Failed to send push notification`)
    }
}