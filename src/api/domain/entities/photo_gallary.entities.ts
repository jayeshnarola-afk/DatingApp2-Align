import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";
import { PhotoLike } from "./photo.likes.entities";

@Entity("photos_gallary")
export class PhotosGallary {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "varchar", length: 255, nullable: false})
    "url": string;

    @Column({type: "varchar", length: 255, default: null})
    "caption": string;
    
    @Column({type:"boolean",default: false})
    "is_deleted_by_admin": boolean;
    
    @ManyToOne(() => Users, user => user.photos)
    @JoinColumn({name: "user_id"})
    "user": Users;

    @OneToMany(() => PhotoLike, like => like.photo)
    "likes": PhotoLike[];

    @CreateDateColumn({type: "timestamp"})
    "created_at": Date;
}