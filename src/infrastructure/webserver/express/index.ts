import { env } from '../../env'
import express from 'express'
import bodyParser from 'body-parser'
import { createRouter } from './v1/routes'
import { logger, loggerFile } from '../../../api/lib/logger'
import { createServer as createHttpServer } from 'http' // Import HTTP module
import { Server } from 'socket.io' // Import Socket.IO
import { handleSocketEvents } from '../socket/socket.io'
import { cronjob } from '../../../api/cron/jobs'
import path from 'path'

let io: Server | any = null;

// export the socket.IO instance
export const getIo = () => {
    if(!io){
        throw new Error("Socket.IO not initialized!")
    }
    return io;
}

export const createServer = (): void => {
    const app = express();
    const port = env.APPPORT;
    const host = env.HOST;

    /* To handle invalid JSON data request */
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    /** CORS headers */

    // @ts-ignore
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Credentials", 'true');
        res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.header("Access-Control-Allow-Headers", "x-requested-with");
        res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });

    /** Create HTTP server */
    const server = createHttpServer(app);

    /** Initialize Socket.IO */
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    app.get("/",(req,res) => {
        res.send(`<h1 style="color: green;">Server Running</h1>`)
    })

    app.get("/delete-account-flow",(req, res) => {
        res.sendFile(path.resolve(process.cwd(),"src/api/privacyPolicy/deleteaccount.html"))
    })

    /** API Routes */
    app.use("/api", createRouter());

    cronjob()
    handleSocketEvents(io)
    /** Listen on Port */
    server.listen(port, () => {
        logger.info(`Server running on http://${host}:${port}`);
    });
};
