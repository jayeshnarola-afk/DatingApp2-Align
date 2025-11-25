import { AppDataSource } from "../../config/db"
import { NotificationHistory } from "../entities/notification.history.entities"
import { PhotoComment } from "../entities/photo.comment.entities";
import { PhotosGallary } from "../entities/photo_gallary.entities";
import { VideoComment } from "../entities/video.comment.entities";
import { VideosGallary } from "../entities/video_gallary.entities";

export const saveNotificationHistory = async (
    senderId: number,
    receiverId: number,
    title: string,
    body: string,
    media_type: string | null,
    notificationType: string,
    photo_id?: number | null,
    video_id?: number | null,
    comment_id?:number | null,
    commentMessage?:any,
    conversation_id?: any
):Promise<any> => {
    try {
    
        const notificationRepo = AppDataSource.getRepository(NotificationHistory);
        const photoGallaryRepo = AppDataSource.getRepository(PhotosGallary);
        const videoGallaryRepo = AppDataSource.getRepository(VideosGallary);
        const photoCommentRepo = AppDataSource.getRepository(PhotoComment);
        const videoCommentRepo = AppDataSource.getRepository(VideoComment);

        let photo;
        let video;
        let comment;
        
        if(media_type === "Photo"){
            if(!photo_id){
                return "photo_id is required."
            }
            photo = await photoGallaryRepo.findOne({where:{id: photo_id} })
            if(!photo){
                return "Photo is not found."
            }
            if(!comment_id){
                return "comment_id is required."
            }
            comment = await photoCommentRepo.findOne({where:{id: comment_id} });
            if(!comment){
                return "User comment not found."
            }
        }

        if(media_type === "Video"){
            if(!video_id){
                return "video_id is required."
            }
            video = await videoGallaryRepo.findOne({where:{id: video_id} })

            if(!video){
                return "Video is not found."
            }
            if(!comment_id){
                return "comment_id is required."
            }
            comment = await videoCommentRepo.findOne({where:{id: comment_id } })
            if(!comment){
                return "User comment not found"
            }

        }
         
    try {   
            const notification = notificationRepo.create({
                sender: { id: senderId },  // Now tracking sender
                receiver: { id: receiverId },
                title: title,
                body: body,
                created_at: new Date(),
                is_read: false,
                notification_type: notificationType,
                photo: photo,
                video: video,
                comments: comment,
                comment_message: commentMessage,
                conversation_id: conversation_id
            });
            await notificationRepo.save(notification);
            console.log("Notification history saved successfully.");
            return
    } catch (error) {
        console.log("Errror--------->",error)
    }
        
    } catch (error) {
        console.log("Error saving notification history:", error);
        console.error("Error saving notification history:", error);
    }
};