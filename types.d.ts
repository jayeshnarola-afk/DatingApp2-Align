import { Request } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: any; // or you can type it specifically, e.g., `user?: User`
        }
    }
}