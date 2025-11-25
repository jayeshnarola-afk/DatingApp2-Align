import schedule from "node-schedule"
import { getIo } from "../../../infrastructure/webserver/express";
import { AppDataSource } from "../../config/db";
import { Users } from "../../domain/entities/users.enities";
import { DatingMessage } from "../../domain/entities/message_meetings.entities";
import { Message } from "../../domain/entities/message.entity";
import { DatingMessageFormate, formatMessage } from "../../domain/responseDto/userResponseDto";
import { getDistanceFromLatLng } from "../../domain/models/user.model";
import { LessThanOrEqual } from "typeorm";
export const cronjob = async()=>{
    schedule.scheduleJob("*/2 * * * *", async () => {
        const io = getIo();
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

        const userRepo = AppDataSource.getRepository(Users);
        const users = await userRepo.find({where:{is_deleted: false} });

        const offlineUserIds = new Set();

        for (const element of users) {
            if (element.is_online && element.last_online !== null) {
            const lastOnline = new Date(element.last_online);

            
            console.log(`lastOnline     : ${lastOnline}`);
            console.log(`oneMinuteAgo   : ${oneMinuteAgo}`);


            if (lastOnline <= oneMinuteAgo) {
                console.log("❌ User should be marked OFFLINE");

                await userRepo.update(
                    {id: element.id, is_deleted: false},
                    {is_online: false, last_seen: now}
                )

                offlineUserIds.add(element.id);
                
            } else {
                console.log("✅ User is still ONLINE");
            }
            }
        }

        // Now notify remaining online users (excluding the ones just updated)
        const stillOnlineUsers = await userRepo.find({
            where: {
                is_deleted: false,
                is_online: true
            }
        })


        offlineUserIds.forEach(offlineUserId => {
            stillOnlineUsers.forEach(user => {
                if (user.id !== offlineUserId) {
                const socket = `personal_data_${user.id}`
                    if (socket) {
                        io.to(socket).emit("user_status", {
                            userOnline: "cron",
                            user_id: offlineUserId, // ✅ user who went offline
                            is_online: false,
                            lastSeen: now
                        });
                    }
                }
            });
        });
    });

    schedule.scheduleJob("*/1 * * * *", async ()=> {
        // console.log("============= EVENT CALLING ========================")
        await updateConfirmStatusToCompleted();
    });
    
}

const updateConfirmStatusToCompleted = async () => {
    try {
        // console.log("===================== FUNCTION CALLING ============================");
        const io = getIo()
        const datingMessageRepo = AppDataSource.getRepository(DatingMessage);
        const messageRepo = AppDataSource.getRepository(Message)
      
        const now = new Date();
        const completionThreshold = new Date(now.getTime() - 3 * 60 *1000);

        // ✅ Step 1: Get all eligible dating messages (for event emission later)
        const eligibleMessages = await datingMessageRepo
            .createQueryBuilder("dm")
            .leftJoinAndSelect("dm.datingCreator", "dc")  // ✅ correct property name
            .leftJoinAndSelect("dm.datingPartner", "dp")  // ✅ correct property name
            .select([
                "dm.id",
                "dm.message_id",
                "dm.meeting_status",
                "dm.schedule_time",
                "dm.latitude",
                "dm.longitude",
                "dc.id",
                "dc.latitude",
                "dc.longitude",
                "dp.id",
                "dp.latitude",
                "dp.longitude",
            ])
            .where("dm.meeting_status = :status", { status: "confirmed" })
            .andWhere(`NOW() >= (dm.schedule_time + interval '3 minutes')`)
            .getMany();

        // console.log("========================> eligibleMessages.length",eligibleMessages.length)
        if(eligibleMessages.length === 0){
            console.log("No records to update.");
            return;
        }

        if(eligibleMessages.length > 0){
            // ✅ Step 2: Bulk update meeting_status to 'completed'
            await datingMessageRepo.createQueryBuilder()
            .update(DatingMessage)
            .set({
                meeting_status:'completed',
                updated_at:() => 'NOW()'
            })
            .where("meeting_status = :status",{status: "confirmed"})
            .andWhere(`NOW() >= (schedule_time + interval '3 minutes')`)
            .execute();
            
            // console.log("----------------> update successfully status.")
        }
        

        // ✅ Step 3: Emit events for each updated record
        await Promise.all(
            eligibleMessages.map(async (datingMessage) =>{
                const message = await messageRepo.findOne({
                    where: { id: datingMessage.message_id },
                    relations: ["sender"]
                });

                 if (!message || !datingMessage.datingCreator || !datingMessage.datingPartner) return;

                const distA = getDistanceFromLatLng(Number(datingMessage?.datingCreator.latitude), Number(datingMessage?.datingCreator.longitude), Number(datingMessage?.latitude), Number(datingMessage?.longitude));
                const distance = (distA / 1000).toFixed(2);
                const distB = getDistanceFromLatLng(Number(datingMessage?.datingPartner.latitude), Number(datingMessage?.datingPartner.longitude), Number(datingMessage?.latitude), Number(datingMessage?.longitude));
                const distanceB = (distB / 1000).toFixed(2);

                const response1 = formatMessage(message);

                // console.log("event-----------ids--------->",datingMessage.dating_creator, datingMessage.dating_partner)

                io.to(`personal_data_${datingMessage.dating_creator}`).emit("new_message_received",
                    {
                        ...response1,
                        dating_details: datingMessage ? DatingMessageFormate(datingMessage, distance) : null
                    }
                )
                io.to(`personal_data_${datingMessage.dating_partner}`).emit("new_message_received",
                    {
                        ...response1,
                        dating_details: datingMessage ? DatingMessageFormate(datingMessage, distanceB) : null
                    }
                )
            })
        ) 
    } catch (error) {
        console.log("errrr........",error)
        throw error
    }
}