import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PhotosGallary } from "./photo_gallary.entities";
import { Users } from "./users.enities";

@Entity("photos_likes")
export class PhotoLike {
    @PrimaryGeneratedColumn()
    "id": number

    @ManyToOne(() => PhotosGallary)
    @JoinColumn({name: "photo_id"})
    "photo": PhotosGallary;

    @ManyToOne(() => Users)
    @JoinColumn({name: "user_id"})
    "user": Users;
    
    @Column({type:"boolean", default: false})
    "user_like_photo": boolean;

    @CreateDateColumn({type: "timestamp"})
    "created_at": Date;
}