import { In } from "typeorm";
import { AppDataSource } from "../../config/db"
import { UserInteraction } from "../entities/user.interactions.entities"
import { Users } from "../entities/users.enities";
import { formatUserResponse, sender_details } from "../responseDto/userResponseDto";
import { getUserDeviceTokens, sendPushNotificationByTokens } from "./device.table.model";
import { saveNotificationHistory } from "./notification.history.model";
import { NotificationType } from "../../enum";
import { addConversations } from "./conversation.model";
import { ConversationParticipant } from "../entities/conversation.participant.entities";
import { getIo } from "../../../infrastructure/webserver/express";
import { NotificationHistory } from "../entities/notification.history.entities";
import { BlockedUser } from "../entities/blocked.user.entities";


export async function createUserInteraction(
    loggedInUserId:number,
    target_user_id: number,
    interaction_type: string,   // like | dislike
    notificationObj: any,
    callback:(error:any, result:any)=> void
) {
    try {
      const io = getIo();
        const userInteractionRepository = AppDataSource.getRepository(UserInteraction);
        const userRepository = AppDataSource.getRepository(Users);
        const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);
        const loggedInUser = await userRepository.findOne({where: {id: loggedInUserId}})
        if(!loggedInUser){
            return callback("Logged in user not found", null)
        }

        const targetUser = await userRepository.findOne({where: {id: target_user_id}})
        if(!targetUser){
            return callback("targetUser user not found", null)
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
            return callback(`You have already ${interaction_type}d this user.`, null)
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

        if(oppositeInteraction && interaction_type === "like"){
            const userInteraction = userInteractionRepository.create({
              targetUser: {id: target_user_id},
              user: {id: loggedInUserId},
              interaction_type:interaction_type as "like" | "dislike",
          })
          const result = await userInteractionRepository.save(userInteraction);

          

            const notificationRepo = AppDataSource.getRepository(NotificationHistory);
            

             io.to(`personal_data_${target_user_id}`).emit(`new_notification_arrived`,{
                  is_new_notification: true
              })

              const userId = loggedInUserId;
              const type = "one-to-one";
              let partcipants: any = []
              partcipants.push({"user_id":target_user_id},{"user_id": userId})
              
              if(!type || !partcipants || partcipants.length === 0){
                  return io.emit("error_message",{message: "Invalid input data for create conversation."})
              }

              addConversations({type, partcipants}, userId,async (error, result)=>{
                  if(error){
                      return io.emit("error_message",{message: "Error from create conversation."})
                  }

                  const user1Conversations = await conversationParticipantRepo.find({
                      where: { user_id: loggedInUserId },
                      select: ["conversation_id"],
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
                      select: ["conversation_id"],
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
                  let conversation_id:any = null;
                  if(commonConversation){
                    conversation_id = commonConversation.conversation_id
                  }
                  await saveNotificationHistory(
                    loggedInUser.id, 
                    target_user_id, 
                    title, 
                    body, 
                    null, 
                    notificationType,
                    null,
                    null,
                    null,
                    null,
                    conversation_id 
                  )
                  
                  io.to(`personal_data_${loggedInUserId}`).emit("user_already_liked",{
                    is_already_liked: true,
                    targetUser: formatUserResponse(targetUser),
                    conversation_id: commonConversation?.conversation_id ?? null
                  })
                return callback(null,{
                    is_already_liked: true,
                    targetUser: formatUserResponse(targetUser),
                    conversation_id: commonConversation?.conversation_id ?? null
                })
            })
        }
      
        
        // return callback(null,"Add successfully.")
    } catch (error) {
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}
export async function userMatchesList(
    userId: number,
    page:number,
    limit:number,
    search: string,
    callback: (error: any, result: any) => void
  ) {
    try {
      const userInteractionRepository = AppDataSource.getRepository(UserInteraction);
      const userRepository = AppDataSource.getRepository(Users);
      const conversationParticipantRepo = AppDataSource.getRepository(ConversationParticipant);
  
      // Step 1: Get matched user IDs (mutual likes)
      const matchedUserIdsResult = await userInteractionRepository
        .createQueryBuilder("interaction")
        .select("interaction.target_user_id", "matchedUserId")
        .where("interaction.user_id = :loggedInUserId", { loggedInUserId: userId })
        .andWhere("interaction.interaction_type = 'like'")
        .andWhere(qb => {
          const subQuery = qb.subQuery()
            .select("1")
            .from(UserInteraction, "sub_interaction")
            .where("sub_interaction.user_id = interaction.target_user_id")
            .andWhere("sub_interaction.target_user_id = :loggedInUserId", { loggedInUserId: userId })
            .andWhere("sub_interaction.interaction_type = 'like'")
            .getQuery();
          return `EXISTS ${subQuery}`;
        })
        .andWhere(qb => {
          const blockedSubQuery = qb.subQuery()
          .select("1")
          .from(BlockedUser, "blocked")
          .where(
            `(blocked.blocker_id = :loggedInUserId AND blocked.blocked_id = interaction.target_user_id)
            OR
            (blocked.blocked_id = :loggedInUserId AND blocked.blocker_id = interaction.target_user_id)
            `
          )
          .setParameter("loggedInUserId", userId)
          .getQuery();
          return `NOT EXISTS ${blockedSubQuery}`
        })
        .getRawMany();
  
      const matchedUserIds = matchedUserIdsResult.map(r => r.matchedUserId);
  
      if (matchedUserIds.length === 0) {
        return callback(null, { matchedUsers: [], total: 0, page, limit });
      }
  
      const queryBuilder = userRepository.createQueryBuilder("user")
      .where("user.id IN (:...matchedUserIds)", {matchedUserIds: matchedUserIds})
      .andWhere("user.is_deleted = false");

      if(search){
        queryBuilder.andWhere("user.name ILIKE :search",{search: `%${search}%`});
      }
      const total = await queryBuilder.getCount();

      // Step 2: Fetch all conversation IDs for the logged-in user
      const user1Conversations = await conversationParticipantRepo.find({
        where: { user_id: userId },
        select: ["conversation_id"],
      });
  
      // Step 3: Fetch matched user profiles
      const matchedUsers = await queryBuilder
        .select(["user.id", "user.name", "user.profile_image", "user.gender", "user.age", "user.job"])
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
  
      // Step 4: Attach conversation_id to each matched user
      const result = await Promise.all(
        matchedUsers.map(async (matchedUser) => {
          const user2Conversations = await conversationParticipantRepo.find({
            where: { user_id: matchedUser.id },
            select: ["conversation_id"],
          });
  
          const commonConversation = user1Conversations.find(c1 =>
            user2Conversations.some(c2 => c2.conversation_id === c1.conversation_id)
          );
  
          return {
            ...matchedUser,
            conversation_id: commonConversation?.conversation_id ?? null,
          };
        })
      );
      const pagination = {
        total: matchedUserIds.length,
        currentPage: page,
        totalPages: Math.ceil(matchedUserIds.length / limit),
      };
      return callback(null, { matchedUsers: result, pagination });
    } catch (error) {
      return callback(error instanceof Error ? error.message : error, null);
    }
  } 

export const deleteUsersInteraction = async(
    callback:(error:any, result:any) => void
)=>{
    try {
        const userInteraction = AppDataSource.getRepository(UserInteraction);

        await userInteraction.clear()
        return callback(null,"Delete successfully.")
    } catch (error) {
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}