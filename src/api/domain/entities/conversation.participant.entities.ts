import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entities";
import { Users } from "./users.enities";

@Entity({name: "conversations_participant"})
export class ConversationParticipant {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "int", nullable: false})
    "conversation_id": number;

    @ManyToOne(() => Conversation, (conversation) => conversation.participants, {onDelete: "CASCADE"})
    @JoinColumn({ name: 'conversation_id'})
    "conversation": Conversation;

    @Column({type: "int", nullable: false})
    "user_id": number;
    @ManyToOne(() => Users, (user) => user.conversations, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    "user": Users;
    
    @Column({type: "enum",enum:["admin","member"], default:"'member'"})
    "role": "admin" | "member";

    @Column({type: "int", nullable: true})
    "last_cleared_message_id": number;

    @Column({type: "int", nullable: true})
    "last_read_message_id": number;

    @Column({type: "boolean", default: false})
    "is_notification_mute": boolean

    @Column({type: "boolean", default:false})
    "is_unmatched_user": boolean;
}