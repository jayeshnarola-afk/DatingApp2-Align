import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users.enities";
import { Interest } from "./interest.entities";
import { InterestSubCategory } from "./interest_sub_category";

@Entity("user_interest")
export class UserInterest {
    @PrimaryGeneratedColumn()
    "id": number;

    @ManyToOne(() => Users, (user) => user.userInterests, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({name: "user_id"})
    "user": Users;

    @ManyToOne(() => InterestSubCategory, (interest) => interest.userInterests,  { nullable: false })
    @JoinColumn({name: "interest_id"})
    "subCategory": InterestSubCategory;

    @CreateDateColumn()
    "created_at": Date;
}