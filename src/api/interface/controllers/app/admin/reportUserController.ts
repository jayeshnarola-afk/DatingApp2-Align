import { Request, Response } from "express";
import { ErrorResponse, successCreated } from "../../../../helpers/apiResponse";
import { addReportUser } from "../../../../domain/models/report.user.model";

export const reportUser = async (req: Request, res: Response) => {
    const reporter_id = req.user.userId;
    const reqBody = req.body;
    try {
        addReportUser(reporter_id, reqBody,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successCreated(res,result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}