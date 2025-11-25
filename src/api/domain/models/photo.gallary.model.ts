import { Repository } from "typeorm";
import { getIo } from "../../../infrastructure/webserver/express";
import { AppDataSource } from "../../config/db";
import { MediaTypeForGallary, NotificationType } from "../../enum";
import { uploadMultipleToFirebase } from "../../middlewares/uploadMedia";
import { PhotoComment } from "../entities/photo.comment.entities";
import { PhotoLike } from "../entities/photo.likes.entities";
import { PhotosGallary } from "../entities/photo_gallary.entities";
import { Users } from "../entities/users.enities";
import { VideoComment } from "../entities/video.comment.entities";
import { VideoLikes } from "../entities/video.likes.entities";
import { VideosGallary } from "../entities/video_gallary.entities";
import { sender_details } from "../responseDto/userResponseDto";
import { getUserDeviceTokens, sendPushNotificationByTokens } from "./device.table.model";
import { saveNotificationHistory } from "./notification.history.model";

export const uploadPhotosGallary = async (
  userId: number,
  reqbody: any,
  files: Express.Multer.File[],
  thumbnailFile: Express.Multer.File | undefined,
  callback: (error: any, result: any) => void
) => {
  try {
    const { media_type, caption } = reqbody;

    if (!files || files.length === 0) {
      return callback("No files provided", null);
    }

    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return callback("User not found", null);
    }

    const fileUrls = await uploadMultipleToFirebase(files, String(userId));
    const url = fileUrls[0];

    let response;

    if (media_type === MediaTypeForGallary.PHOTO) {
      const photoRepo = AppDataSource.getRepository(PhotosGallary);
      const photo = photoRepo.create({
        user,
        url,
        caption: caption ?? null,
      });
      await photoRepo.save(photo);

      response = {
        id: photo.id,
        url: photo.url,
        caption: photo.caption,
        created_at: photo.created_at,
      };
    } else if (media_type === MediaTypeForGallary.VIDEO) {
      let thumbnailUrl: string | undefined;

      // upload thumnail if provided
      if(thumbnailFile){
        const [thumbUrl] = await uploadMultipleToFirebase([thumbnailFile], String(userId))
        thumbnailUrl = thumbUrl
      }
      const videoRepo = AppDataSource.getRepository(VideosGallary);
      const video = videoRepo.create({
        user,
        url,
        caption: caption ?? null,
        thubmnail_image: thumbnailUrl
      });
      await videoRepo.save(video);

      response = {
        id: video.id,
        url: video.url,
        thubmnail_image: thumbnailUrl,
        caption: video.caption,
        created_at: video.created_at,
      };
    } else {
      return callback("Invalid media type", null);
    }

    return callback(null, response);
  } catch (error) {
    return callback(error instanceof Error ? error.message : "Unknown error", null);
  }
};

export const listsOfPhotosGallary = async (
  userId: number,
  callback: (error: any, result: any) => void
) => {
  try {
    const userReporsitory = AppDataSource.getRepository(Users);
    const photoGallaryRepo = AppDataSource.getRepository(PhotosGallary);

    const user = await userReporsitory.findOne({ where: { id: userId } });
    if (!user) {
      return callback("User not found", null);
    }

    const photos = await photoGallaryRepo.find({
      where: {
        user: { id: userId },
      },
      order: {
        created_at: "DESC",
      },
    });

    return callback(null, photos);
  } catch (error) {
    if (error instanceof Error) {
      return callback(error.message, null);
    }
  }
};

