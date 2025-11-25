import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Message } from "./message.entity";
import { Users } from "./users.enities";

@Entity({name:"message_meetings"})
export class DatingMessage {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "int", nullable: false})
    "message_id": number;

    @ManyToOne(() => Message, (message) => message.id, {onDelete: "CASCADE"})
    @JoinColumn({name: "message_id"})
    "message":Message;

    @Column({type:"int",nullable:true})
    "dating_creator": number;

    @Column({type:"int",nullable: true})
    "dating_partner":number;

    // ✅ Join with Users for creator
    @ManyToOne(() => Users)
    @JoinColumn({name:"dating_creator"})
    "datingCreator": Users;

     // ✅ Join with Users for partner
    @ManyToOne(() => Users)
    @JoinColumn({name:"dating_partner"})
    "datingPartner": Users;
    
    @Column({ type: "varchar", length: 255, nullable: false })
    "name": string;

    @Column({ type: "text", nullable: false })
    "address": string;

    @Column({type:"varchar",nullable: true})
    "distance_km": string;
    
    @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
    "latitude": number;

    @Column({ type: "decimal", precision: 11, scale: 8, nullable: true })
    "longitude": number;

    @Column({ type: "varchar", length: 20, default: "pending" })
    "meeting_status": "pending" | "confirmed" | "rescheduled" | "canceled" | "rejected" | "expired" | "completed";

    @Column({type:"varchar",nullable: true})
    "canceled_reason": string;
    
    @Column({ type: "timestamp", nullable: true })
    "schedule_time": Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    "image_url": string;

    @Column({ type: "float", nullable: true })
    "rating": number;

    @Column({ type: "varchar", length: 100, nullable: true })
    "place_id": string;

    @CreateDateColumn({ name: "created_at" })
    "created_at": Date;

    @UpdateDateColumn({ name: "updated_at" })
    "updated_at": Date;
}