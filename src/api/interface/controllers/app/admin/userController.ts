import { Request, Response } from "express";
import { logger } from "../../../../lib/logger";
import { ErrorResponse, successCreated, successResponse, successResponseWithCount } from "../../../../helpers/apiResponse";
import { getOffset } from "../../../../helpers/utility";
import {
  CheckEmailExist,
  userSignIn,
  getDetailsOfCurrentUser,
  updateDetailsOfCurrentUser,
  uploadMediaOnFirebase,
  listsOfUsers,
  verifyOtpApi,
  createAccountApi,
  checkExistingUser,
  requestToChangeEmail,
  verifyToChangeEmail,
  deleteUserAccount,
  cafeLists,
  userNewRefreshToken,
  adminLoginApi,
  listsOfUsersForAdmin,
  listsReportedUsers,
  blockedUserByAdmin,
  blockedUserListByAdmin,
  updateUserStatus,
  takeActionOnContentLists,
  dashboardDataCount,
  notificationDataForAdmin,
  adsConfigLogic
} from "../../../../domain/models/user.model";
import date from "date-and-time";
import { userSignUpValidation, userSingInValidation } from "../../../validations/user.validation";
import { addReportedContent, reportedContentLists } from "../../../../domain/models/report.user.model";

export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  console.log("calling this..........")
  const reqBody = req.body;
  if(!reqBody.mobile){
    return ErrorResponse(res,"Mobile number is required.");
  }

  const query:any = {}
  if(req.body.mobile) query.mobile = reqBody.mobile;

  try {
    verifyOtpApi(query,reqBody,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error);
      }
      return successResponse(res,"Verify otp successfully.",result);
    })  
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res,error.message)
    }
  }
}

export const createAccount = async (req: Request, res: Response): Promise<any> => {
  try {
    const body = req.body;
    const files = req.files;
    const userId = req.user.userId;
    // Validate request body
    // await userSignUpValidation.validateAsync(body);

    // If validation passes, proceed with user signup
    createAccountApi(body,files,userId, (error: any, result: any) => {
      if (error) {
        console.log("Signup error:", error);
        return ErrorResponse(res, error);
      }
      return successResponse(res, "User signed up successfully.", result);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("Validation error:", error.message);
      return ErrorResponse(res, error.message);
    }
  }
};

export const Login = async(req: Request, res: Response): Promise<any> => {
  try {
    await userSingInValidation.validateAsync(req.body)
   
    userSignIn(req.body, async (err: any, data: any) => {
      if (err) {
        return ErrorResponse(res, err);
      } else {

        return successResponse(res, "Login Successfully", data);
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      logger.error(error);
      console.log("Validation error:", error.message);
      return ErrorResponse(res, error.message);
    }
  }
};

export const usersLists = async(req: Request, res: Response): Promise<any> => {
  try {
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;
    const queryParameter = req.query;
    const minAge = Number(req.query.minAge)
    const maxAge = Number(req.query.maxAge)
    const userId = req.user.userId

    listsOfUsers(userId,page, limit,queryParameter,minAge, maxAge,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Users Lists.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      logger.error(JSON.stringify(error));
      return ErrorResponse(res, error.message)
    }
  }
}


export const getUserDetails = async(req: Request, res:Response): Promise<any> => {
  const userId = Number(req.params.userId);
  const loggedInUserId = req.user.userId;

  try {
    getDetailsOfCurrentUser(userId,loggedInUserId,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res,error)
      }
      return successResponse(res,"Current user details.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      logger.error(JSON.stringify(error));
      return ErrorResponse(res, error.message)
    }
  }
}

export const updateUserDetails = async (req:Request, res:Response) :Promise<any> => {
  const {userId} = req.user;
  const body = req.body;

  try {
    updateDetailsOfCurrentUser(userId, body, req.files,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res,"Details update successfully.",result)
    })
  } catch (error) {
    if(error instanceof Error){
      console.log("+++++++error======>",error)
      logger.error(JSON.stringify(error))
      return ErrorResponse(res, error.message)
    }
  }
}


export const uploadMedia = async(req: Request, res: Response)=>{
  const files = req.files;
  const userId = "general" as string
  try {
    uploadMediaOnFirebase(files,userId,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Upload successfully.",result)
    })
  } catch (error) {
    if(error instanceof Error){
      logger.error(JSON.stringify(error))
      return ErrorResponse(res, error.message)
    }
  }
}

export const updateStatus = async(req: Request, res: Response) => {
  const reqBody = req.body;
  try {
    updateUserStatus(reqBody,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res,"Status changed successfully.",result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res,error)
    }
  }
}


