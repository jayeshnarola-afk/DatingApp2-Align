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
        // const existingDateMessage = await getDateMessage(conversation_id, now)

        const message = messageRepository.create({
            conversation: {id: conversation_id},
            sender: {id: sender_id},
            content: content,
            message_type: message_type,
            images: (message_type === "media") ? images : null,
            // dating_details: cafe_location || null,
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
        const userRepository = AppDataSource.getRepository(Users);
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
        //@ts-ignore
        // delete message_details?.sender;
        
        return message_details;
    } catch (error) {
        throw new Error(`Failed to send getMessageDetails`)
    }
}