import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";

@Entity("unmatched_users")
export class unMatchUsers {
    @PrimaryGeneratedColumn()
    "id": number;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    "user": Users;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "unmatch_id"})
    "unMatchUser": Users;

    @Column({type:"int"})
    "conversation_id": number;
    
    @CreateDateColumn({name: "created_at"})
    "created_at": Date
}