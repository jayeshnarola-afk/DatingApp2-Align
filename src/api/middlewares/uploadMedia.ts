
import multer from "multer";
import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";
import { env } from "../../infrastructure/env";
import {imageBucket as bucket} from "../helpers/firebaseConfig"
import { format } from "util";


const storage = multer.memoryStorage(); // Stores file in memory as Buffer.
const upload = multer({storage});

// Upload file to firebase storage
const uploadMultipleToFirebase = async (files: Express.Multer.File[], userId: string): Promise<string[]> => {
  const fileUrls: string[] = [];

  for (const file of files) {
    try {
      let folder = "others";
      if (file.mimetype.startsWith("image/") && file.mimetype !== "image/gif") folder = "images";
      else if (file.mimetype === "image/gif") folder = "gif";
      else if (file.mimetype.startsWith("video/")) folder = "videos";
      else if (file.mimetype.startsWith("audio/")) folder = "audio";
      else if (
        file.mimetype === "application/pdf" ||
        file.mimetype.startsWith("application/msword") ||
        file.mimetype.startsWith("application/vnd")
      ) folder = "documents";

      // Generate file path: `users/{userId}/{folder}/{timestamp-filename}`
      const fileName = `users/${userId}/${folder}/${Date.now()}-${file.originalname}`;
      const blob = bucket.file(fileName);

      // Create stream for uploading
      const blobStream = blob.createWriteStream({
        metadata: { contentType: file.mimetype },
      });

      await new Promise<void>((resolve, reject) => {
        blobStream.on("error", reject);
        blobStream.on("finish", async () => {
          // Make file publicly accessible
          await blob.makePublic()
            // Get Public URL
            const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
            fileUrls.push(publicUrl);
            resolve();
        });
        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  return fileUrls;
};

const generateThumbnails = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    
  } catch (error) {
    next(error)
  }
}
export {upload, uploadMultipleToFirebase}
// const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//     const imageExtensions = /\.(jpg|jpeg|png|svg)$/i;
//     // const videoExtensions = /\.(mp4|mov|avi|mkv|mp3)$/i;
//     // const documentExtensions = /\.(pdf|doc|docx|txt)$/i;
//     // const audioExtensions = /\.(mp3|weba|wav|ogg)$/i;  // Add support for audio files
//     // const audioMimeTypes = ['audio/mp3', 'audio/weba', 'audio/wav', 'audio/ogg']; // Allowed MIME types
//     if (file.originalname.match(imageExtensions)) {
//         if (file.size > 10 * 1024 * 1024) {
//             return cb(new Error('Image size exceeds 10 MB'));
//         }
//         return cb(null, true);
//     } 
//     // else if (file.originalname.match(videoExtensions)) {
//     //     if (file.size > 100 * 1024 * 1024) {
//     //         return cb(new Error('Video size exceeds 100 MB'));
//     //     }
//     //     return cb(null, true);
//     // } else if (file.originalname.match(documentExtensions)) {
//     //     if (file.size > 10 * 1024 * 1024) {
//     //         return cb(new Error('Document size exceeds 10 MB'));
//     //     }
//     //     return cb(null, true);
//     // } else if (file.originalname.match(audioExtensions) || audioMimeTypes.includes(file.mimetype)) {
//     //     if (file.size > 20 * 1024 * 1024) { // Example: Limit audio files to 20 MB
//     //         return cb(new Error('Audio size exceeds 20 MB'));
//     //     }
//     //     return cb(null, true);
//     // } 
//     else {
//         return cb(new Error('Unsupported file type. Only images, videos, and documents are allowed.'));
//     }
// };

// const upload = multer({
//     storage,
//     fileFilter,
// });

// export const uploadImagesFile = (req: Request, res: Response, next: NextFunction) => {
//     // 'files' is the name of the form field in the HTML (name="files")
//     console.log("req.body. images....",req.body.user)
//     const user = req.body.user;
//     const multipleFilesUpload = upload.array('files', 10); // Allow up to 10 files

//     // @ts-ignore
//     multipleFilesUpload(req, res, (err: any) => {
//         if (err instanceof multer.MulterError) {
//             // Handle Multer-specific errors
//             return res.status(400).json({ message: `Error: ${err.message}` });
//         } else if (err) {
//             // Handle custom errors (e.g., wrong file type)
//             return res.status(400).json({ message: `Error: ${err.message}` });
//         }

//         // Log the uploaded files
//         console.log('Uploaded files:', req.files);
//            req.body.user=user;
//         // If no error, proceed to the next middleware or route handler
//         next();
//     });
// };