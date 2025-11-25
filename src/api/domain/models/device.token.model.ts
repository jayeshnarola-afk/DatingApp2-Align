

import { Not } from "typeorm";
import { AppDataSource } from "../../config/db";
import { DeviceTable } from "../entities/device.token.entities";


export async function saveFcmToken(userId: number, deviceType: string, fcmToken: string) {
    const deviceRepository = AppDataSource.getRepository(DeviceTable);

    // Step 1: Delete the fcmToken if it exists for any other user
    await deviceRepository.delete({
        fcm_token: fcmToken,
        user: { id: Not(userId) }
    });

    // Step 2: Check if the fcmToken already exists for this user
    const existingToken = await deviceRepository.findOne({
        where: {
            user: { id: userId },
            fcm_token: fcmToken
        }
    });

    // Step 3: If it exists for this user, return it
    if (existingToken) {
        return existingToken;
    }

    // Step 4: Create and save new device entry
    const newDevice = deviceRepository.create({
        user: { id: userId },
        device_type: deviceType,
        fcm_token: fcmToken
    });

    return await deviceRepository.save(newDevice);
}