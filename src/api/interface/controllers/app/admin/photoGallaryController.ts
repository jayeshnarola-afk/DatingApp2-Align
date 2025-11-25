import { Request, Response } from "express";
import { ErrorResponse, successResponse } from "../../../../helpers/apiResponse";
import { listsOfPhotosGallary, photoVideoComment, uploadPhotosGallary, userCommentPhoto, userLikesPhoto, userPhotoLists, userVideoLists } from "../../../../domain/models/photo.gallary.model";

export const uploadPhoto = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const reqbody = req.body;
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] })["files"];
  const thumbFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })["thubmnail_file"]?.[0];

    console.log(thumbFiles)
    try {
        uploadPhotosGallary(userId, reqbody,files,thumbFiles,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res,`${req.body.media_type} uploaded successfully.`, result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}


export const photogallary = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    
    try {
        listsOfPhotosGallary(userId,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Lists of photos gallary", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const likePhoto = async(req: Request, res: Response) => {
    const from_user_id = req.user.userId;
    const {photo_id, to_user_id, type, media_type} = req.body
    try {
        userLikesPhoto(photo_id, from_user_id,to_user_id,type,media_type,(error: any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, `${media_type === "Photo" ? "Photo" : "Video"} liked successfully.`,result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const commentPhoto = async(req: Request, res: Response) => {
    const from_user_id = req.user.userId;
    const {photo_id, comment, to_user_id} = req.body
    const type = req.body.media_type; /* Photo || Video */
    try {
        userCommentPhoto(photo_id,comment, from_user_id,to_user_id,type,(error: any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, `Comment added successfully on ${type === "Photo" ? "Photo" : "Video"}.`,result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const commentList = async(req: Request, res: Response) => {
    const id = Number(req.query.id);    // id of photo or video
    const type = String(req.query.type); // Photo || Video
    try {
        photoVideoComment(id,type,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Comment lists.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const photoList = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
        userPhotoLists(userId,page,limit,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Photo lists.",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}


export const videoList = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
        userVideoLists(userId,page, limit,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Video lists.",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}
