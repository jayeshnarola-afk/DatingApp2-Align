import { Users, UserStatus } from "../entities/users.enities";

import { AppDataSource } from "../../config/db";
import { sign } from "../../lib/jwt";
import { logger } from "../../lib/logger";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { env } from "../../../infrastructure/env";
import { saveFcmToken } from "./device.token.model";
import { uploadMultipleToFirebase } from "../../middlewares/uploadMedia";
import { Brackets, In, Not } from "typeorm";
import { formateInterestSubCategory, formatUserResponse } from "../responseDto/userResponseDto";
import { UserInteraction } from "../entities/user.interactions.entities";
import { UserInterest } from "../entities/user.interest";
import { PhotoLike } from "../entities/photo.likes.entities";
import { PhotosGallary } from "../entities/photo_gallary.entities";
import { PhotoComment } from "../entities/photo.comment.entities";
import { VideoLikes } from "../entities/video.likes.entities";
import { VideoComment } from "../entities/video.comment.entities";
import { endOfDay, startOfDay, subHours } from "date-fns"
import { addUserInterest } from "./user.interest";
import { Interest } from "../entities/interest.entities";
import { DeviceTable } from "../entities/device.token.entities";
import axios from "axios";
import { generateAccessToken, generateRefreshToken } from "../../helpers/utility";
import { Admins } from "../entities/admin.entities";
import { ReportedUser } from "../entities/reported.user.entities";
import { BlockedUser } from "../entities/blocked.user.entities";
import { getIo } from "../../../infrastructure/webserver/express";
import { of } from "fp-ts/lib/ReaderT";
import { ContentType } from "../entities/reported.content.entities";
import { VideosGallary } from "../entities/video_gallary.entities";
import { Message } from "../entities/message.entity";
import { NotificationType } from "../../enum";
import { saveNotificationHistory } from "./notification.history.model";
import { NotificationHistory } from "../entities/notification.history.entities";
const geolib = require("geolib");

export async function CheckEmailExist(where: object, userId: number, callback: any) {
    const userRepository = AppDataSource.getRepository(Users);
    // console.log("where: ", where);
    const user = await userRepository.findOneBy(where);
    //console.log("Single  user: ", user);

    if (!user) {
        callback("", user);
    } else {
        var userD = JSON.parse(JSON.stringify(user));
        console.log(userId, '==', userD.id);
        if (userId == userD.id) {
            callback("", user);
        } else {
            callback("Email is Already Exist!", "");
        }
    }
}

export const verifyOtpApi = async (
    query: any,
    reqBody: any,
    callback: (error: any, result: any) => void
) => {

    try {

        const userRepository = AppDataSource.getRepository(Users);
        const user = await userRepository.findOne({ where: query, relations: ["userInterests", "userInterests.subCategory"] },);
        console.log("user......", user)
        if (!user) {
            return handleNewUser(reqBody, callback)
        } else if (!user.is_profile_completed) {
            // const token = jwt.sign({ userId: user.id}, env.JWT_SECRET || "secret",{expiresIn: "7d"});
            const access_token = generateAccessToken(user.id);
            const refresh_token = generateRefreshToken(user.id);

            const formated_user = formatUserResponse(user);
            return callback(null, { token: access_token, refresh_token, ...formated_user })
        } else {

            return handleExistingUser(user, reqBody, callback)
        }
    } catch (error) {
        console.log("error.....", error)
        return callback(error, null)
    }
}

async function handleExistingUser(user: any, reqbody: any, callback: (error: any, result: any) => void) {
    try {
        const userRepository = AppDataSource.getRepository(Users);
        const { mobile, deviceType, fcmToken, otp, email, provider, provider_id, password, country_code, } = reqbody;
        if (provider && provider_id) {
            user.facebook_provider_id = provider === "facebook" ? provider_id : null;

        } else {
            // user manually login   
        }

        if (otp) {
            if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
                return callback("Otp has expired.", null)
            }

            if (user.otp !== otp) {
                return callback("Invalid otp", null)
            }

            user.otp = "0000";
            user.password = await bcrypt.hash(password, 10);

        }
        user.is_verified = true;
        user.country_code = country_code ?? null
        const formatedInterestSubCategory = user.userInterests.map((data: any) => formateInterestSubCategory(data.subCategory))

        await userRepository.save(user);

        if (fcmToken && deviceType) {
            await saveFcmToken(user.id, deviceType, fcmToken);
        }

        //@ts-ignore
        delete user.password
        // const token = jwt.sign({ userId: user.id}, env.JWT_SECRET || "secret",{expiresIn: "7d"});
        const access_token = generateAccessToken(user.id);
        const refresh_token = generateRefreshToken(user.id);
        const formated_user = formatUserResponse(user);
        return callback(null, { token: access_token, refresh_token, ...formated_user, userInterests: formatedInterestSubCategory ?? [] })
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.name, null)
        }
    }
}

async function handleNewUser(
    reqbody: any,
    callback: (error: any, result: any) => void
) {
    try {
        const { mobile, looking_for, otp, email, provider, provider_id, password, country_iso_code, country_code, deviceType, fcmToken } = reqbody;
        let newUser;

        const userRepository = AppDataSource.getRepository(Users);

        if (provider && provider_id) {
            console.log("provider * provider_id")
            newUser = userRepository.create({
                // password: await bcrypt.hash(password, 10) ?? null,
                mobile: mobile ?? null,
                email: email ?? null,
                facebook_provider_id: provider === "facebook" ? provider_id : null,
                country_code,
                country_iso_code
            })
        } else if (mobile) {
            newUser = userRepository.create({
                mobile,
                is_mobile_verified: true,
                country_code,
                country_iso_code,
                looking_for: looking_for ?? null
            })
        } else {
            return callback("User not found.", null)
        }

        await userRepository.save(newUser);
        if (fcmToken && deviceType) {
            await saveFcmToken(newUser.id, deviceType, fcmToken);
        }
        // @ts-ignore
        delete newUser.password
        // const token = jwt.sign({ userId: newUser.id}, env.JWT_SECRET || "secret",{expiresIn: "7d"});
        const access_token = generateAccessToken(newUser.id);
        const refresh_token = generateRefreshToken(newUser.id);

        const formated_user = await formatUserResponse(newUser)
        return callback(null, { token: access_token, refresh_token, ...formated_user })
    } catch (error) {
        if (error instanceof Error) {
            console.log(error)
            return callback(error.name, null)
        }
    }
}

