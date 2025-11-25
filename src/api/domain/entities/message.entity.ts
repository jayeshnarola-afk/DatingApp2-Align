import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Conversation } from "./conversation.entities";
import { Users } from "./users.enities";

@Entity({name: "message"})
export class Message {
    @PrimaryGeneratedColumn()
    "id":number;

    @Column({type:"int", nullable: false})
    "conversation_id": number;

    @Column({type: "bigint", nullable:true})
    "message_id": number;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {onDelete: "CASCADE"})
    @JoinColumn({name: "conversation_id"})
    "conversation": Conversation;

    @Column({type: "int", nullable: false})
    "sender_id": number;

    // @Column({type: "jsonb",nullable: true})
    // "dating_details":{
    //     cafe:{
    //         name: string;
    //         address: string;
    //         latitude: number;
    //         longitude: number;
    //         distance_km: string;
    //         imageUrl?: string;
    //         rating?:number;
    //         placeId?: string;
    //     } | null,
    //     schedule_time: Date | null,
    //     meeting_status: string | null,  // "pending" | "confirmed" | "rescheduled" | "canceled" | "rejected" | "expired" | "completed" | null;
    //     [key: string]: any  // ✅ allows future dynamic keys
    // } | null;

    @Column({type: "boolean", default: true})
    "is_location_active": boolean;

    @Column({type:"timestamp",default: null, nullable: true})
    "schedule_time": Date | null;

    @Column({type:"varchar",length:50,  nullable: true,default:null})
    "meeting_status": "pending" | "confirmed" | "rescheduled" | "canceled" | "rejected" | "expired" | "completed" | null;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "sender_id"})
    "sender": Users;

    @Column({type: "text", nullable: true})
    "content": string;

    @Column({type:"boolean",default: false})
    "is_deleted_by_admin": boolean;
    
    @Column({type: "varchar", length: 50})
    "message_type": "text" | "image" | "video" | "file" | "location"; // text, image, audio, video, file, location

    @CreateDateColumn()
    "created_at": Date;

    @UpdateDateColumn()
    "updated_at": Date;

    @Column({type: "json", nullable: true})
    "images":object

    @Column({type: "varchar", length:50, default: "sent"})
    "status": string;   // sent, deliverd, seen

    @Column({type: "varchar",length:255, default: null})
    "media_url": string;
    
    @Column({type: "timestamp", nullable: true})
    "deleted_at": Date
}