export const blockUser = async(req: Request, res: Response) => {
      const blocker_id = req.user.userId;
      const blocked_id = parseInt(req.params.id);
     
      try {
        blockedUserByAdmin(blocker_id,blocked_id,(error:any, result:any) => {
              if(error){
                  return ErrorResponse(res, error)
              }
              return successCreated(res, result)
          })
      } catch (error) {
          if(error instanceof Error){
              return ErrorResponse(res,error.message)
          }
      }
}

export const isExistUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const {email, mobile} = req.body;
    if(!email && !mobile){
      return ErrorResponse(res,"Either email or phone must be provided.")
    }
    checkExistingUser(email,mobile,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res,error)
      }
      return successResponse(res,"Check user exist.",result)
    })
  } catch (error) {
    if (error instanceof Error) {
      return ErrorResponse(res, error.message);
    }
  }
}

export const changeEmail = async(req: Request, res: Response): Promise<any> => {
  const userId = req.user.userId;
  const email = req.body.email;
  try {
    requestToChangeEmail(userId, email,(error:any, result:any) => {
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
export const verifyEmail = async(req: Request, res: Response): Promise<any> => {
  const userId = req.user.userId;
  const email = req.body.email;
  const otp = req.body.otp;
  try {
    verifyToChangeEmail(userId,otp, email,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res,"Verify email successfully." ,result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }
  }
}

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  try {
    deleteUserAccount(userId,(error:any,result:any) => {
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

export const cafe = async(req: Request, res: Response) => {
  const userId = req.user.userId;
  const matchUserId = Number(req.query.match_user_id);
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;
    const searchText = String(req.query.search) || ""
  try {
    cafeLists(userId,matchUserId,page,limit,searchText,(error:any,is_over_range:boolean=false, result: any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      
      if(is_over_range){
        return successCreated(res, result)
      }
      return successResponse(res,"Cafe lists.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }
  }
}

export const newRefreshToken = (req: Request, res: Response) => {
  const userId = req.user.userId;
  try {
    userNewRefreshToken(userId,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Refresh tokens.",result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }
  }
}


export const adminLogin = async(req: Request, res: Response) => {
  try {
    const reqBody = req.body
    adminLoginApi(reqBody,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Admin login successfully.",result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }
  }
}

export const usersListsForAdmin = async(req: Request, res: Response): Promise<any> => {
  try {
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;
    const queryParameter = req.query;
    const minAge = Number(req.query.minAge)
    const maxAge = Number(req.query.maxAge)
    const userId = req.user.userId

    listsOfUsersForAdmin(userId,page, limit,queryParameter,minAge, maxAge,(error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Users Lists.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      logger.error(JSON.stringify(error));
      return ErrorResponse(res, error.message)
    }
  }
}

export const reportedUsers = async (req: Request, res: Response) => {
    try {
        listsReportedUsers((error:any, result:any) => {
            if(error){
                return ErrorResponse(res, error)
            }
            return successResponse(res,"Reported users lists.",result)
        })
    } catch (error) {
        if(error instanceof Error){
            return ErrorResponse(res, error.message)
        }
    }
}

export const blockUsersLists = async(req: Request, res: Response) => {
  try {
    blockedUserListByAdmin((error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Bloked users lists.",result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res,error.message)
    }
  }
}

export const reportOnContent = async (req: Request, res: Response) => {
  const reporterId = req.user.userId;
  const reqBody = req.body;
  try {
    addReportedContent(reporterId, reqBody,(error:any, result:any) => {
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


export const reportContents = async (req: Request, res: Response) => {
  const reqQuery = req.query;
  try {
    reportedContentLists(reqQuery,(error:any, result:any) => {
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

export const takeAction = async (req: Request, res: Response) => {
  const reqBody = req.body;
  try {
    takeActionOnContentLists(reqBody,(error:any, result:any) => {
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

export const dashboardData = async (req: Request, res: Response) => {
  try {
    dashboardDataCount((error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Dashboard data.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }
  }
}

export const notification = async (req: Request, res: Response) => {
  try {
    notificationDataForAdmin((error:any, result:any) => {
      if(error){
        return ErrorResponse(res, error)
      }
      return successResponse(res, "Notification data.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }
  }
}


export const adsConfig = async (req: Request, res: Response) => {
  try {
    const {device_type = "android"} = req.query; // ios | android 
    adsConfigLogic(String(device_type),(error:any, result:any) => {
        if(error){
            return ErrorResponse(res, error)
        }
        return successResponse(res, "Ads Config.", result)
    })
  } catch (error) {
    if(error instanceof Error){
      return ErrorResponse(res, error.message)
    }  
  }
}