export async function createAccountApi(
    data: any,
    files: any,
    userId: number,
    callback: (error: any, result: any) => void
) {
    try {
        const {
            email,
            password,
            user_interest,
            mobile,
            bio,
            provider_id,
            provider,
            country_code,
            latitude,
            longitude,
            name,
            gender,
            date_of_birth,
            job,
            place_id,
            looking_for,
            about_me,
            address
        } = data;

        const userRepository = AppDataSource.getRepository(Users);
        const existingUser = await userRepository.findOne({
            where: { id: userId },
            relations: ['userInterests', 'userInterests.subCategory']
        });

        if (!existingUser) {
            return callback("User not found. Please signup first.", null);
        }

        // ✅ If user_interest exists, add it first


        // ✅ Upload files if present
        if (files) {
            const reqFiles = files as Express.Multer.File[];
            const fileUrls = await uploadMultipleToFirebase(reqFiles, String(existingUser.id));
            existingUser.profile_image = fileUrls[0];
        }

        // ✅ Update user profile
        existingUser.latitude = latitude ? parseFloat(latitude) : null;
        existingUser.longitude = longitude ? parseFloat(longitude) : null;
        existingUser.name = name;

        if (date_of_birth) {
            try {
                const age = await calculateAge(date_of_birth); // e.g., "20-01-1998"
                const [day, month, year] = date_of_birth.split("-").map(Number);
                const dob = new Date(year, month - 1, day);
                existingUser.date_of_birth = dob;
                existingUser.age = age;
            } catch (err: any) {
                return callback(err.message, null);
            }
        }

        existingUser.gender = gender ?? null;
        existingUser.job = job;
        existingUser.address = address;
        existingUser.about_me = about_me ?? null;
        existingUser.looking_for = looking_for ?? null;
        existingUser.is_profile_completed = true;
        existingUser.place_id = place_id === "" ? null : place_id;

        if (user_interest) {
            const newInterests = await addUserInterest(existingUser, JSON.parse(user_interest))
            existingUser.userInterests = newInterests
        }

        await userRepository.save(existingUser);

        // ✅ Generate token
        // const token = jwt.sign(
        //     { userId: existingUser.id },
        //     env.JWT_SECRET || "secret",
        //     { expiresIn: "7d" }
        // );
        const access_token = generateAccessToken(existingUser.id);
        const refresh_token = generateRefreshToken(existingUser.id);

        // @ts-ignore
        delete existingUser.password;
        const formatted_user = formatUserResponse(existingUser);
        const formatedInterestSubCategory = formatted_user.userInterests.map((data: any) => formateInterestSubCategory(data.subCategory))

        const title = "New Registration";
        const body = `${name} has successfully registered.`;
        const notificationType = NotificationType.NEW_REGISTRATION
        await saveNotificationHistory(
            userId,
            userId,
            title,
            body,
            null,
            notificationType,
            null,
            null,
            null,
            null,
            null
        )
        return callback(null, { token: access_token, refresh_token, ...formatted_user, userInterests: formatedInterestSubCategory });

    } catch (error) {
        console.error("createAccountApi error:", error);
        logger.error(JSON.stringify(error));
        return callback(error instanceof Error ? error.message : "Something went wrong.", null);
    }
}




export async function userSignIn(
    reqBody: any,
    callback: (error: any, result: any) => void
) {
    try {


        const { mobile, email, password, provider, provider_id, fcm_token, device_type } = reqBody
        const userRepository = AppDataSource.getRepository(Users);
        let user: Users | null = null;

        if (provider && provider_id) {
            let whereCondition = {}
            if (provider === "google") whereCondition = { google_provider_id: provider_id }
            if (provider === "facebook") whereCondition = { facebook_provider_id: provider_id }
            if (provider === "apple") whereCondition = { apple_provider_id: provider_id }

            user = await userRepository.findOne({ where: whereCondition })
            if (!user) {
                return callback("User not found. Please signup first.", null);
            }
        } else if (email && password) {
            // Find the user by email or username
            user = await userRepository.findOne({
                where: { email }
            });

            if (!user) {
                return callback("User not found", null)
            }


        } else {
            return callback("Please provide valid login credentials.", null)
        }

        // Generate JWT token
        // const token = jwt.sign({ userId: user.id}, env.JWT_SECRET || "secret",{expiresIn: "7d"});
        const access_token = generateAccessToken(user.id);
        const refresh_token = generateRefreshToken(user.id);

        // store FCM token if provided
        if (reqBody.fcm_token && reqBody.device_type) {
            await saveFcmToken(user.id, reqBody.device_type, reqBody.fcm_token);
        }
        // @ts-ignore
        delete user.password
        const response = {
            token: access_token,
            refresh_token,
            user
        }
        return callback(null, response)
    } catch (error) {
        if (error instanceof Error) {
            logger.error(JSON.stringify(error))
            return callback(error.message, null);
        }
    }
}

// export async function listsOfUsers(
//     userId: number,
//     page: number,
//     limit: number,
//     queryParameter:any,
//     minAge:number,
//     maxAge:number,
//     callback:(error:any, result:any) => void
// ){
//     try {
//         console.log("min & max..",minAge , maxAge)
//         const {gender, orientation, latitude, longitude, maxDistance=250, city, search} = queryParameter;

//         const userRepository = AppDataSource.getRepository(Users);
//         const skip = (page - 1) * limit;

//         // Fetch the logged-in user's miles value
//         const loggedInUser = await userRepository.findOne({where:{id: userId}})


//         let query = userRepository.createQueryBuilder("user").where("user.id != :userId",{userId});

//         // Apply gender filter
//         if(gender && gender !== 'all'){
//             query.andWhere("user.gender = :gender", {gender})
//         }

//         // Apply age filter
//         if((!isNaN(minAge) && minAge > 0) && (!isNaN(maxAge) && maxAge > 0)){
//             const {maxBirthDate,minBirthDate} = await findUsersByAgeRange(minAge, maxAge)
//             query.andWhere("user.date_of_birth BETWEEN :minBirthDate AND :maxBirthDate",{minBirthDate, maxBirthDate})
//         }

//         // Exclude users who already have interaction(either like or dislike)
//         query.andWhere(qb => {
//             const subQuery = qb.subQuery()
//                 .select("1")
//                 .from(UserInteraction,"interaction")
//                 .where(
//                     "(interaction.user_id = :userId AND interaction.target_user_id = user.id) OR" + 
//                     "(interaction.user_id = user.id AND interaction.target_user_id = :userId)"
//                 )
//                 .getQuery()
//                 return "NOT EXISTS " + subQuery
//         },{userId})
//         // Apply search filter (case-insensitive search on username and name)
//         if(search){
//             query.andWhere(
//                 `(user.username ILIKE :search OR user.name ILIKE :search)`,
//                 {search: `%${search}%`}
//             )
//         }

//         const [users, total] = await query
//     .skip(skip)
//     .take(limit)
//     .select([
//         "user.id",
//         "user.name",
//         "user.age",
//         "user.address",
//         "user.job",
//         "user.gender",
//         "user.profile_image",
//         "user.latitude",
//         "user.longitude",

//     ])
//     .getManyAndCount();


//         const pagination = {
//             totalUsers: total,
//             currentPage: page,
//             totalPages: Math.ceil(total / limit),
//         }
//         return callback(null, {users,pagination})
//     } catch (error) {
//         if(error instanceof Error){
//             logger.error(JSON.stringify(error))
//             return callback(error.message,null);
//         }
//     }
// }

