// @ts-ignore
import express, { Request, Response } from "express";
import { verifyToken, validateRequest } from "../../middlewares";
import { adminLogin, adsConfig, blockUser, blockUsersLists, cafe, changeEmail, createAccount, dashboardData, deleteAccount, getUserDetails, isExistUser, Login, newRefreshToken, notification, reportContents, reportedUsers, reportOnContent, takeAction, updateStatus, updateUserDetails, uploadMedia, usersLists, usersListsForAdmin, verifyEmail, verifyOtp } from "../controllers/app/admin/userController";
import { upload } from "../../middlewares/uploadMedia";
import { acceptDating, cancelDating, createConversation, getChatConversationInfo, getConversations, getLocationMessagesOfChatId, getMessagesOfChatId, getOneConversation, handleMediaUpload, rescheduledDating, saveCafeLocation, sendMediaMessageApi } from "../controllers/app/admin/conversationController";
import { generateAgoraToken, getAgoraAppId } from "../controllers/app/admin/agoraController";
import { deleteInteraction, matchList, userInteraction } from "../controllers/app/admin/userInteractionController";
import { commentList, commentPhoto, likePhoto, photogallary, photoList, uploadPhoto, videoList } from "../controllers/app/admin/photoGallaryController";
import { interest, interst, userInterest } from "../controllers/app/admin/user.interestController";
import { blockedUser, blockedUsers, unBlock, unMatchUser } from "../controllers/app/admin/blockedUserController";
import { unMatchUsers } from "../../domain/entities/unmatched.user.entities";
import axios from "axios";
import { reportUser } from "../controllers/app/admin/reportUserController";
import { clearNotification, getNotification } from "../controllers/app/admin/callhistoryController";
import { adminProtector } from "../../middlewares/verifyToken";
import {
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  getBlogDetailHandler,
  listBlogsAdminHandler,
} from "../controllers/app/admin/blogController";
import {
  createAppContentHandler,
  updateAppContentHandler,
  deleteAppContentHandler,
  getAppContentDetailHandler,
  listAppContentsHandler,
} from "../controllers/app/admin/appContentController";
import path from "path";


