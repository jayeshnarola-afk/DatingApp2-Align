import express, { Request, Response } from "express"
import { AdminRoute } from "../../../../api/interface/routes/app.routes";
/** crate global router */
export const createRouter = (): express.Router =>{
    const router = express.Router();
    AdminRoute(router);
    return router;
}
