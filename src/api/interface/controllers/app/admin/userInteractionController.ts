import { Request, Response } from "express";
import { ErrorResponse, successCreated, successResponse } from "../../../../helpers/apiResponse";
import { createUserInteraction, deleteUsersInteraction, userMatchesList } from "../../../../domain/models/user.interaction.model";

export const userInteraction = async(req:Request, res: Response) => {
    try {
        const loggedInUserId = req.user.userId;
        const {target_user_id, interaction_type , notificationObj} = req.body;
        createUserInteraction(loggedInUserId,target_user_id,interaction_type,notificationObj,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res,error)
            }
            return successResponse(res,"Added successfully.",result);
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res,error.message)
        }
    }
}

export const deleteInteraction = async(req:Request, res: Response) => {
    try {
        deleteUsersInteraction((error:any, result:any) => {
            if(error){
                return ErrorResponse(res,error)
            }
            return successCreated(res, result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res,error.message)
        }
    }
}

export const matchList = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search?.toString() || "";
    try {
        userMatchesList(userId,page,limit,search,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Match list.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}