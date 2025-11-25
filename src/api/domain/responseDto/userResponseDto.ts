import { InterestCategory } from "../entities/interest_category";
import { InterestSubCategory } from "../entities/interest_sub_category";
import { DatingMessage } from "../entities/message_meetings.entities";
import { PhotosGallary } from "../entities/photo_gallary.entities";
import { UserInterest } from "../entities/user.interest";
import { Users } from "../entities/users.enities"

export interface IUserResponse {
    id: number;
    name: string;
    mobile: string | null;
    profile_image: string;
    email: string | null;
    age: number;
    date_of_birth: Date;
    gender: string;
    latitude:any;
    longitude:any;
    country_code: string;
    country_iso_code: string;
    looking_for: string;
    about_me: string | null;
    place_id: string;
    address: string;
    job: string;
    is_profile_completed: boolean;
    is_mobile_verified: boolean;
    is_email_verified: boolean;
    is_online: boolean;
    last_seen: Date | null;
    userInterests: any
}

export const formatUserResponse = (user: Users): IUserResponse => {
    return {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        profile_image: user.profile_image,
        email: user.email,
        age: user.age,
        date_of_birth:user.date_of_birth,
        gender: user.gender,
        latitude: Number(user.latitude),
        longitude:Number(user.longitude),
        country_code: user.country_code,
        country_iso_code: user.country_iso_code,
        looking_for: user.looking_for,
        about_me: user.about_me,
        place_id: user.place_id,
        address: user.address,
        job: user.job,
        is_profile_completed: user.is_profile_completed,
        is_mobile_verified: user.is_mobile_verified,
        is_email_verified: user.is_email_verified,
        is_online: user.is_online,
        last_seen: user.last_seen,
        userInterests: user.userInterests && user.userInterests.length > 0 ? user.userInterests : []

    }
}

export interface Sender {
    id: number;
    profile_image: string;
    name: string;
    age: number;
    is_online: boolean;
    last_seen: Date | null;
}

export const sender_details = (user: Users): Sender => {
    return {
        id: user.id,
        profile_image: user.profile_image,
        name: user.name,
        age: user.age,
        is_online: user.is_online,
        last_seen: user.last_seen
    }
}


export interface FormattedMessage {
    id: number;
    message_id: number;
    conversation_id: number;
    content: string;
    created_at: Date;
    message_type: string;
    status: string;
    images: any;
    media_url:string;
    // sender_id: number;
    sender:{
        id: number;
        name: string,
        username: string,
        profile_image: string | null,
        is_online: boolean,
        latitude: number,
        longitude: number
    } | null,
    // dating_details:{
    //     cafe:{
    //         name: string;
    //         address: string;
    //         latitude: number;
    //         longitude: number;
    //         distance_km: string;
    //         imageUrl?: string;
    //         rating?:number;
    //         placeId?: string;
    //     },
    //     schedule_time: Date | null,
    //     meeting_status: string
    // } | null,
    is_location_active: boolean,
    schedule_time: Date | null,
    meeting_status: string

}

export function formatMessage(message: any): FormattedMessage {
    return {
        id: message.id,
        message_id: Number(message.message_id),
        conversation_id: message.conversation_id,
        content: message.content,
        created_at: message.created_at,
        message_type: message.message_type,
        status: message.status,
        images: message.images,
        media_url: message.media_url,
        // sender_id: message.sender_id,
        sender: message.sender ? {
            id: message.sender.id,
            name: message.sender.name,
            username: message.sender.username,
            profile_image: message.sender.profile_image ?? null,
            is_online: message.sender.is_online,
            latitude: Number(message.sender.latitude),
            longitude: Number(message.sender.longitude)
        } : null,
        // dating_details: message.dating_details ? {
        //     cafe:{
        //         name: message.dating_details.name,
        //         address: message.dating_details.address,
        //         latitude: message.dating_details.latitude,
        //         longitude: message.dating_details.longitude,
        //         distance_km: message.dating_details.distance_km,
        //         imageUrl: message.dating_details.imageUrl,
        //         rating:message.dating_details.rating,
        //         placeId: message.dating_details.placeId
        //     },
        //     meeting_status: message.dating_details.meeting_status,
        //     schedule_time:  message.dating_details.schedule_time,
        // } : null,
        is_location_active: message.is_location_active,
        schedule_time: message.schedule_time ? message.schedule_time : null,
        meeting_status: message.meeting_status,
    };
}


export interface FormattedParticipant {
    id: number;
    username: string;
    name: string;
    profile_image: string,   // array of object
    is_online: boolean,
    last_seen: Date
    latitude: number,
    longitude: number,
    dating_details:{
        cafe:{
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            distance_km: string;
            imageUrl?: string;
            rating?:number;
            placeId?: string;
        },
        schedule_time: Date | null,
        meeting_status: string
    } | null,
    is_location_active: boolean,
    meeting_status: string
    // is_notification_mute: boolean
}

export function formatParticipant(participant:any): FormattedParticipant{
    
    return {
        id: participant.user.id,
        username: participant.user.username,
        name: participant.user.name,
        profile_image: participant.user.profile_image ?? null,
        is_online: participant.user.is_online,
        last_seen: participant.user.last_seen,
        latitude: participant.user.latitude,
        longitude: participant.user.longitude,
        dating_details: participant.user.dating_details ? {
            cafe:{
                name: participant.user.dating_details.name,
                address: participant.user.dating_details.address,
                latitude: participant.user.dating_details.latitude,
                longitude: participant.user.dating_details.longitude,
                distance_km: participant.user.dating_details.distance_km,
                imageUrl: participant.user.dating_details.imageUrl,
                rating:participant.user.dating_details.rating,
                placeId: participant.user.dating_details.placeId
            },
            meeting_status: participant.user.dating_details.meeting_status,
            schedule_time:  participant.user.dating_details.schedule_time,
        } : null,
        is_location_active: participant.user.is_location_active,
        meeting_status: participant.user.meeting_status
        // is_notification_mute: participant.is_notification_mute
    }
}


