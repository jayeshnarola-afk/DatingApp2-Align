import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./users.enities";

export enum ReportStatus {
    PENDING = "pending",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}

export enum ContentType {
    IMAGE = "image",
    BIO = "bio",
    MESSAGE = "message",
    VIDEO = "video"
}

@Entity({name: "reported_content"})
export class ReportedContent {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "enum", enum: ContentType})
    "content_type": string;

    @Column({type: "int", nullable: true})
    "content_id": number;
    
    @ManyToOne(() => Users,(user) => user.reportsMade)
    @JoinColumn({name:"reported_by"}) 
    "reportedBy": Users;

    @ManyToOne(() => Users, (user) => user.reportsAgainst)
    @JoinColumn({name:"reported_user"})
    "reportedUser": Users

    @Column({ type: "varchar", length: 255 })
    "reason": string;

    @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.PENDING })
    "status": ReportStatus;

    @Column({ type: "text", nullable: true })
    "notes": string;

    @CreateDateColumn({ name: "created_at" })
    "createdAt": Date;

    @UpdateDateColumn({ name: "updated_at" })
    "updatedAt": Date;
}