const route = express.Router();
// pm2 start ts-node -- -P tsconfig.json index.ts
/** guide router function */
export const AdminRoute = (router: express.Router): void => {
  router.use("/v1", route);

  // +++++++++++++++++++++++++++++++++ Auth routes +++++++++++++++++++++++++++++++++++++
  route.post("/is-exist-user", isExistUser)
  route.post("/verify-otp", verifyOtp); // if new user then create new user else return existing user details
  route.post("/change/email", verifyToken, changeEmail);
  route.post("/verify/email", verifyToken, verifyEmail)
  route.post("/create-account", verifyToken, upload.array("files", 5), createAccount);
  route.post("/signin", Login);
  route.post("/upload-media", upload.array("files", 5), uploadMedia)

  // +++++++++++++++++++++++++++++++++ User routes +++++++++++++++++++++++++++++++++++++
  route.get("/get-user/:userId", verifyToken, getUserDetails)
  route.get("/users", verifyToken, usersLists)
  route.put("/update-user", verifyToken, upload.array("files", 5), updateUserDetails)

  // +++++++++++++++++++++++++++++++++ Chat routes +++++++++++++++++++++++++++++++++++++
  route.post("/chat/create-conversation", verifyToken, createConversation)
  route.get("/chat/conversations", verifyToken, getConversations)
  route.get("/chat/conversation/:conversation_id", verifyToken, getOneConversation)
  route.get("/chat/messages/:conversation_id", verifyToken, getMessagesOfChatId)
  route.get("/chat/location/messages/:conversation_id", verifyToken, getLocationMessagesOfChatId)

  route.post("/chat/message/send-message", verifyToken, upload.array("files", 5), sendMediaMessageApi)
  route.post("/chat/message/location", verifyToken, saveCafeLocation)

  route.post("/chat/accept/dating", verifyToken, acceptDating)
  route.post("/chat/cancel/dating", verifyToken, cancelDating)
  route.post("/chat/rescheduled/dating", verifyToken, rescheduledDating);

  route.get("/chat/get-conversation-info/:conversation_id", verifyToken, getChatConversationInfo)
  route.post("/chat/uploadMeida", verifyToken, handleMediaUpload)

  // +++++++++++++++++++++++++++++++++ user_interaction routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/user/interaction", verifyToken, userInteraction)
  route.delete("/delete/interaction", deleteInteraction)

  // ++++++++++++++++++++++++++ Notification routes ++++++++++++++++++++++++++++++++++
  route.get("/notification", verifyToken, getNotification)
  route.delete("/clear-notification", verifyToken, clearNotification)
  // +++++++++++++++++++++++++++++++++ agora routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/generate-agora-token/:chatId", verifyToken, generateAgoraToken)
  route.get("/get-app_id", getAgoraAppId);
  // +++++++++++++++++++++++++++++++++ matches routes +++++++++++++++++++++++++++++++++++++ 
  route.get("/matches", verifyToken, matchList);

  // +++++++++++++++++++++++++++++++++ Photo gallary routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/gallary/upload", verifyToken, upload.fields([
    { name: "files", maxCount: 5 },
    { name: "thubmnail_file", maxCount: 1 }
  ]), uploadPhoto)
  route.get("/photo-gallary", verifyToken, photogallary)
  route.post("/photo/like", verifyToken, likePhoto)
  route.post("/photo/comment", verifyToken, commentPhoto)
  route.get("/comment", verifyToken, commentList)
  route.get("/photo-gallary/photolist", verifyToken, photoList)
  route.get("/photo-gallary/videolist", verifyToken, videoList)

  // +++++++++++++++++++++++++++++++++ Interest routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/interest", interest)  // Add common interest
  route.get("/interest/list", interst) //interest lists
  route.post("/user/interest", verifyToken, userInterest)  // user add interest

  // +++++++++++++++++++++++++++++++++ Blocked user routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/block/blocked-user", verifyToken, blockedUser);
  route.get("/block/blocked-users", verifyToken, blockedUsers)
  route.delete("/block/unblock-user/:blocked_id", verifyToken, unBlock)
  // ++++++++++++++++++++++++++ Report Users routes ++++++++++++++++++++++++++++++++++
  route.post("/report/report-user", verifyToken, reportUser)
  // +++++++++++++++++++++++++++++++++ unmatch routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/un_match/user", verifyToken, unMatchUser)

  // ++++++++++++++++++++++++++ Delete Account routes ++++++++++++++++++++++++++++++++++
  route.post("/delete-account", verifyToken, deleteAccount);

  // +++++++++++++++++++++++++++++++++ Cafe api routes +++++++++++++++++++++++++++++++++++++ 
  route.get("/cafe", verifyToken, cafe)

  route.get("/refresh-token", verifyToken, newRefreshToken)

  // +++++++++++++++++++++++++++++++++ Admin api routes +++++++++++++++++++++++++++++++++++++ 
  route.post("/admin/login", adminLogin)
  route.get("/admin/users", verifyToken, adminProtector, usersListsForAdmin)
  route.put("/admin/update-status", verifyToken, adminProtector, updateStatus);

  // Reported users
  route.get("/admin/report/reported-users", verifyToken, adminProtector, reportedUsers)

  // reported content
  route.post("/admin/report/content", verifyToken, reportOnContent);
  route.get("/admin/report/content", verifyToken, adminProtector, reportContents)
  route.put("/admin/report/content/take-action", verifyToken, adminProtector, takeAction);

  // block user
  route.put("/admin/users/block/:id", verifyToken, adminProtector, blockUser);
  route.get("/admin/block/users", verifyToken, adminProtector, blockUsersLists)

  route.get("/admin/dashboard", verifyToken, adminProtector, dashboardData);

  route.get("/admin/notification", verifyToken, adminProtector, notification);

  // Admin Blog Management
  route.post("/admin/blogs", verifyToken, adminProtector, upload.array("image", 1), createBlogHandler);
  route.put("/admin/blogs/:id", verifyToken, adminProtector, upload.array("image", 1), updateBlogHandler);
  route.delete("/admin/blogs/:id", verifyToken, adminProtector, deleteBlogHandler);
  route.get("/admin/blogs", listBlogsAdminHandler);
  route.get("/admin/blogs/:id", verifyToken, adminProtector, getBlogDetailHandler);

  // Admin App Content Management
  route.post("/admin/app-content", verifyToken, adminProtector, createAppContentHandler);
  route.put("/admin/app-content/:id", verifyToken, adminProtector, updateAppContentHandler);
  route.delete("/admin/app-content/:id", verifyToken, adminProtector, deleteAppContentHandler);
  route.get("/admin/app-content", listAppContentsHandler);
  route.get("/admin/app-content/:id", verifyToken, adminProtector, getAppContentDetailHandler);

  route.get("/ads-config", adsConfig);


};