export interface FormattedMediaMessage {
    id: number;
    conversation_id: number;
    content: string;
    created_at: Date;
    message_type: string;
    status: string;
    images: any;
    media_url:string;
    // sender_id: number;
    sender:{
        id: number;
        name: string,
        username: string,
        profile_image: string,
        is_online: boolean
    } | null
}

export function formatCreateMediaMessage(message: any): FormattedMediaMessage {
    return {
        id: message.id,
        conversation_id: message.conversation_id,
        content: message.content,
        created_at: message.created_at,
        message_type: message.message_type,
        status: message.status,
        images: message.images,
        media_url: message.media_url,
        // sender_id: message.sender_id,
        sender: message.sender 
        ? {
            id: message.sender.id,
            name: message.sender.name,
            username: message.sender.username,
            profile_image: message.sender.profile_image ?? null,
            is_online: message.sender.is_online
        } : null
    };
}

export interface FormatedUserInterest {
    id: number,
    created_at: Date;
    interest:{
        id: number,
        name: string,
        emoji: string
    },
    // user: {
    //     id: number,
    //     name: string,
    //     profile_image: string,
    //     is_online: boolean,
    //     last_seen: Date | null
    // }
}

// export function formatedUserInterest(user_interest: UserInterest): FormatedUserInterest {
//     return {
//         id: user_interest.id,
//         created_at: user_interest.created_at,
//         // user: {
//         //     id: user_interest.user.id,
//         //     name: user_interest.user.name,
//         //     profile_image: user_interest.user.profile_image,
//         //     is_online: user_interest.user.is_online,
//         //     last_seen: user_interest.user.last_seen
//         // },
//         interest: {
//             id: user_interest.interest.id,
//             name: user_interest.interest.name,
//             emoji: user_interest.interest.emoji
//         }
//     }
// }

// export function formatedUserInterestArray(user_interests: UserInterest[]): FormatedUserInterest[] {
//   return user_interests.map(formatedUserInterest);
// }

interface InterestCategoryDto {
    id: number;
    name: string;
    subcategories: {
            id: number;
            name: string;
    }[];
}

export function formateInterestCategory(interestCategory: InterestCategory): InterestCategoryDto {
    return {
        id: interestCategory.id,
        name: interestCategory.name,
        subcategories: interestCategory.subcategories.map(subcategory => ({
            id: subcategory.id,
            name: subcategory.name
        }))
    }
}

interface InterestSubCategoryDto {
    id: number;
    name: string;
    // category:{
    //     id: number;
    //     name: string;
    // }
}

export function formateInterestSubCategory(interestSubCategory: InterestSubCategory): InterestSubCategoryDto {
   
    return {
        id: interestSubCategory.id,
        name: interestSubCategory.name,
        // category: {
        //     id: interestSubCategory.category.id,
        //     name: interestSubCategory.category.name
        // }
    }
}


interface PhotoDto {
    id: number;
    url: string;
    caption: string;
    createdAt: Date;
    likeCount: {
        id: number,
        user_likes_photo: boolean
    }[]
}

export function formatePhoto(photo: PhotosGallary): PhotoDto{
    return {
        id: photo.id,
        url: photo.url,
        caption: photo.caption,
        createdAt: photo.created_at,
        likeCount: photo.likes.map((l) => ({
            id: l.id,
            user_likes_photo: l.user_like_photo
        }))
    }
}

interface DatingDetailsDto {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    schedule_time: Date | null;
    meeting_status: "pending" | "confirmed" | "rescheduled" | "canceled" | "rejected" | "expired" | "completed" | null;
    imageUrl?: string | null;
    rating?: number | null;
    placeId?: string | null;
    distance_km: string | null,
    canceled_reason: string | null,
    dating_creator:{
        id: number;
        name: string,
        profile_image: string | null,
        latitude: number,
        longitude: number
    } | null,
    dating_partner:{
        id: number;
        name: string,
        profile_image: string | null,
        latitude: number,
        longitude: number
    } | null,
}

export function DatingMessageFormate(message: DatingMessage, distance:any): DatingDetailsDto{
    return{
        id: message.id,
        name: message.name,
        address: message.address,
        latitude: Number(message.latitude),
        longitude: Number(message.longitude),
        schedule_time: message.schedule_time,
        meeting_status: message.meeting_status,
        imageUrl: message.image_url,
        rating: message.rating,
        placeId: message.place_id,
        // distance_km: message.distance_km,
        distance_km: distance,
        canceled_reason: message.canceled_reason,
        dating_creator:  message.datingCreator ? {
            id: message.datingCreator.id,
            name: message.datingCreator.name,
            profile_image: message.datingCreator.profile_image,
            latitude: Number(message.datingCreator.latitude),
            longitude: Number(message.datingCreator.longitude),
        }: null,
        dating_partner: message.datingPartner ? {
            id: message.datingPartner.id,
            name: message.datingPartner.name,
            profile_image: message.datingPartner.profile_image,
            latitude: Number(message.datingPartner.latitude),
            longitude: Number(message.datingPartner.longitude),
        } : null
    }
}