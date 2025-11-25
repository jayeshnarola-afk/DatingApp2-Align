import { In } from "typeorm";
import { getIo } from "../../../infrastructure/webserver/express"
import { AppDataSource } from "../../config/db";
import { ErrorResponse } from "../../helpers/apiResponse";
import { BlockedUser } from "../entities/blocked.user.entities";
import { ConversationParticipant } from "../entities/conversation.participant.entities";
import { Message } from "../entities/message.entity";
import { unMatchUsers } from "../entities/unmatched.user.entities";
import { UserInteraction } from "../entities/user.interactions.entities";
import { Users } from "../entities/users.enities";
import { Conversation } from "../entities/conversation.entities";

export async function addToBlockUser(
    blocker_id:number,
    blocked_id:number,
    conversation_id: number,
    callback:(error:any, result:any) => void
){
    try {
        const io = getIo();
        if(!blocked_id || !blocker_id || !conversation_id){
            return callback("blockerId, blockedId and conversation_id are required",null)
        }
        const userRepo = AppDataSource.getRepository(Users);
        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);

        if(blocker_id === blocked_id){
            return callback("You cannot block yourself.",null)
        }

        const blocker = await userRepo.findOneBy({ id: blocker_id });
        const blocked = await userRepo.findOneBy({ id: blocked_id });

        if (!blocker || !blocked) {
            return callback("One or both users not found.",null)
        }

        const existingBlock = await blockedUserRepo.findOne({
            where: {blocker:{id: blocker_id}, blocked: {id: blocked_id} }
        });

        if(existingBlock){
            return callback("User already blocked.",null)
        }

        const block = blockedUserRepo.create({
            blocked,
            blocker,
            conversation_id
        });

        await blockedUserRepo.save(block);

        io.to(`personal_data_${blocked_id}`).emit(`user_blocked_status`,{
            isBlocked: true, conversation_id: conversation_id
        });

        return callback(null,"User blocked successfully.")
    } catch (error) {
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}

export const blockUserLists = async (
    blocker_id:number,
    callback:(error:any, result:any) => void
) => {
    try {
        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);

        const blockedUsers = await blockedUserRepo.find({
            where: {
                blocker: {id: blocker_id}
            },
            relations:["blocked"],
            order:{created_at: "DESC"}
        });

        const formatedResponse = blockedUsers.map((entry) => ({
            id: entry.id,
            blockedUser : {
                id: entry.blocked.id,
                name: entry.blocked.name,
                profile_image: entry.blocked.profile_image
            }
        }));

        return callback(null, formatedResponse)
    } catch (error) {
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}


export const userUnblock = async (
    blocker_id: number,
    blocked_id: number,
    callback:(error:any, result: any) => void
) => {
    try {
        const io = getIo();
        if(!blocked_id || !blocker_id){
            return callback("blockerId and blockedId are required",null)
        }

        const blockedRepo = AppDataSource.getRepository(BlockedUser);
        const blocked = await blockedRepo.findOne({
            where: {
                blocked: {id: blocked_id},
                blocker: {id: blocker_id}
            }
        });

        if(!blocked){
            return callback(null, "User is not blocked.")
        }

        const conversation_id = blocked.conversation_id;
        io.to(`personal_data_${blocked_id}`).emit(`user_blocked_status`,{
            isBlocked: false, conversation_id: conversation_id
        });

        await blockedRepo.remove(blocked);
        return callback(null, "User unblocked successfully.")
    } catch (error) {
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}


export const unMatchUserApi = async(
    userId:number, 
    un_match_user_id:number, 
    conversation_id:number,
    callback:(error:any, result:any) => void
)=>{
    try {
        const io = getIo();
        if(!userId || !un_match_user_id || !conversation_id){
            return callback("userId, un_match_user_id and conversation_id are required",null)
        }
        const userIds = [userId, un_match_user_id]
        const userInteractionRepo = AppDataSource.getRepository(UserInteraction);
        const unMatchUserRepo = AppDataSource.getRepository(unMatchUsers);
        const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);
        const conversation = AppDataSource.getRepository(Conversation);

         // Check if both match attempts exist
        const matchInteraction = await userInteractionRepo
        .createQueryBuilder("interaction")
        .where(
            `(
                (interaction.targetUser = :userId AND interaction.user = :unMatchUserId)
                OR
                (interaction.targetUser = :unMatchUserId AND interaction.user = :userId)
            )
            AND interaction.interaction_type = 'like'`,
            {
                userId,
                unMatchUserId: un_match_user_id
            }
        )
        .getMany();

        if(matchInteraction && matchInteraction.length > 0){
            const currentUserFromInteraction = matchInteraction.find((interaction) => interaction.user_id === userId);
            if(currentUserFromInteraction){
                userInteractionRepo.delete(currentUserFromInteraction.id);

                await conversationParticipantRepo.update(
                    {conversation_id,  user_id: In(userIds)},
                    {is_unmatched_user: true}
                )
            }
            
            
            // This code is temporarily commented out to avoid deleting conversation and chat history
            /*
            const participants = await conversationParticipantRepo.find({
                where: {conversation_id: conversation_id}
            })

            if(participants){
                await userInteractionRepo.remove(matchInteraction);

                // clear chat for both users
                await clearChatFunction(conversation_id, userId);
                await clearChatFunction(conversation_id, un_match_user_id);

                // Step 1: Delete both users from the conversation
                await conversationParticipantRepo.delete({
                    conversation_id: conversation_id,
                    user_id: In(userIds),
                });      
                
                await conversation.delete({id: conversation_id});
            }
            */

            // const saveUnMatch = unMatchUserRepo.create({
            //     conversation_id,
            //     unMatchUser: {id: un_match_user_id},
            //     user: {id: userId},
            //     created_at: new Date()
            // });

            // await unMatchUserRepo.save(saveUnMatch);

        }

        io.to(`personal_data_${un_match_user_id}`).emit("user_unmatch_success",{
            conversation_id: conversation_id, isUnMatched: true
        })

        return callback(null, "User un_matched successfully.")
    } catch (error) {
        console.log("errr.....",error)
        if(error instanceof Error){
            return callback(error.message,null)
        }
    }
}


export const clearChatFunction = async (conversation_id:number, user_id: number):Promise<any> => {
    try {
        const messageRepo = AppDataSource.getRepository(Message);
        const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);

        // Get the last message of this conversation
        const last_message = await messageRepo.findOne({
            where: {conversation_id},
            order: {created_at: "DESC"}
        })

        if(last_message){
            // save last_cleared_message_id for this user
            await conversationParticipantRepo.update(
                {conversation_id, user_id},
                {last_cleared_message_id: last_message.id}
            )
        }

    } catch (error) {
        return error
    }
}