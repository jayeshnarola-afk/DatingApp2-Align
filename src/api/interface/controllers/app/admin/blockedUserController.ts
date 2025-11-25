import { Request, Response } from "express";
import { ErrorResponse, successCreated, successResponse } from "../../../../helpers/apiResponse";
import { addToBlockUser, blockUserLists, unMatchUserApi, userUnblock } from "../../../../domain/models/blocked.user.model";

export const blockedUser = async (req: Request, res: Response) => {
    const blocker_id = req.user.userId;
    const blocked_id = req.body.blocked_id;
    const conversation_id = req.body.conversation_id;

    try {
        addToBlockUser(blocker_id, blocked_id, conversation_id,(error:any, result:any) => {
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

export const blockedUsers = async (req: Request, res: Response) => {
    const blocker_id = req.user.userId;

    try {
        blockUserLists(blocker_id,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Blocked users lists.", result)
        })    
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const unBlock = async(req: Request, res: Response) =>{
    const blocker_id = req.user.userId;
    const blocked_id = Number(req.params.blocked_id);
    try {
        userUnblock(blocker_id, blocked_id,(error:any, result: any) => {
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

export const unMatchUser = async(req: Request, res: Response) => {
    const userId = req.user.userId;
    const un_match_user_id = req.body.user_id;
    const conversation_id = req.body.conversation_id;

    try {
        unMatchUserApi(userId, un_match_user_id, conversation_id,(error:any, result:any) => {
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