export async function listsOfUsers(
    userId: number,
    page: number,
    limit: number,
    queryParameter: any,
    minAge: number,
    maxAge: number,
    filterInterestIds: number[],
    callback: (error: any, result: any) => void
) {
    try {
        const { gender, search, looking_for, distance, location } = queryParameter;

        // console.log("filter parameter=====>",
        //     "minage => ", minAge,
        //     "maxAge => ", maxAge,
        //     "gender => ", gender,
        //     "search => ", search,
        //     "looking_for =>", looking_for,
        //     "distance =>", distance,
        //     "location =>", location
        // )
        const userRepository = AppDataSource.getRepository(Users);
        const userInterestRepo = AppDataSource.getRepository(UserInterest);
        const skip = (page - 1) * limit;

        const currentUser = await userRepository.findOne({
            where: { id: userId },
            select: ["latitude", "longitude"]
        });

        if (!currentUser) {
            return callback("User not found====>", null)
        }
        const { latitude: userLat, longitude: userLng } = currentUser;

        // Get logged-in user's interest IDs
        const userInterests = await userInterestRepo.find({
            where: { user: { id: userId } },
            relations: ["subCategory"],
            // relations:['userInterests','userInterests.subCategory','userInterests.subCategory.category']

        });

        const loggedInUserInterestIds = userInterests.map((ui) => ui.subCategory.id);
        
        // Use filter interest IDs if provided, otherwise use logged-in user's interests
        const interestIds = filterInterestIds && filterInterestIds.length > 0 
            ? filterInterestIds 
            : loggedInUserInterestIds;

        // Pre-calculate age filter (outside builder)
        let ageCondition = "";
        let ageParams: any = {};
        //   if (!isNaN(minAge) && !isNaN(maxAge) && minAge > 0 && maxAge > 0) {
        //     const { maxBirthDate, minBirthDate } = await findUsersByAgeRange(minAge, maxAge);
        //     ageCondition = " AND user.date_of_birth BETWEEN :minBirthDate AND :maxBirthDate";
        //     ageParams = { minBirthDate, maxBirthDate };
        //   }



        // Factory for base query
        const buildBaseQuery = () => {
            const qb = userRepository
                .createQueryBuilder("user")
                .where("user.id != :userId", { userId })
                .andWhere("user.is_deleted = :is_deleted", { is_deleted: false })
                .andWhere("user.is_profile_completed = :is_profile_completed", { is_profile_completed: true });

            if (gender && gender !== "all") {
                qb.andWhere("user.gender = :gender", { gender });
            }

            if (!isNaN(minAge) && minAge > 0) {
                console.log("minAge......", minAge)
                qb.andWhere("user.age >= :minAge", { minAge })
            }

            if (!isNaN(maxAge) && maxAge > 0) {
                console.log("maxAge.......", maxAge)
                qb.andWhere("user.age <= :maxAge", { maxAge })
            }

            if (looking_for) {
                qb.andWhere("user.looking_for = :looking_for", { looking_for })
            }

            if (location) {
                qb.andWhere("user.address = :address", { address: location })
            }
            // if (ageCondition) {
            //   qb.andWhere(ageCondition, ageParams);
            // }

            if (distance && distance < 100 && userLat && userLng) {
                // 3958.8 returns miles
                // 6371 return kilometers
                qb.andWhere(
                    `
              (
                6371 * acos(
                  cos(radians(:userLat)) * cos(radians(user.latitude)) *
                  cos(radians(user.longitude) - radians(:userLng)) +
                  sin(radians(:userLat)) * sin(radians(user.latitude))
                )
              ) <= :distance
              `,
                    { userLat: userLat, userLng: userLng, distance: distance }
                );
            }
            const todayStart = subHours(new Date, 12)
            const todayEnd = endOfDay(new Date());
            qb.andWhere((qb1) => {
                const subQuery = qb1
                    .subQuery()
                    .select("1")
                    .from(UserInteraction, "interaction")
                    .where("interaction.user_id = :userId")
                    .andWhere("interaction.target_user_id = user.id")
                    .andWhere(new Brackets((qb2) => {
                        qb2.where("interaction.interaction_type = 'like'")
                            .orWhere("interaction.interaction_type = 'dislike' AND interaction.created_at >= :todayStart");
                    }))
                    .getQuery();

                return `NOT EXISTS ${subQuery}`;
            }, { userId, todayStart });

            qb.andWhere((qb1) => {
                const matchQuery = qb1
                    .subQuery()
                    .select("1")
                    .from(UserInteraction, "ui1")
                    .innerJoin(UserInteraction, "ui2", `
            ui2.user_id = user.id AND
            ui2.target_user_id = :userId AND
            ui2.interaction_type = 'like'
            `)
                    .where("ui1.user_id = :userId")
                    .andWhere("ui1.target_user_id = user.id")
                    .andWhere("ui1.interaction_type = 'like'")
                    .getQuery();

                return `NOT EXISTS ${matchQuery}`;
            }, { userId });

            if (search) {
                qb.andWhere(
                    "(user.name ILIKE :search OR user.email ILIKE :search OR user.mobile ILIKE :search OR user.address ILIKE :search OR user.job ILIKE :search)",
                    {
                        search: `%${search}%`,
                    }
                );
            }

            // Filter by interest IDs if provided
            if (filterInterestIds && filterInterestIds.length > 0) {
                qb.andWhere((qb1) => {
                    const subQuery = qb1
                        .subQuery()
                        .select("1")
                        .from(UserInterest, "ui_filter")
                        .where("ui_filter.user_id = user.id")
                        .andWhere("ui_filter.interest_id IN (:...filterInterestIds)", { filterInterestIds })
                        .getQuery();
                    return `EXISTS ${subQuery}`;
                });
            }

            return qb;
        };

        // 1. Users with shared interests
        let matchingUsers: Users[] = [];
        if (interestIds.length > 0) {
            const query = buildBaseQuery();
            query
                .innerJoin(UserInterest, "ui", "ui.user_id = user.id")
                .andWhere("ui.interest_id IN (:...interestIds)", { interestIds })
                //   .addSelect("COUNT(ui.interest_id)", "shared_interests_count")
                .groupBy("user.id")
            //   .orderBy("shared_interests_count", "DESC");

            matchingUsers = await query
                .select([
                    "user.id",
                    "user.name",
                    "user.age",
                    "user.address",
                    "user.job",
                    "user.gender",
                    "user.profile_image",
                    "user.latitude",
                    "user.longitude",
                    "user.about_me"
                ])
                .getMany();
        }

        // 2. Remaining users without shared interests
        const remainingQuery = buildBaseQuery();
        if (interestIds.length > 0) {
            remainingQuery
                .leftJoin(UserInterest, "ui", "ui.user_id = user.id AND ui.interest_id IN (:...interestIds)", {
                    interestIds,
                })
                .andWhere("ui.interest_id IS NULL");
        }

        const remainingUsers = await remainingQuery
            .select([
                "user.id",
                "user.name",
                "user.age",
                "user.address",
                "user.job",
                "user.gender",
                "user.profile_image",
                "user.latitude",
                "user.longitude",
                "user.about_me"
            ])
            .getMany();

        // Merge and paginate
        const mergedUsers = [...matchingUsers, ...remainingUsers];

        const userIds = mergedUsers.map(u => u.id);



        const interests = await userInterestRepo.find({
            where: { user: { id: In(userIds) } },
            relations: ["subCategory", "user"],
        });

        type UserInterestMap = {
            [key: number]: { id: number; name: string }[];
        };

        const userInterestMap = interests.reduce<UserInterestMap>((acc, interest) => {
            const userId = interest.user.id;
            if (!acc[userId]) {
                acc[userId] = [];
            }
            acc[userId].push({
                id: interest.subCategory.id,
                name: interest.subCategory.name,
            });
            return acc;
        }, {});
        console.log("userInterestMap: ", userInterestMap);


        /**
         * Get road distance using Google Maps Distance Matrix API Solution 1
        */
        /*
            async function getRoadDistance(userLat: number, userLng: number, targetLat: number, targetLng: number) {
                const apiKey = env.GOOGLE_MAP_KEY;
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLng}&destinations=${targetLat},${targetLng}&key=${apiKey}`;
                
                const response = await axios.get(url);
                const data = response.data;
                console.log("Distance Matrix API response ===>", JSON.stringify(data, null, 2));
                if (
                    data.rows &&
                    data.rows[0] &&
                    data.rows[0].elements &&
                    data.rows[0].elements[0] &&
                    data.rows[0].elements[0].status === "OK"
                ) {
                    return Math.round(data.rows[0].elements[0].distance.value / 1000); // km
                }
                return null;
            }
       
            const usersWithDistance = await Promise.all(
                mergedUsers.map(async (user) => ({
                    ...user,
                    interests: userInterestMap[user.id] || [],
                    distance: await getRoadDistance(
                    Number(userLat),
                    Number(userLng),
                    Number(user.latitude),
                    Number(user.longitude)
                    )
                }))
            );
        */

        function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) *
                Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // distance in km
        }



        // After mergedUsers:
        const usersWithDistance = mergedUsers.map(user => ({
            ...user,
            userInterests: userInterestMap[user.id] || [],
            distance: Math.round(
                calculateDistance(
                    Number(userLat),
                    Number(userLng),
                    Number(user.latitude),
                    Number(user.longitude)
                )
            ) // distance in km rounded
        }));


        const total = usersWithDistance.length;
        const paginatedUsers = usersWithDistance.slice(skip, skip + limit);

        const pagination = {
            totalUsers: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };

        return callback(null, { users: paginatedUsers, pagination });
    } catch (error) {
        if (error instanceof Error) {
            logger.error(JSON.stringify(error));
            return callback(error.message, null);
        }
    }
}

