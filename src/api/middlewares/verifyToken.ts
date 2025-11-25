import { Request, Response, NextFunction } from "express";
import { decode } from '../lib/jwt'
import { unauthorizedResponse, notFoundResponse, unauthorized } from '../helpers/apiResponse'
import { Constants } from '../config/constants'
const verifyToken =async (
  req: Request,
  res: Response,
  next: NextFunction) => {
  
  const accessToken = req.headers.authorization;
  if (accessToken) {
    const token = accessToken.split(' ')[1];
    const { decoded, expired } = decode(token);
    if (decoded) {
      // @ts-ignore
      // req.body.user = decoded;
      req.user = decoded;
   
      if(req.user.userId == undefined){
            unauthorizedResponse(res,Constants.ERROR_MESSAGES.AUTHORIZATION_TOKEN_INVALID);
        }else{
          return next();
        }
    

    }
    if (expired) {
      unauthorizedResponse(res,Constants.ERROR_MESSAGES.AUTHORIZATION_TOKEN_EXPIRED);
    }
  }else{
    unauthorizedResponse(res,Constants.ERROR_MESSAGES.AUTHORIZATION_REQUIRED);
  }
}

export const adminProtector = async(
  req: Request,
  res: Response,
  next: NextFunction
)=>{
  const user = req.user;
  if(!user){
    return unauthorizedResponse(res, Constants.ERROR_MESSAGES.AUTHORIZATION_REQUIRED)
  }

  if(user.user_type !== "admin"){
    return unauthorized(res, Constants.ERROR_MESSAGES.AUTHORIZATION_NOT_ALLOWED)
  }
  next()
}
export default verifyToken;
