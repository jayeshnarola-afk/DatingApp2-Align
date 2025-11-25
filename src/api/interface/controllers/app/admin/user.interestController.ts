import { Request, Response } from "express";
import { ErrorResponse, successResponse } from "../../../../helpers/apiResponse";
import { addInterest, addUserInterest, interestList } from "../../../../domain/models/user.interest";
import { AppDataSource } from "../../../../config/db";
import { Users } from "../../../../domain/entities/users.enities";

export const interest = async (req: Request, res: Response) => {
    const name = req.body.name;
    try {
        addInterest(name,(error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Added successfully.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const userInterest = async (req: Request, res: Response) => {
    const user_id = req.user.userId;
    console.log("user_id......",user_id)
    const {user_interest} = req.body
    
    try {
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOne({where: {id: user_id}})
        if(!user){
            return ErrorResponse(res, "User not found.")
        }

        const newInterests = await addUserInterest(user, user_interest)
            // formatted_user.userInterests = newInterests
        if(newInterests){
            return successResponse(res, "Added successfully.", newInterests)
        }
        
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const interst = async (req: Request, res: Response) => {
    
    try {
        interestList((error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res, "Added successfully.", result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}