export async function listsOfUsersForAdmin(
    userId: number,
    page: number,
    limit: number,
    queryParameter: any,
    minAge: number,
    maxAge: number,
    callback: (error: any, result: any) => void
) {
    try {
        const { gender, search, looking_for, distance, location } = queryParameter;

        // console.log("filter parameter=====>",
        //     "minage => ", minAge,
        //     "maxAge => ", maxAge,
        //     "gender => ", gender,
        //     "search => ", search,
        //     "looking_for =>", looking_for,
        //     "distance =>", distance,
        //     "location =>", location
        // )
        const userRepository = AppDataSource.getRepository(Users);
        const userInterestRepo = AppDataSource.getRepository(UserInterest);
        const skip = (page - 1) * limit;

        //   const currentUser = await userRepository.findOne({
        //     where: {id: userId},
        //     select: ["latitude","longitude"]
        //   });

        //   if(!currentUser){
        //     return callback("User not found====>", null)
        //   }
        //   const {latitude: userLat, longitude: userLng} = currentUser;

        // Get logged-in user's interest IDs
        const userInterests = await userInterestRepo.find({
            where: { user: { id: userId } },
            relations: ["subCategory"],
            // relations:['userInterests','userInterests.subCategory','userInterests.subCategory.category']

        });

        const interestIds = userInterests.map((ui) => ui.subCategory.id);

        // Pre-calculate age filter (outside builder)
        let ageCondition = "";
        let ageParams: any = {};
        //   if (!isNaN(minAge) && !isNaN(maxAge) && minAge > 0 && maxAge > 0) {
        //     const { maxBirthDate, minBirthDate } = await findUsersByAgeRange(minAge, maxAge);
        //     ageCondition = " AND user.date_of_birth BETWEEN :minBirthDate AND :maxBirthDate";
        //     ageParams = { minBirthDate, maxBirthDate };
        //   }



        // Factory for base query
        const buildBaseQuery = () => {
            const qb = userRepository
                .createQueryBuilder("user")
                .where("user.id != :userId", { userId })
                .andWhere("user.is_deleted = :is_deleted", { is_deleted: false })
                .andWhere("user.is_profile_completed = :is_profile_completed", { is_profile_completed: true });

            if (gender && gender !== "all") {
                qb.andWhere("user.gender = :gender", { gender });
            }

            if (!isNaN(minAge) && minAge > 0) {
                console.log("minAge......", minAge)
                qb.andWhere("user.age >= :minAge", { minAge })
            }

            if (!isNaN(maxAge) && maxAge > 0) {
                console.log("maxAge.......", maxAge)
                qb.andWhere("user.age <= :maxAge", { maxAge })
            }

            if (looking_for) {
                qb.andWhere("user.looking_for = :looking_for", { looking_for })
            }

            if (location) {
                qb.andWhere("user.address = :address", { address: location })
            }
            // if (ageCondition) {
            //   qb.andWhere(ageCondition, ageParams);
            // }

            // if (distance && userLat && userLng) {
            //     qb.andWhere(
            //       `
            //       (
            //         6371 * acos(
            //           cos(radians(:userLat)) * cos(radians(user.latitude)) *
            //           cos(radians(user.longitude) - radians(:userLng)) +
            //           sin(radians(:userLat)) * sin(radians(user.latitude))
            //         )
            //       ) <= :distance
            //       `,
            //       { userLat, userLng, distance }
            //     );
            //   }
            const todayStart = subHours(new Date, 12)
            const todayEnd = endOfDay(new Date());
            qb.andWhere((qb1) => {
                const subQuery = qb1
                    .subQuery()
                    .select("1")
                    .from(UserInteraction, "interaction")
                    .where("interaction.user_id = :userId")
                    .andWhere("interaction.target_user_id = user.id")
                    .andWhere(new Brackets((qb2) => {
                        qb2.where("interaction.interaction_type = 'like'")
                            .orWhere("interaction.interaction_type = 'dislike' AND interaction.created_at >= :todayStart");
                    }))
                    .getQuery();

                return `NOT EXISTS ${subQuery}`;
            }, { userId, todayStart });

            qb.andWhere((qb1) => {
                const matchQuery = qb1
                    .subQuery()
                    .select("1")
                    .from(UserInteraction, "ui1")
                    .innerJoin(UserInteraction, "ui2", `
            ui2.user_id = user.id AND
            ui2.target_user_id = :userId AND
            ui2.interaction_type = 'like'
            `)
                    .where("ui1.user_id = :userId")
                    .andWhere("ui1.target_user_id = user.id")
                    .andWhere("ui1.interaction_type = 'like'")
                    .getQuery();

                return `NOT EXISTS ${matchQuery}`;
            }, { userId });

            if (search) {
                qb.andWhere(
                    "(user.name ILIKE :search OR user.email ILIKE :search OR user.mobile ILIKE :search OR user.address ILIKE :search OR user.job ILIKE :search)",
                    {
                        search: `%${search}%`,
                    }
                );
            }

            return qb;
        };

        // 1. Users with shared interests
        let matchingUsers: Users[] = [];
        if (interestIds.length > 0) {
            const query = buildBaseQuery();
            query
                .innerJoin(UserInterest, "ui", "ui.user_id = user.id")
                .andWhere("ui.interest_id IN (:...interestIds)", { interestIds })
                //   .addSelect("COUNT(ui.interest_id)", "shared_interests_count")
                .groupBy("user.id")
            //   .orderBy("shared_interests_count", "DESC");

            matchingUsers = await query
                .select([
                    "user.id",
                    "user.name",
                    "user.age",
                    "user.address",
                    "user.job",
                    "user.gender",
                    "user.profile_image",
                    "user.latitude",
                    "user.longitude",
                    "user.about_me",
                    "user.is_approved",
                    "user.is_rejected",
                    "user.is_ban",
                    "user.is_restrict",
                    "user.is_blocked"
                ])
                .getMany();
        }

        // 2. Remaining users without shared interests
        const remainingQuery = buildBaseQuery();
        if (interestIds.length > 0) {
            remainingQuery
                .leftJoin(UserInterest, "ui", "ui.user_id = user.id AND ui.interest_id IN (:...interestIds)", {
                    interestIds,
                })
                .andWhere("ui.interest_id IS NULL");
        }

        const remainingUsers = await remainingQuery
            .select([
                "user.id",
                "user.name",
                "user.age",
                "user.address",
                "user.job",
                "user.gender",
                "user.profile_image",
                "user.latitude",
                "user.longitude",
                "user.about_me",
                "user.is_approved",
                "user.is_rejected",
                "user.is_ban",
                "user.is_restrict",
                "user.is_blocked"
            ])
            .getMany();

        // Merge and paginate
        const mergedUsers = [...matchingUsers, ...remainingUsers];
        const total = mergedUsers.length;
        const paginatedUsers = mergedUsers.slice(skip, skip + limit);

        const pagination = {
            totalUsers: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };

        return callback(null, { users: paginatedUsers, pagination });
    } catch (error) {
        if (error instanceof Error) {
            logger.error(JSON.stringify(error));
            return callback(error.message, null);
        }
    }
}



