import {RtcTokenBuilder, RtcRole} from "agora-token"
import jwt from "jsonwebtoken";
import { env } from "../../infrastructure/env";

export const getOffset = (pageNo:number,limit:number): any =>{
    if(pageNo === 0){
        pageNo=1
    }
    let offsetVal: number = (pageNo - 1) * limit;
    return offsetVal;
}

export const generateId=(count:number):any =>{
    var digits = '0123456789';
    let num = '';
    for (let i = 0; i < count; i++) {
        num += digits[Math.floor(Math.random() * 10)];
    }
    return parseInt(num);
}


export const agoraToken = (
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    expirationTimeInSeconds: number = 3600
): string => {
    const currentTimeStamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs,
        privilegeExpiredTs
    )
}


export const generateAccessToken = (userId: number): string => {
    return jwt.sign({ userId }, env.JWT_SECRET || "", { expiresIn: "7d" });    // 7 days
};


export const generateRefreshToken = (userId: number): string => {
    return jwt.sign({ userId }, env.JWT_SECRET || "", { expiresIn: "180d" });  // 6 month
};
  