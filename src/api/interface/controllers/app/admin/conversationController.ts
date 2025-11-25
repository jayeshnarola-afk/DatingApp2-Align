import { Request, Response } from "express";
import { logger } from "../../../../lib/logger";
import { ErrorResponse, successCreated, successResponse } from "../../../../helpers/apiResponse";
import { acceptDaingLocation, addConversations, cancelDatingLocation, findOneConversation, getChatConversations, getConversationsInfo, getLocationMessagesOfChat, messagesOfChat, rescheduledDatingLocation, saveCafeAddressLocation, sendMediaMessage } from "../../../../domain/models/conversation.model";
import { AppDataSource } from "../../../../config/db";
import { ConversationParticipant } from "../../../../domain/entities/conversation.participant.entities";

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

export const getOneConversation = async(req: Request, res: Response) => {
    const conversation_id = parseInt(req.params.conversation_id);
    console.log(conversation_id)
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

export const getLocationMessagesOfChatId = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const conversation_id = Number(req.params.conversation_id)
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20
    const search = String(req.query.search) || ""

    try {
        getLocationMessagesOfChat(userId,conversation_id,page,limit,search,(error:any, result:any) => {
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


export const getChatConversationInfo = async(req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const conversation_id = Number(req.params.conversation_id);

        getConversationsInfo(userId,conversation_id,(error:any, result:any) => {
            if(error){
                console.log("error...",error)
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Lists of conversations.",result)
        })
        
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const handleMediaUpload = async(req: Request, res: Response) => {
    try {
        const files = req.files
        if(!files){
            return ErrorResponse(res, "No files were uploaded.")
        }
        // const images = await Promise.all(
        //     files.map(async (file:any) => {
        //         const object = await uploadFile(file)
        //         return object;
        //     })
        // )
        // return successResponse(res, "Files upload successfully.",images)
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const saveCafeLocation = async(req: Request, res: Response)=>{
    const sender_id = req.user.userId;
    const matchuserId = req.body.match_user_id;
    const conversation_id = req.body.conversation_id;
    const cafe_location = req.body.cafe_location;
    const schedule_time = req.body.schedule_time
    const message_id = req.body.message_id;
    const created_at = req.body.created_at
    try {
        saveCafeAddressLocation(sender_id,matchuserId,conversation_id,cafe_location,schedule_time,message_id,created_at,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res,error)
            }
            return successResponse(res,"Save message.",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const acceptDating = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const {message_id, is_accepted} = req.body;

    try {
        acceptDaingLocation(userId, message_id,is_accepted,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successCreated(res, result)
        })    
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res,error.message)
        }
    }
}

export const cancelDating = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { message_id , reason} = req.body;
    try {
        cancelDatingLocation(userId, message_id,reason,(error:any, result:any) => {
            if(error){
                return ErrorResponse(null, error)
            }
            return successCreated(res, "Canceled succssfully.")
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const rescheduledDating = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const {message_id, schedule_time} = req.body;
    try {
        rescheduledDatingLocation(userId, message_id, schedule_time,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successCreated(res, result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}