async function findUsersByAgeRange(minAge: number, maxAge: number) {
    const today = new Date();

    // convert age to birthday range
    const minBirthDate = new Date();
    minBirthDate.setFullYear(today.getFullYear() - maxAge); // oldest user

    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(today.getFullYear() - minAge); // youngest user

    const formatedMinBirthday = minBirthDate.toISOString().split("T")[0]
    const formatedMaxBirthday = maxBirthDate.toISOString().split("T")[0]

    // const userRepository = AppDataSource.getRepository(Users);
    return { minBirthDate: formatedMinBirthday, maxBirthDate: formatedMaxBirthday }
}
export async function getDetailsOfCurrentUser(
    userId: number,
    loggedInUserId: number,
    callback: (error: any, result: any) => void
) {
    try {
        const userRepository = AppDataSource.getRepository(Users);
        const photoGallaryRepo = AppDataSource.getRepository(PhotosGallary)
        const photoLikeRepo = AppDataSource.getRepository(PhotoLike)
        const photoCommentRepo = AppDataSource.getRepository(PhotoComment);
        const videoLikeRepo = AppDataSource.getRepository(VideoLikes);
        const videoCommentRepo = AppDataSource.getRepository(VideoComment)
        const userInteractionRepo = AppDataSource.getRepository(UserInteraction);

        // fetch user details
        const user = await userRepository.findOne({
            where: { id: userId },
            relations: ['userInterests', "userInterests.subCategory", "userInterests.subCategory.category", "photos", "videos"]
        })

        if (!user) {
            return callback("User not found", null)
        }

        const isUserLiked = await userInteractionRepo.findOne({
            where: { user_id: loggedInUserId, target_user_id: userId, interaction_type: 'like' }
        })

        // For each photo, count the number of likes
        const photosWithLikes = await Promise.all(
            user.photos.map(async (photo) => {
                const likeCount = await photoLikeRepo.count({
                    where: {
                        photo: { id: photo.id }, user_like_photo: true
                    }
                });

                const loggedIn_user_like_photo = await photoLikeRepo.find({
                    where: {
                        photo: { id: photo.id },
                        user: { id: loggedInUserId }
                    }
                })

                const photoComment = await photoCommentRepo.find({
                    where: {
                        photo: { id: photo.id }
                    },
                    relations: ["user"],
                })
                return {
                    ...photo,
                    user_like_photo: loggedIn_user_like_photo.length > 0 ? loggedIn_user_like_photo[0].user_like_photo : false,
                    likeCount: likeCount,
                    photo_comment: photoComment,
                }
            })
        );

        const videoWithLikes = await Promise.all(
            user.videos.map(async (video) => {
                const videLikeCount = await videoLikeRepo.count({
                    where: {
                        video: { id: video.id }, user_like_video: true
                    }
                });

                const loggedIn_user_like_video = await videoLikeRepo.find({
                    where: {
                        video: { id: video.id },
                        user: { id: loggedInUserId }
                    }
                })

                const videoComment = await videoCommentRepo.find({
                    where: {
                        video: { id: video.id }
                    },
                    relations: ["user"],
                })
                return {
                    ...video,
                    user_like_video: loggedIn_user_like_video.length > 0 ? loggedIn_user_like_video[0].user_like_video : false,
                    video_likes_count: videLikeCount,
                    video_comment: videoComment
                }
            })
        );

        user.userInterests.map((interest) => {
            interest.subCategory
        })
        // Replace original photos with enriched version
        user.photos = photosWithLikes;
        user.videos = videoWithLikes;

        const formatedInterestSubCategory = user.userInterests.map((data) => formateInterestSubCategory(data.subCategory))

        //@ts-ignore
        delete user.password
        return callback(null, {
            ...user,
            userInterests: formatedInterestSubCategory,
            photo_count: user.photos.length ?? 0,
            video_count: user.videos.length ?? 0,
            isUserLiked: isUserLiked ? true : false
        })
    } catch (error) {
        if (error instanceof Error) {
            logger.error(JSON.stringify(error))
            return callback(error.message, null);
        }
    }
}


const calculateAge = async (dob: string) => {
    // Parse the string "20-01-1998" to Date
    const [day, month, year] = dob.split("-").map(Number);
    const birthDate = new Date(year, month - 1, day); // month is 0-based

    if (isNaN(birthDate.getTime())) {
        throw new Error("Invalid date format. Please use DD-MM-YYYY");
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const hasHadBirthdayThisYear =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
            today.getDate() >= birthDate.getDate());

    if (!hasHadBirthdayThisYear) {
        age--;
    }

    console.log("Age:", age);
    return age;
}


export async function updateDetailsOfCurrentUser(
    userId: number,
    body: any,
    reqFiles: any,
    callback: (error: any, result: any) => void
) {
    try {
        const {
            name,
            latitude,
            longitude,
            date_of_birth,
            profile_image_upload,
            email,
            mobile,
            about_me,
            user_interest,
            looking_for
        } = body;

        const userRepository = AppDataSource.getRepository(Users);

        const user = await userRepository.findOne({
            where: { id: userId },
        });

        if (!user) return callback("User not found", null);

        // Update basic fields
        if (name) user.name = name;

        if (latitude) user.latitude = latitude;
        if (longitude) user.longitude = longitude;

        if (looking_for) {
            user.looking_for = looking_for
        }

        if (mobile) {
            const existingUserWithMobile = await userRepository.findOne({ where: { mobile: mobile } })
            if (existingUserWithMobile && existingUserWithMobile.id !== userId) {
                return callback("mobile no already registered, choose another one.", null)
            }
            user.mobile = mobile;
        }

        if (about_me !== undefined) {
            user.about_me = about_me
        }


        if (email) {
            const existingUserWithEmail = await userRepository.findOne({ where: { email: email } })
            if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
                return callback("email already registered, choose another one.", null)
            }
            user.email = email;
        }
        // Handle date of birth
        if (date_of_birth) {
            try {
                const age = await calculateAge(date_of_birth); // Pass raw string like "20-01-1998"
                const [day, month, year] = date_of_birth.split("-").map(Number);
                const dob = new Date(year, month - 1, day);

                user.date_of_birth = dob;
                user.age = age;
            } catch (err: any) {
                return callback(err.message, null);
            }
        }



        if (reqFiles) {
            const files = reqFiles as Express.Multer.File[];
            const fileUrls = await uploadMultipleToFirebase(files, String(user.id))
            user.profile_image = fileUrls[0]
        }
        // Save updated user
        user.is_profile_completed = true;



        const specialFields = [
            "date_of_birth",
            "profile_image_upload",
            'email',
            'mobile',
        ];

        // Filter out special fields
        const filteredBody = Object.fromEntries(
            Object.entries(body).filter(([key]) => !specialFields.includes(key))
        );

        // Dynamically assign all other fields
        Object.assign(user, filteredBody);

        function formatDateToDDMMYYYY(date: Date | null): string | null {
            if (date) {
                const dateObj = typeof date === "string" ? new Date(date) : date;

                if (isNaN(dateObj.getTime())) {
                    return null
                }
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const year = dateObj.getUTCFullYear();
                return `${day}-${month}-${year}`;
            }
            // Fallback return to satisfy Typescript
            return null
        }

        if (user_interest) {
            const newInterests = await addUserInterest(user, JSON.parse(user_interest))
            user.userInterests = newInterests
        }

        await userRepository.save(user);
        // Cleanup sensitive info before returning
        // @ts-ignore
        delete user.password;

        const updatedUser = await userRepository.findOne({
            where: { id: userId },
            relations: ['userInterests', 'userInterests.subCategory', 'userInterests.subCategory.category']
        });
        if (!updatedUser) return;


        const formatedInterestSubCategory = updatedUser.userInterests.map((data) => formateInterestSubCategory(data.subCategory))
        const formatted_user = formatUserResponse(updatedUser)
        return callback(null, {
            ...formatted_user,
            userInterests: formatedInterestSubCategory,
            latitude: Number(user.latitude),
            longitude: Number(user.longitude)
            // date_of_birth: formatDateToDDMMYYYY(user.date_of_birth),
        });
    } catch (error) {
        console.error("Error updating user:", error);
        if (error instanceof Error) {
            return callback(error, null);
        }
    }
}

