import dotenv from 'dotenv'
dotenv.config()
/** export env constant */
export const env = {
    JWT_SECRET: process.env.JWT_SECRET,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    TOKEN_HEADER_KEY: process.env.TOKEN_HEADER_KEY,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,
    APPPORT: process.env.PORT,
    JWT_TIMEOUT_DURATION: process.env.JWT_TIMEOUT_DURATION,
    LOG_LEVEL:process.env.LOG_LEVEL,
    HOST:process.env.HOST,
    NODE_ENV:process.env.NODE_ENV,
    FCM_SERVER_KEY:process.env.FCM_SERVER_KEY,
    SITE_TITLE:process.env.SITE_TITLE,
    FIREBASE_CREDENTIALS: process.env.FIREBASE_CREDENTIALS,
    FIREBASE_CREDENTIALS_IMAGE_UPLOAD: process.env.FIREBASE_CREDENTIALS_IMAGE_UPLOAD,


    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    APP_ID: process.env.APP_ID,
    APP_CERTIFICATE: process.env.APP_CERTIFICATE,

    GOOGLE_MAP_KEY: process.env.GOOGLE_MAP_KEY
}