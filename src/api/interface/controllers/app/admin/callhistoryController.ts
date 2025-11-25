import { Request, Response } from "express";
import { ErrorResponse, successCreated, successResponse } from "../../../../helpers/apiResponse";
import { clearUserNotification, getNotificationHistory } from "../../../../domain/models/call.history.model";

export const getNotification = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    try {
        getNotificationHistory(userId,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Call history lists.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const clearNotification = async (req: Request, res: Response) =>{
    const userId = req.user.userId;
    try {
        clearUserNotification(userId,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res,error)
            }
            return successCreated(res, result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}