export async function uploadMediaOnFirebase(
    files: any,
    userId: string,
    callback: (error: any, result: any) => void
) {
    try {
        if (!files || (files as Express.Multer.File[]).length === 0) {
            return callback("No files uploaded", null)
        }

        const reqFiles = files as Express.Multer.File[];
        const fileUrls = await uploadMultipleToFirebase(reqFiles, userId)
        return callback(null, fileUrls)
    } catch (error) {
        if (error instanceof Error) {
            logger.error(JSON.stringify(error))
            return callback(error.message, null);
        }
    }
}

export const checkExistingUser = async (
    email: string,
    mobile: string,
    callback: (error: any, result: any) => void
) => {
    try {
        const query: any = {};
        if (email) query.email = email;
        if (mobile) query.mobile = mobile;

        const userRepository = AppDataSource.getRepository(Users);
        const user = await userRepository.findOne({ where: query });
        let isUserExist = false
        if (!user) {
            return callback(null, { isUserExist: isUserExist })
        }
        isUserExist = true
        return callback(null, { isUserExist: isUserExist })
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const requestToChangeEmail = async (
    userId: number,
    email: string,
    callback: (error: any, result: any) => void
) => {
    try {
        const userReporsitory = AppDataSource.getRepository(Users);
        const user = await userReporsitory.findOne({ where: { id: userId } })
        if (!user) {
            return callback("User not found", null)
        }

        if (user.email === email) {
            return callback("You can not change same email address.", null)
        }
        const emailAlreadyExist = await userReporsitory.find({
            where: {
                email,
                id: Not(userId)
            }
        });
        if (emailAlreadyExist.length > 0) {
            return callback("Email already in use.", null)
        }

        user.otp = "123456";
        user.is_email_verified = false;

        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        await userReporsitory.save(user);

        return callback(null, "Otp sent to your email. Please verify your email address.")
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const verifyToChangeEmail = async (
    userId: number,
    otp: string,
    email: string,
    callback: (error: any, result: any) => void
) => {
    try {
        const userReporsitory = AppDataSource.getRepository(Users);
        const user = await userReporsitory.findOne({ where: { id: userId } })
        if (!user) {
            return callback("User not found", null)
        }

        if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
            return callback("Otp has expired.", null)
        }

        if (user.otp !== otp) {
            return callback("Invalid otp", null)
        }

        user.otp = null;
        user.is_email_verified = true;
        user.otpExpiry = null;
        user.email = email;
        await userReporsitory.save(user);
        const formated_response = await formatUserResponse(user)
        return callback(null, formated_response);
    } catch (error) {

    }
}

export const deleteUserAccount = async (
    userId: number,
    callback: (error: any, result: any) => void
) => {
    try {
        const userRepo = AppDataSource.getRepository(Users);
        const deviceRepo = AppDataSource.getRepository(DeviceTable);

        const user = await userRepo.findOne({ where: { id: userId } })
        if (!user) {
            return callback("User not found.", null)
        }

        user.email = null;
        user.mobile = null;
        user.facebook_provider_id = null;
        user.is_email_verified = false;
        user.is_mobile_verified = false;
        user.is_deleted = true
        user.is_online = false;
        user.last_seen = new Date();
        await userRepo.save(user)

        await deviceRepo.createQueryBuilder()
            .delete()
            .where("user_id = :userId", { userId })
            .execute();

        return callback(null, "Account delete successfully.")
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const cafeLists = async (
    userId: number,
    matchUserId: number,
    page: number,
    limit: number,
    searchText: string = "",
    callback: (error: any, is_over_range: boolean, result: any) => void
) => {
    try {
        const userRepo = AppDataSource.getRepository(Users);
        const loggedInUser = await userRepo.findOne({ where: { id: userId, is_deleted: false }, select: ["id", "latitude", "longitude"] })
        const matchUser = await userRepo.findOne({ where: { id: matchUserId, is_deleted: false }, select: ["id", "latitude", "longitude"] })
        if (!loggedInUser?.latitude || !loggedInUser.longitude || !matchUser?.latitude || !matchUser.longitude) {
            return callback("Logged-in user or matched user latitude/longitude not found.", false, null)
        }
        const lat1 = Number(loggedInUser.latitude)
        const lng1 = Number(loggedInUser.longitude);
        const lat2 = Number(matchUser.latitude);
        const lng2 = Number(matchUser.longitude);

        let midLat;
        let midLng;
        if (lat1 === lat2 && lng1 === lng2) {

            midLat = lat1;
            midLng = lng1;
        } else {

            midLat = (lat1 + lat2) / 2;
            midLng = (lng1 + lng2) / 2;
        }

        const userDistanceMeters = geolib.getDistance(
            { latitude: lat1, longitude: lng1 },
            { latitude: lat2, longitude: lng2 }
        );
        const userDistanceKm = userDistanceMeters / 1000;
        console.log("userDistanceKm...........", userDistanceKm)
        let allCafes: any[] = [];
        if (userDistanceKm >= 50) {
            allCafes = await getNearByCafes(loggedInUser.latitude, loggedInUser.longitude, 10);
            // return callback(null,true,"Users are too far apart to find a common cafe within 100 km.")
        } else {
            allCafes = await getNearByCafes(midLat, midLng, userDistanceKm);
        }
        // const allCafes = await getNearByCafes(21.1418, 72.7709);

        if (allCafes && allCafes.length > 0) {

            const filteredCafes = allCafes.filter((cafe: any) => {
                const nameMatch = cafe.name.toLowerCase().includes(searchText.toLowerCase());
                const addressMatch = cafe.address.toLowerCase().includes(searchText.toLowerCase());
                return nameMatch || addressMatch;
            });
            const total = filteredCafes.length;
            const totalPages = Math.ceil(total / limit);
            const currentPage = Math.max(1, page);
            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedCafes = filteredCafes.slice(startIndex, endIndex);
            const pagination = {
                total,
                currentPage,
                totalPages,
            };
            return callback(null, false, {
                cafes: paginatedCafes,
                pagination
            })
        } else {
            return callback(null, false, {
                cafes: [],
                pagination: {
                    total: 0,
                    currentPage: page,
                    totalPages: 0,
                },
            })
        }
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, false, null)
        }
    }
}

const getNearByCafes = async (lat: number, lng: number, userDistanceKm: number) => {
    const apiKey = env.GOOGLE_MAP_KEY || "";

    let radius = 5000;
    if (userDistanceKm > 10) radius = 10000;
    if (userDistanceKm > 30) radius = 30000;
    if (userDistanceKm > 100) radius = 50000;
    const type = "cafe" // can also use 'restaurant' or others

    try {
        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            {
                params: {
                    location: `${lat},${lng}`,
                    radius,
                    type,
                    key: apiKey
                }
            }
        );

        const cafes = response.data.results;

        // Step 2: Build destinations for Distance Matrix API
        const destinations = cafes
            .map(
                (place: any) =>
                    `${place.geometry.location.lat},${place.geometry.location.lng}`
            )
            .join("|");


        // Step 3: Get road distance
        const distanceRes = await axios.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json",
            {
                params: {
                    origins: `${lat},${lng}`,
                    destinations,
                    mode: "driving", // you can change to 'walking', 'bicycling', etc.
                    key: apiKey,
                },
            }
        );
        // console.log("distanceRes.........",distanceRes.data)

        const distances = distanceRes.data.rows[0].elements;


        // console.log("cafes..........",cafes);
        // Optional: sort manually by distance if needed (API usually returns nearest first)
        const enrichedCafes = cafes.map((place: any, index: any) => {

            const { name, vicinity, geometry, photos, rating } = place;
            const distance = distances[index];
            // 📸 Build photo URL if photo exists
            let imageUrl = null;
            if (photos && photos.length > 0) {
                const photoRef = photos[0].photo_reference;
                imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
            }

            // 📍 Calculate distance in kilometers
            const distanceMeters = geolib.getDistance(
                { latitude: lat, longitude: lng },
                { latitude: geometry.location.lat, longitude: geometry.location.lng }
            );
            // console.log("distanceMeters...",distanceMeters)
            const distanceKm = (distanceMeters / 1000).toFixed(2);



            return {
                name,
                address: vicinity,
                rating,
                imageUrl,
                // distance_km: distanceKm,
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                placeId: place.place_id,
                distance_km: distance?.distance?.text,
                distance_duration: distance?.duration?.text,
            };
        });

        return enrichedCafes;
    } catch (error) {
        console.log("err....", error)
        if (error instanceof Error) {
            console.error("Error fetching cafes:", error.message);
            return [];
        }
    }
}

// Distance helper function (Haversine Formula)
export function getDistanceFromLatLng(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: any) {
    return deg * (Math.PI / 180);
}
const getCafesFromOSM = async (lat: number, lng: number, raduis: number) => {
    const query = `
        [out:json];
        (
            node["amenity"="cafe"](around:10000,21.1418,72.7709);
            way["amenity"="cafe"](around:10000,21.1418,72.7709);
            relation["amenity"="cafe"](around:10000,21.1418,72.7709);
        );
        out center;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    const response = await axios.post(url, `data=${encodeURIComponent(query)}`, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return response.data.elements.map((node: any) => ({
        name: node.tags?.name || "Unnamed Cafe",
        lat: node.lat,
        lon: node.lon,
        tags: node.tags
    }));
};

export const userNewRefreshToken = async (
    userId: number,
    callback: (error: any, result: any) => void
) => {
    try {
        const userRepo = AppDataSource.getRepository(Users);
        const response = await userRepo.findOne({ where: { id: userId } })
        if (!response) {
            return callback("User not found.", null)
        }

        const access_token = generateAccessToken(response.id);
        const refresh_token = generateRefreshToken(response.id);
        const formatedUserResponse = formatUserResponse(response);
        return callback(null, {
            token: access_token,
            refresh_token,
            // ...formatedUserResponse
        })
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}


export const adminLoginApi = async (
    reqBody: any,
    callback: (error: any, result: any) => void
) => {
    try {
        const adminsRepo = AppDataSource.getRepository(Admins)

        const { email, password } = reqBody;

        // (async () => {
        //     const hash = await bcrypt.hash("admin", 10);
        //     console.log(hash);
        // })();


        if (!email || !password) {
            return callback("Email and password are required.", null)
        }


        const admin = await adminsRepo.findOne({ where: { email } });

        if (!admin) {
            return callback("Admin not found.", null)
        }

        // const isMatch = await bcrypt.compare(password, admin.password);
        // if (!isMatch) {
        //     return callback("Invalid password.", null)
        // }

        const token = jwt.sign(
            { userId: admin.id, email: admin.email, user_type: admin.user_type },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || "180d" }
        );

        return callback(null, {
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        })
    } catch (error) {
        return callback(error, null)
    }
}

export async function listsReportedUsers(
    callback: (error: any, result: any) => void
) {
    try {
        const reportRepo = AppDataSource.getRepository(ReportedUser);

        const reports = await reportRepo.find({
            relations: ['reporter', 'reported'],
            order: {
                created_at: "DESC"
            }
        })

        const formatedResponse = reports.map(report => ({
            id: report.id,
            reason: report.reason,
            description: report.description,
            created_at: report.created_at,
            reporter: {
                id: report.reporter.id,
                name: report.reporter.name,
                profile_image: report.reporter.profile_image // or username/email depending on what you have
            },
            reported: {
                id: report.reported.id,
                name: report.reported.name,
                profile_image: report.reported.profile_image
            },
        }))

        return callback(null, formatedResponse)
    } catch (error) {
        return callback(error, null)
    }
}

export async function blockedUserByAdmin(
    blocker_id: number,
    blocked_id: number,
    callback: (error: any, result: any) => void
) {

    try {
        const io = getIo()
        if (!blocker_id || !blocked_id) {
            return callback("blockerId, blockedId are required", null)
        }

        const userRepo = AppDataSource.getRepository(Users);
        const adminRepo = AppDataSource.getRepository(Admins);

        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);

        if (blocker_id === blocked_id) {
            return callback("You cannot block yourself.", null)
        }

        const blocker = await adminRepo.findOneBy({ id: blocker_id });
        const blocked = await userRepo.findOneBy({ id: blocked_id });

        if (!blocker || !blocked) {
            return callback("One or both users not found.", null)
        }

        const existingBlock = await blockedUserRepo.findOne({
            where: { is_admin: true, blocked: { id: blocked_id } },
        });

        await userRepo.update({ id: blocked.id }, { is_blocked: true });

        if (existingBlock) {
            await blockedUserRepo.delete(existingBlock.id);
            await userRepo.update({ id: blocked.id }, { is_blocked: false });
            return callback(null, "User unBlocked successfully.",)
        }

        const block = blockedUserRepo.create({
            blocked,
            blocker: null,   // because admin can block user someone
            is_admin: true,
            conversation_id: null,
            created_at: new Date()
        })
        await blockedUserRepo.save(block);

        io.to(`personal_data_${blocked_id}`).emit(`user_blocked_status`, {
            isBlocked: true
        })
        return callback(null, "User blocked successfully.")
    } catch (error) {
        return callback(error, null)
    }
}


export const blockedUserListByAdmin = async (
    callback: (error: any, result: any) => void
) => {
    try {
        const blockedUserRepo = AppDataSource.getRepository(BlockedUser);

        const result = await blockedUserRepo.find({
            where: {
                is_admin: true
            },
            relations: ["blocked"]
        });

        return callback(null, result)
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const updateUserStatus = async (
    reqBody: any,
    callback: (error: any, result: any) => void
) => {
    const { user_status, user_id } = reqBody;
    try {
        const userRepo = AppDataSource.getRepository(Users);

        const user = await userRepo.findOne({ where: { id: user_id, is_deleted: false } });
        if (!user) {
            return callback("User not found.", null)
        }

        if (!user_status || !Object.values(UserStatus).includes(user_status)) {
            return callback("Invalid user status.", null)
        }

        if (UserStatus.IS_APPROVED === user_status) {
            user.is_approved = true;
        } else if (UserStatus.IS_REJECTED === user_status) {
            user.is_rejected = true;
        } else if (UserStatus.IS_BAN === user_status) {
            user.is_ban = true;
        } else if (UserStatus.IS_RESTRICT === user_status) {
            user.is_restrict = true;
        }
        await userRepo.save(user)
        return callback(null, user)
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const takeActionOnContentLists = async (
    reqBody: any,
    callback: (error: any, result: any) => void
) => {
    const { action, content_id, content_type } = reqBody;
    try {
        // ✅ Validate contentType
        if (!Object.values(ContentType).includes(content_type)) {
            return callback("Invalid contentType. Allowed: image, bio, message", null);
        }

        // ✅ Validate content exists
        if (content_type === ContentType.IMAGE) {
            const imageGallaryRepo = AppDataSource.getRepository(PhotosGallary);
            const image = await imageGallaryRepo.findOne({ where: { id: content_id } });
            if (!image) return callback("Image not found.", null);

            if (action === "delete") {
                await imageGallaryRepo.update({ id: content_id }, { is_deleted_by_admin: true });
                return callback(null, "Image deleted successfully.");
            }
        }

        // ✅ Validate content exists
        if (content_type === ContentType.VIDEO) {
            const videoGallayrRepo = AppDataSource.getRepository(VideosGallary);
            const video = await videoGallayrRepo.findOne({ where: { id: content_id } });
            if (!video) return callback("Video not found.", null);

            if (action === "delete") {
                await videoGallayrRepo.update({ id: content_id }, { is_deleted_by_admin: true });
                return callback(null, "Video deleted successfully.");
            }
        }

        if (content_type === ContentType.MESSAGE) {
            const messageRepo = AppDataSource.getRepository(Message);
            const message = await messageRepo.findOne({ where: { id: content_id } });
            if (!message) return callback("Message not found.", null);

            if (action === "delete") {
                await messageRepo.update({ id: content_id }, { is_deleted_by_admin: true });
                return callback(null, "Message deleted successfully.");
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const dashboardDataCount = async (
    callback: (error: any, result: any) => void
) => {
    try {
        const userRepo = AppDataSource.getRepository(Users)
        const reportedUserRepo = AppDataSource.getRepository(ReportedUser);

        const totalUsers = await userRepo.count({
            where: { is_deleted: false }
        })

        const totalBlockedUsers = await userRepo.count({
            where: { is_blocked: true, is_deleted: false }
        })

        const totalReportedUsers = await reportedUserRepo.count()

        const totalOnlineUsers = await userRepo.count({
            where: { is_online: true, is_deleted: false }
        })

        return callback(null, {
            totalUsers: totalUsers || 0,
            totalBlockedUsers: totalBlockedUsers || 0,
            totalReportedUsers: totalReportedUsers || 0,
            totalOnlineUsers: totalOnlineUsers || 0,
            subscribeUsers: 0
        })
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const notificationDataForAdmin = async (
    callback: (error: any, result: any) => void
) => {
    try {
        const notificationRepo = AppDataSource.getRepository(NotificationHistory);

        // Fetch notification
        const notifications = await notificationRepo
            .createQueryBuilder("notification")
            .leftJoinAndSelect("notification.sender", "sender")
            .leftJoinAndSelect("notification.receiver", "receiver")
            .leftJoinAndSelect("notification.photo", "photo")
            .leftJoinAndSelect("notification.video", "video")
            .loadRelationCountAndMap(
                "photo.likeCount",
                "photo.likes",
                "likes",
                qb => qb.where("likes.user_like_photo = :liked", { liked: true })
            )
            .loadRelationCountAndMap(
                "video.video_likes_count",
                "video.likes",
                "likes",
                qb => qb.where("likes.user_like_video = :liked", { liked: true })
            )
            .where("sender.is_deleted = false")
            .andWhere("receiver.is_deleted = false")
            .andWhere("notification.notification_type IN (:...excludedTypes)", {
                excludedTypes: [NotificationType.NEW_REGISTRATION, NotificationType.REPORT_USER]
            })
            .orderBy("notification.id", "DESC")
            .getMany();

        const unreadCount = notifications.length;
        const formatedResponse = notifications.map((entry) => {
            // const senderLat = Number(entry.sender.latitude);
            // const senderLon = Number(entry.sender.longitude);
            // const receiverLat = Number(loggedInUser.latitude);
            // const receiverLon = Number(loggedInUser.longitude);
            // // console.log("sender lat & lon | receiver lat & lon",senderLat, senderLon, receiverLat, receiverLon);
            // const isValidCoords = senderLat !== 0 && senderLon !== 0 && receiverLat !== 0 && receiverLon !== 0;
            // let distance;
            // if(isValidCoords){
            //     const calculated = calculateDistance(receiverLat, receiverLon, senderLat, senderLon);
            //     distance = calculated !== null && calculated < 1 ? "Nearby." : `${calculated} Km`
            // }

            return {
                id: entry.id,
                title: entry.title,
                body: entry.body,
                is_read: entry.is_read,
                created_at: entry.created_at,
                // sender: {
                //     id: entry.sender.id,
                //     name: entry.sender.name,
                //     profile_image : entry.sender.profile_image,
                //     latitude: senderLat,
                //     longitude: senderLon,
                // },
                // receiver: {
                //     id: entry.receiver.id,
                //     name: entry.receiver.name,
                //     profile_image : entry.receiver.profile_image,    
                //     latitude: receiverLat,
                //     longitude: receiverLon,
                // },
                // photo: entry.photo,
                // video: entry.video,
                // comment: entry.comment_message,
                // notification_type: entry.notification_type,
                // distance: distance,
                // conversation_id: entry.conversation_id
            }
        })

        return callback(null, { notifications: formatedResponse, total: unreadCount })

    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}

export const adsConfigData = {
    "admob_appopen": "ca-app-pub-3940256099942544/9257395921",
    "admob_interstital": "ca-app-pub-3940256099942544/1033173712",
    "admob_interstital_reward": "ca-app-pub-3940256099942544/5354046379",
    "admob_reward": "ca-app-pub-3940256099942544/5224354917",
    "admob_banner": "ca-app-pub-7837557880046281/6795559700",
    // "admob_banner": "ca-app-pub-3940256099942544/6300978111",
    "admob_native": "ca-app-pub-3940256099942544/2247696110",
    "admanager_appopen": "/6499/example/app-open",
    "admanager_interstital": "/6499/example/interstitial",
    "admanager_interstital_reward":
        "/21775744923/example/rewarded_interstitial",
    "admanager_reward": "/6499/example/rewarded",
    "admanager_banner": "/6499/example/banner",
    "admanager_native": "/6499/example/native",
    "ads_show": "on",
    "activity_show": "on",
    "ad_blocker": "off",
    "appopen": "on",
    "extra_activity": 4,
    "interstitial_extra_adcount": "2",
    "interstitial_count": "1",
    "interstitial_backcount": "1",
    "interstitial_start_screen_ad": "on",
    "appopen_type": "admob",
    "ad_appopen": [
        "admob",
    ],
    "ad_inter": [
        "admob",
    ],
    "ad_inter_reward": [
        "admob",
    ],
    "ad_native": [
        "admob",
    ],
    "ad_banner": [
        "admob",
    ],
    "ad_reward": [
        "admob",
    ]
};

export const adsConfigLogic = async (
    device_type: string,
    callback: (error: any, result: any) => void
) => {
    try {
        if (device_type === "ios") {
            adsConfigData.ads_show = "off"
        } else {
            adsConfigData.ads_show = "on"
        }
        return callback(null, adsConfigData);
    } catch (error) {
        if (error instanceof Error) {
            return callback(error.message, null)
        }
    }
}