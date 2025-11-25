import admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import { env } from "../../infrastructure/env";


const serviceAccount = JSON.parse(env.FIREBASE_CREDENTIALS as string)
const serviceAccountImageUpload = JSON.parse(env.FIREBASE_CREDENTIALS_IMAGE_UPLOAD as string)

// Initialize Firebase admin for push notification (default app)
const pushApp = admin.initializeApp(
    {
        credential: admin.credential.cert(serviceAccount)
    },
    "pushApp"
);

// Initialize Firebase Admin for Image Upload (custom app)
const uploadApp = admin.initializeApp(
    {
        credential: admin.credential.cert(serviceAccountImageUpload),
        storageBucket: env.FIREBASE_STORAGE_BUCKET
    },
    "uploadApp"
);

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: serviceAccountImageUpload.project_id,
    credentials: serviceAccountImageUpload
})
// Get a reference to the Firebase Storage bucket
const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET || "")

// export {bucket, admin}
export const pushAdmin = pushApp;
export const uploadAdmin = uploadApp
export const imageBucket = bucket;