import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";

@Entity("blocked_users")
export class BlockedUser {
    @PrimaryGeneratedColumn()
    "id": number;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "blocker_id"})
    "blocker": Users | null;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "blocked_id"})
    "blocked": Users;

    @Column({type:"int",nullable: true})
    "conversation_id": number| null;

    @Column({type: "boolean",default: false})
    "is_admin": boolean;
    
    @CreateDateColumn({name: "created_at"})
    "created_at": Date
}