export const userLikesPhoto = async (
  photo_id: number,
  from_user_id: number,
  to_user_id: number,
  type: "like" | "dislike",
  media_type: "Photo" | "Video",
  callback: (error: any, result: any) => void
) => {
  try {
    const io = getIo();

    const userRepository = AppDataSource.getRepository(Users);
    const photoGalleryRepo = AppDataSource.getRepository(PhotosGallary);
    const photoLikesRepo = AppDataSource.getRepository(PhotoLike);
    const videoGalleryRepo = AppDataSource.getRepository(VideosGallary);
    const videoLikesRepo = AppDataSource.getRepository(VideoLikes);

    // Choose the correct repo dynamically
    const mediaRepo = media_type === "Photo" ? photoGalleryRepo : videoGalleryRepo;
    const likeRepo = media_type === "Photo" ? photoLikesRepo : videoLikesRepo;

    const [loggedInUser, toUser, media] = await Promise.all([
      userRepository.findOne({ where: { id: from_user_id } }),
      userRepository.findOne({ where: { id: to_user_id } }),
      mediaRepo.findOne({ where: { id: photo_id } }),
    ]);

    if (!loggedInUser) return callback("Logged-in user not found", null);
    if (!toUser) return callback("Target user not found", null);
    if (!media) return callback(`${media_type} not found`, null);

    // Find existing like/dislike
    const existingLike:any = await likeRepo.findOne({
      where: {
        [media_type.toLowerCase()]: { id: photo_id },
        user: { id: from_user_id },
      },
      relations: [media_type.toLowerCase()],
    });

    console.log("existingLike.user_like_video....",existingLike)
    const likeField = media_type === "Photo" ? "user_like_photo" : "user_like_video";
    // Handle Like/Dislike
    if (type === "like") {
      
      if (media_type === "Photo") {
        if(!existingLike){
          const newLike = (photoLikesRepo as Repository<PhotoLike>).create({
          photo: media,
          user: loggedInUser,
          user_like_photo: true,
          created_at: new Date()
        });
        await photoLikesRepo.save(newLike);
        } else if (!existingLike[likeField]) {
          await likeRepo.update({ id: existingLike.id }, { [likeField]: true });
        }
      
    } else if (media_type === "Video") {
      if(!existingLike){
      const newLike = (videoLikesRepo as Repository<VideoLikes>).create({
        video: media,
        user: loggedInUser,
        user_like_video: true,
        created_at: new Date()
      });
      await videoLikesRepo.save(newLike);
    }else if(!existingLike[likeField]){
          await likeRepo.update({ id: existingLike.id }, { [likeField]: true });
    }
    }
    } else if (type === "dislike") {
     
      if (existingLike && existingLike[likeField]) {
        await likeRepo.update({ id: existingLike.id }, { [likeField]: false });
      }
    }

    // Count total likes
    const likesCount = await likeRepo.count({
      where: {
        [media_type.toLowerCase()]: { id: photo_id },
        [likeField]: true,
      },
    });
    
    const photoId = media_type === "Photo" ? photo_id : null;
    const videoId = media_type === "Video" ? photo_id : null;
    
    const notificationType = media_type === "Photo" ? NotificationType.LIKE_PHOTO : NotificationType.LIKE_VIDEO
      
    // Send notification if liked
    if (type === "like" && from_user_id !== to_user_id) {
      const notification = {
        title: `${loggedInUser.name}, ${loggedInUser.age}`,
        body: `Liked your ${media_type.toLowerCase()}.`,
        additionalData: {
          type: notificationType,
          sender: sender_details(loggedInUser),
          [media_type.toLowerCase()]: media,
          likeCount: media_type === "Photo" ? likesCount : "0",
          video_likes_count: media_type === "Video" ? likesCount : "0"
        },
      };
    
      await getUserDeviceTokens(to_user_id, async (error, tokens) => {
        if (error) return callback(error, null);

        await sendPushNotificationByTokens(notification, tokens);

        const title = "New Like";
        const body = `${loggedInUser.name}, ${loggedInUser.age} liked your ${media_type.toLowerCase()}.`;

        await saveNotificationHistory(
          from_user_id,
          to_user_id,
          title,
          body,
          media_type,
          notificationType,
          photoId,
          videoId,
          null,
          null,
          null
        );

        io.to(`personal_data_${to_user_id}`).emit(`new_notification_arrived`, {
          is_new_notification: true,
        });
      });
    }

    return callback(null, { ["user_like_photo"]: type === "like", likesCount });
  } catch (error) {
    return callback(error instanceof Error ? error.message : "An unexpected error occurred", null);
  }
};


