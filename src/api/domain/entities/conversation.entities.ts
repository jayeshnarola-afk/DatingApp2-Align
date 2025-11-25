import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ConversationParticipant } from "./conversation.participant.entities";
import { Message } from "./message.entity";

@Entity({name: "conversations"})
export class Conversation {
    @PrimaryGeneratedColumn()
    "id": number;
    
    @Column({
        type: "enum",
        enum: ["one-to-one", "group"]
    })
    "type": "one-to-one" | "group";

    @CreateDateColumn()
    "created_at": Date;
    
    @OneToMany(() => ConversationParticipant, (participant) => participant.conversation)
    "participants": ConversationParticipant[]

    @OneToMany(() => Message, (message) => message.conversation)
    "messages": Message[]
}