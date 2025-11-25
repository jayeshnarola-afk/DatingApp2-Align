import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";

export enum ReportReasonEnum {
    DONT_LIKE = "I just don't like it",
    SPAM = "It's spam",
    NUDITY = 'Nudity or sexual activity',
    VIOLENCE = 'Violence or dangerous organisations',
    FALSE_PROFILE = 'False Profile',
    SCAM = 'Scam or fraud',
    IP_VIOLATION = 'Intellectual property violations',
    OTHER = 'other',
}

@Entity("reported_users")
export class ReportedUser {
    @PrimaryGeneratedColumn()
    "id": number;

    @ManyToOne(() => Users, {onDelete:"CASCADE"})
    @JoinColumn({name: "reporter_id"})
    "reporter": Users

    @ManyToOne(() => Users, {onDelete:"CASCADE"})
    @JoinColumn({name: "reported_id"})
    "reported": Users;
    
    @Column({
        type: "enum",
        enum: ReportReasonEnum
    })
    "reason": ReportReasonEnum;

    @Column({type: "varchar", length:255})
    "description": string;

    @CreateDateColumn({name: "created_at"})
    "created_at": Date;
}