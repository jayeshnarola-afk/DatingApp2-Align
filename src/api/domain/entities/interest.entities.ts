import { BaseEntity, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";
import { UserInterest } from "./user.interest";

@Entity("interest")
export class Interest {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "varchar", length: 250, unique: true})
    "name": string;

    @Column({type:"varchar",default:null})
    "emoji": string;
    
    // @OneToMany(() => UserInterest, (user) => user.interest)
    // "userInterests": UserInterest[]
}