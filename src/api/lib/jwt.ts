import jwt from "jsonwebtoken";
import { env } from '../../infrastructure/env'
import crypto from 'crypto'
const privateKey = env.JWT_SECRET as string;


  /**
     * jwt signin
     * @param {string} value
    */
export function sign(object: Object, options?: jwt.SignOptions | undefined) {
    const jwtData = {
      expiresIn: env.JWT_TIMEOUT_DURATION,
    };
    return jwt.sign(object, privateKey, jwtData);
}


  /**
     * jwt decode
     * @param {string} value
    */
export function decode(token: string) {
    try {
      const decoded = jwt.verify(token, privateKey);
  
      return { valid: true, expired: false, decoded };
    } catch (error) {
      return {
        valid: false,
        expired: error,
        decoded: null,
      };
    }
  }

  /**
     * generate random unique string
     * @param {string} value
    */
   export function randomValueHex(len: number) {
      return crypto.randomBytes(Math.ceil(len/2))
      .toString('hex')
      .slice(0,len).toUpperCase();
}