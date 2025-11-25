import { getIo } from "../../../infrastructure/webserver/express"
import { AppDataSource } from "../../config/db"
import { NotificationType } from "../../enum"
import { NotificationHistory } from "../entities/notification.history.entities"
import { Users } from "../entities/users.enities"

export const getNotificationHistory = async(
    userId: number,
    callback:(error:any, result:any) => void
) => {
    try {
        const io = getIo()
        const notificationRepo = AppDataSource.getRepository(NotificationHistory)
        const userRepo = AppDataSource.getRepository(Users);

        const loggedInUser = await userRepo.findOne({where: {id: userId},select:["id","latitude","longitude"]})
        if(!loggedInUser){
            return callback("User not found", null)
        }

        await notificationRepo.update(
            {receiver:{id: userId}, is_read: false },
            {is_read: true}
        );

        io.to(`personal_data_${userId}`).emit(`new_notification_arrived`, {
          is_new_notification: false,
        });

        // Fetch notification
        const notifications = await notificationRepo
        .createQueryBuilder("notification")
        .leftJoinAndSelect("notification.sender", "sender")
        .leftJoinAndSelect("notification.receiver", "receiver")
        .leftJoinAndSelect("notification.photo", "photo")
        .leftJoinAndSelect("notification.video","video")
        .loadRelationCountAndMap(
            "photo.likeCount",
            "photo.likes",
            "likes",
            qb => qb.where("likes.user_like_photo = :liked", { liked: true })
        )
        .loadRelationCountAndMap(
            "video.video_likes_count",
            "video.likes",
            "likes",
            qb => qb.where("likes.user_like_video = :liked", { liked: true })
        )
        .where("notification.receiver_id = :userId", { userId })
        .andWhere("sender.is_deleted = false")
        .andWhere("receiver.is_deleted = false")
        .andWhere("notification.notification_type NOT IN (:...excludedTypes)",{
            excludedTypes: [NotificationType.NEW_REGISTRATION, NotificationType.REPORT_USER]
        })
        .orderBy("notification.id", "DESC")
        .getMany();

        const formatedResponse = notifications.map((entry) => {
            const senderLat = Number(entry.sender.latitude);
            const senderLon = Number(entry.sender.longitude);
            const receiverLat = Number(loggedInUser.latitude);
            const receiverLon = Number(loggedInUser.longitude);
            // console.log("sender lat & lon | receiver lat & lon",senderLat, senderLon, receiverLat, receiverLon);
            const isValidCoords = senderLat !== 0 && senderLon !== 0 && receiverLat !== 0 && receiverLon !== 0;
            let distance;
            if(isValidCoords){
                const calculated = calculateDistance(receiverLat, receiverLon, senderLat, senderLon);
                distance = calculated !== null && calculated < 1 ? "Nearby." : `${calculated} Km`
            }
            
            return {
                id: entry.id,
                title: entry.title,
                body: entry.body,
                is_read: entry.is_read,
                created_at: entry.created_at,
                sender: {
                    id: entry.sender.id,
                    name: entry.sender.name,
                    profile_image : entry.sender.profile_image,
                    latitude: senderLat,
                    longitude: senderLon,
                },
                receiver: {
                    id: entry.receiver.id,
                    name: entry.receiver.name,
                    profile_image : entry.receiver.profile_image,    
                    latitude: receiverLat,
                    longitude: receiverLon,
                },
                photo: entry.photo,
                video: entry.video,
                comment: entry.comment_message,
                notification_type: entry.notification_type,
                distance: distance,
                conversation_id: entry.conversation_id
            }
        })
        return callback(null,{notifications: formatedResponse})
    } catch (error) {
        console.log(error)
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}
const toRad = (value: number) => (value * Math.PI) / 180;

const calculateDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
):number | null => {
    if(lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null

    const R = 6371; // Radius of earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * 
    Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}


export const clearUserNotification = async(
    userId: number,
    callback:(error:any, result:any) => void
) => {
    try {
        const notificationRepo = AppDataSource.getRepository(NotificationHistory);
        await notificationRepo.delete(
            {receiver: {id: userId}, is_read: true }
        );

        return callback(null, "Delete successfully.")
    } catch (error) {
        console.log(error)
        if(error instanceof Error){
            return callback(error.message, null)
        }
    }
}
