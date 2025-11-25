import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";
import { PhotosGallary } from "./photo_gallary.entities";
import { PhotoComment } from "./photo.comment.entities";
import { VideosGallary } from "./video_gallary.entities";

@Entity({name: "notification_history"})
export class NotificationHistory {
    @PrimaryGeneratedColumn()
    "id": number;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "sender_id"})    // who sent the notification
    "sender": Users;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "receiver_id"})
    "receiver": Users;

    @Column()
    "title": string;

    @Column()
    "body": string;

    @Column({type: "boolean", default: false})
    "is_read": boolean;

    @Column({type: "varchar",default: null})
    "notification_type" : string;

    @ManyToOne(() => PhotosGallary, {nullable: true})
    @JoinColumn({name: "photo_id"})
    "photo": PhotosGallary;

    @ManyToOne(() => VideosGallary, {nullable: true})
    @JoinColumn({name: "video_id"})
    "video": VideosGallary;

    @OneToMany(() => PhotoComment, comment => comment.photo,{nullable: true})
    @JoinColumn({name: "comment_id"})
    "comments": PhotoComment;

    @Column({type: "int", nullable: true})
    "conversation_id": number;
    
    @Column({type:"varchar",default:null, nullable: true})
    "comment_message":string;
    
    @CreateDateColumn()
    "created_at": Date;
}