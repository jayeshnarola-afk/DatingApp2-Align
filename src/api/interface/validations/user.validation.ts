import joi from "joi";

export const userSignUpValidation = joi.object({
    // username: joi.string().trim().min(3).max(50).required(),
    country_code: joi.string().required(),
    email:joi.string().optional(),
    // password: joi.string().trim().min(6).required(),
    // age: joi.number().integer().required(),
    // gender:joi.string().trim().valid("male","female","other").required(),
    // orientation: joi.string().trim().valid("straight", "gay", "bisexual", "asexual", "not_specified").required(),
    provider:joi.string().optional(),
    provider_id: joi.string().optional(),
    mobile: joi.string().optional(),
    fcm_token: joi.string().optional(),
    device_type: joi.string().valid("android", "ios", "web").optional(),
    latitude: joi.string().optional(),
    longitude: joi.string().optional()
})

export const userSingInValidation = joi.object({
    email: joi.string().email().optional(),
    // username: joi.string().optional(),
    password: joi.string().required(),
    fcm_token: joi.string().optional(),
    device_type: joi.string().valid("android", "ios", "web").optional(),
    provider: joi.string().optional(),
    provider_id: joi.string().optional(),
    mobile: joi.string().optional(),
    latitude: joi.string().optional(),
    longitude: joi.string().optional()
})

export const createQuestionValidation = joi.object({
    // user_id:joi.number().optional(),
    question_text: joi.string().trim().required(),
    options: joi.array().items(joi.string().trim().required()),
    correct_answer:joi.string().required()
})