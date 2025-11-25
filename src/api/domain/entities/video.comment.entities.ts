import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PhotosGallary } from "./photo_gallary.entities";
import { Users } from "./users.enities";
import { VideosGallary } from "./video_gallary.entities";

@Entity("videos_comment")
export class VideoComment {
    @PrimaryGeneratedColumn()
    "id": number

    @ManyToOne(() => VideosGallary)
    @JoinColumn({name: "video_id"})
    "video": VideosGallary;

    @ManyToOne(() => Users)
    @JoinColumn({name: "user_id"})
    "user": Users;
    
    @Column({type: "varchar", length: 255, nullable: true})
    "comment": string;
    
    @CreateDateColumn({type: "timestamp"})
    "created_at": Date;
}