export const userCommentPhoto = async (
  photo_id: number,
  comment: string,
  from_user_id: number,
  to_user_id: number,
  type: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const io = getIo()
    const userReporsitory = AppDataSource.getRepository(Users);
    const photoGallaryRepo = AppDataSource.getRepository(PhotosGallary);
    const videoGallaryRepo = AppDataSource.getRepository(VideosGallary);

    const photoCommentRepo = AppDataSource.getRepository(PhotoComment);
    const videoCommentRepo = AppDataSource.getRepository(VideoComment);
    const photoLikesRepo = AppDataSource.getRepository(PhotoLike);
    const videoLikesRepo = AppDataSource.getRepository(VideoLikes);

    const loggedInUser = await userReporsitory.findOne({ where: { id: from_user_id } });
    if (!loggedInUser) {
      return callback("User not found", null);
    }
    let photo;
    let video;
    if(type === "Photo"){
      photo = await photoGallaryRepo.findOne({ where: { id: photo_id } });

      if (!photo) {
        return callback("Photo not found", null);
      }
    }
    if(type === "Video"){
      video = await videoGallaryRepo.findOne({ where: { id: photo_id } });

      if (!video) {
        return callback("Video not found", null);
      }
    }
  
  
    let commentPhoto;
    let likesCount;

    if(type === "Photo"){
      commentPhoto =photoCommentRepo.create({
        photo: photo,
        user: loggedInUser,
        comment: comment,
        created_at: new Date()
      });

      await photoCommentRepo.save(commentPhoto);
      likesCount = await photoLikesRepo.count({
          where: {photo:{id: photo_id} }
      })
    }else if(type === "Video"){
      commentPhoto = videoCommentRepo.create({
        video: video,
        user: loggedInUser,
        comment: comment,
        created_at: new Date()
      });

      await videoCommentRepo.save(commentPhoto);
      likesCount = await videoLikesRepo.count({
          where: {video:{id: photo_id} }
      })
    }

    const notificationType = type === "Photo" ? NotificationType.COMMENT_PHOTO : NotificationType.COMMENT_VIDEO
    if( from_user_id !== to_user_id){
    const matchNotification = {
        title: `${loggedInUser.name}, ${loggedInUser.age} `,
        body: `Commented on your ${type === "Photo" ? 'Photo' : 'Video'}.`,
        additionalData: {
          type: notificationType,
          sender: sender_details(loggedInUser),
          photo: photo,
          video: video,
          likesCount: likesCount,
          commentMessage: comment
        },
      };
  
      const title = "New comment";
        const body = `${loggedInUser.name},${loggedInUser.age} comment your ${type === "Photo" ? 'Photo' : 'Video'}.`;
        
        const media_type = type;
        const photoId = type === "Photo" ? photo_id : null;
        const videoId = type === "Video" ? photo_id : null;

        await saveNotificationHistory(
          from_user_id,
          to_user_id,
          title,
          body,
          media_type,
          notificationType,
          photoId,
          videoId,
          commentPhoto?.id,
          comment,
          null
        );

      await getUserDeviceTokens(to_user_id, async (error, tokens) => {
        if (error) {
          return callback(error, null);
        }
  
        await sendPushNotificationByTokens(matchNotification, tokens);
      });

      io.to(`personal_data_${to_user_id}`).emit(`new_notification_arrived`,{
            is_new_notification: true
        })
    }
    return callback(null, commentPhoto);
  } catch (error) {
    console.log("errrrr.",error)
    if (error instanceof Error) {
      return callback(error.message, null);
    }
  }
};

export const photoVideoComment = async(
  id: number,
  type: string,
  callback:(error:any, result: any) => void
)=>{
  try {
    const photoGallaryRepo = AppDataSource.getRepository(PhotosGallary)
    const videoGallaryRepo = AppDataSource.getRepository(VideosGallary)
    const mediaRepo = type === "Photo" ? photoGallaryRepo : videoGallaryRepo
    const photoCommentRepo = AppDataSource.getRepository(PhotoComment)
    const videoCommentRepo = AppDataSource.getRepository(VideoComment)

    const media = await mediaRepo.findOne({where:{id: id} })
    if(!media){
      return callback("Photo or Video not found.",null)
    }
    
    let commentMedia:any = [];
    
    if(type === "Photo"){
      commentMedia = await photoCommentRepo.find({
        where:{photo:{id: id} },
        relations:["photo","user"],
        order: {created_at: "DESC"}
      }) 

    }
    if(type === "Video"){
      commentMedia = await videoCommentRepo.find({
        where:{video:{id: id} },
        relations:["video","user"],
        order: {created_at: "DESC"}
      }) 
    }
    const modifyResponse = await Promise.all(
      commentMedia.map((data:any) => ({
        id: data.id,
        comment: data.comment,
        created_at: data.created_at,
        photo: data.photo ? {
          id: data.photo.id,
          url: data.photo.url,
          caption: data.photo.caption,
          created_at: data.photo.created_at
        } : {},
        video: data.video ? {
          id: data.video.id,
          url: data.video.url,
          caption: data.video.caption,
          created_at: data.video.created_at
        } : {},
        user:{
          id: data.user.id,
          name: data.user.name,
          profile_image: data.user.profile_image
        }
      }))
    )

    console.log(modifyResponse)
    return callback(null, modifyResponse)
  } catch (error) {
    console.log(error)
    if(error instanceof Error){
      return callback(error.message, null)
    }
  }
}

