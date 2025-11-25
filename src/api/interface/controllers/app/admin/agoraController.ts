import { Request, Response } from "express";
import { ErrorResponse, successResponse } from "../../../../helpers/apiResponse";
import { createAgoraToken, getAgoraAppIdLogic } from "../../../../domain/models/agora.model";


export const generateAgoraToken = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        console.log(userId)
        const callType = req.body.callType || "one-to-one"; // one-to-one || group
        const chatId = Number(req.params.chatId);

        createAgoraToken(userId, callType, chatId, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Token generated successfully.", result)
        })
    } catch (error) {
        if (error instanceof Error) {
            return ErrorResponse(res, error.message)
        }
    }
}

export const getAgoraAppId = async (req: Request, res: Response) => {
    try {
        getAgoraAppIdLogic((error, result) => {
            if (error) {
                res.status(error.status).json({
                    status: error?.status,
                    code: error?.code,
                    message: error?.message
                })
            }

            return successResponse(res, "Token genrate successfully.", result)
        })
    } catch (error) {
        if (error instanceof Error) {
            return ErrorResponse(res, error.message)
        }
    }
}