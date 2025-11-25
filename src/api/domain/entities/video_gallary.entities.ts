import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";
import { VideoLikes } from "./video.likes.entities";

@Entity("videos_gallary")
export class VideosGallary {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "varchar", length: 255, nullable: false})
    "url": string;

    @Column({type: "varchar",length: 255, nullable: true})
    "thubmnail_image": string;
    
    @Column({type: "varchar", length: 255, default: null})
    "caption": string;

    @Column({type:"boolean",default: false})
    "is_deleted_by_admin": boolean;
    
    @ManyToOne(() => Users, user => user.videos)
    @JoinColumn({name: "user_id"})
    "user": Users;
   
    @OneToMany(() => VideoLikes, like => like.video)
    "likes": VideoLikes[]

    @CreateDateColumn({type: "timestamp"})
    "created_at": Date;
}