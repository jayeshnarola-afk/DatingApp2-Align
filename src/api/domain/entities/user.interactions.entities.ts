import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Users } from "./users.enities";

@Entity("user_interactions")
@Unique(["user","targetUser"])
export class UserInteraction {
    @PrimaryGeneratedColumn("increment")
    "id":number;

    @Column({type:"int", nullable: false})
    "user_id": number
    @ManyToOne(() => Users, (user) => user.interactions, {onDelete:"CASCADE"})
    @JoinColumn({name: "user_id"})
    "user": Users;

    @Column({type: "int", nullable: false})
    "target_user_id": number
    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "target_user_id"})
    "targetUser": Users;

    @Column({type: "enum", enum: ["like","dislike"]})
    "interaction_type":"like" | "dislike";

    @CreateDateColumn()
    "created_at": Date;
}