export const userPhotoLists = async (
  userId: number,
  page: number,
  limit: number,
  callback: (error:any, result:any) => void
) => {
  try {
    const photoLikeRepo = AppDataSource.getRepository(PhotoLike);
    const userRepo = AppDataSource.getRepository(Users);
    const photoCommentRepo = AppDataSource.getRepository(PhotoComment);

    const user = await userRepo.findOne({where:{id: userId}, 
      relations:['userInterests',"userInterests.subCategory","photos","videos"],
      order: {photos:{created_at: "DESC"} }
    })
    if(!user){
      return callback("User not found.",null)
    }

    const totalPhoto = user.photos.length;
    const startIndex = (page - 1) * limit;
    const paginatedPhotos = user.photos.slice(startIndex, startIndex + limit)

// For each photo, count the number of likes
        const photosWithLikes = await Promise.all(
            paginatedPhotos.map(async (photo) => {
                const likeCount = await photoLikeRepo.count({
                    where: {
                        photo: {id: photo.id}, user_like_photo: true
                    }
                });
                
                const loggedIn_user_like_photo = await photoLikeRepo.find({
                    where: {
                        photo: {id: photo.id},
                        user: {id: userId}
                    },
                    order: {photo:{created_at: "DESC"} }
                })
                
                const photoComment = await photoCommentRepo.find({
                    where : {
                        photo: {id: photo.id}
                    },
                    relations:["user"],
                })
                return {
                    ...photo,
                    user_like_photo: loggedIn_user_like_photo.length > 0 ? loggedIn_user_like_photo[0].user_like_photo : false,
                    likeCount: likeCount,
                    photo_comment: photoComment
                }
            })
        );
        const pagination = {
            total: totalPhoto,
            currentPage: page,
            totalPages: Math.ceil(totalPhoto / limit)
        }
        return callback(null, {photos: photosWithLikes, pagination})
        
  } catch (error) {
    if(error instanceof Error){
      return callback(error.message, null)
    }
  }
}


export const userVideoLists = async (
  userId: number,
  page: number,
  limit: number,
  callback: (error:any, result:any) => void
) => {
  try {
    const videoLikeRepo = AppDataSource.getRepository(VideoLikes);
    const userRepo = AppDataSource.getRepository(Users);
    const videoCommentRepo = AppDataSource.getRepository(VideoComment);

     const user = await userRepo.findOne({where:{id: userId}, 
      relations:['userInterests',"userInterests.subCategory","photos","videos"],
      order: {videos:{created_at: "DESC"} }
    })
    if(!user){
      return callback("User not found.",null)
    }

    const totalVideo = user.videos.length;
    const startIndex = (page - 1) * limit;
    const paginatedVideos = user.videos.slice(startIndex, startIndex + limit);

    const videoWithLikes = await Promise.all(
            paginatedVideos.map(async (video) => {
                const videLikeCount = await videoLikeRepo.count({
                    where: {
                        video: {id: video.id}, user_like_video: true
                    }
                });
                
                const loggedIn_user_like_video = await videoLikeRepo.find({
                    where: {
                        video: {id: video.id},
                        user: {id: userId}
                    }
                })
                
                const videoComment = await videoCommentRepo.find({
                    where : {
                        video: {id: video.id}
                    },
                    relations:['user']
                })
                return {
                    ...video,
                    user_like_video: loggedIn_user_like_video.length > 0 ? loggedIn_user_like_video[0].user_like_video : false,
                    video_likes_count: videLikeCount,
                    video_comment: videoComment
                }
            })
        );
        const pagination = {
            total: totalVideo,
            currentPage: page,
            totalPages: Math.ceil(totalVideo / limit)
        }
        return callback(null, {videos: videoWithLikes, pagination})
  } catch (error) {
    if(error instanceof Error){
      return callback(error.message, null)
    }
  }
}