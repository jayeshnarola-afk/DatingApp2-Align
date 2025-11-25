import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";

@Entity({name: "call_history"})
export class CallHistory {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "int", nullable: true})
    "call_ended_by": number;
    
    @Column({
        type: "enum",
        enum: ["voice","video"]
    })
    "call_type": "voice" | "video";     // Type of call

    @Column({
        type: "enum",
        enum: ["incoming", "outgoing", "missed", "answered", "ongoing","ended"]
    })
    "call_status": "incoming" | "outgoing" | "missed" | "answered" | "ongoing" | "ended"; // Call status

    @Column({ type: "int", nullable: true })
    "duration": number; // Call duration in seconds

    @CreateDateColumn()
    "created_at": Date;

    @Column({ type: "boolean", default: false })
    "is_seen": boolean; // Mark if the call log has been seen
}