import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PhotosGallary } from "./photo_gallary.entities";
import { Users } from "./users.enities";

@Entity("photos_comment")
export class PhotoComment {
    @PrimaryGeneratedColumn()
    "id": number

    @ManyToOne(() => PhotosGallary)
    @JoinColumn({name: "photo_id"})
    "photo": PhotosGallary;

    @ManyToOne(() => Users)
    @JoinColumn({name: "user_id"})
    "user": Users;
    
    @Column({type: "varchar", length: 255, nullable: true})
    "comment": string;
    
    @CreateDateColumn({type: "timestamp"})
    "created_at": Date;
}