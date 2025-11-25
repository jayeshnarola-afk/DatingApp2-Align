import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserInterest } from "./user.interest";
import { InterestCategory } from "./interest_category";

@Entity('interest_sub_category')
export class InterestSubCategory {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "varchar", length: 255})
    "name": string;

    @ManyToOne(() => InterestCategory, (category) => category.subcategories, {nullable: false, onDelete:'CASCADE'})
    @JoinColumn({name: "interest_category_id"})
    "category": InterestCategory;

    @OneToMany(() => UserInterest, (userInterest) => userInterest.subCategory)
    "userInterests": UserInterest[];

    @CreateDateColumn({name: "created_at"})
    "createdAt": Date;

    @UpdateDateColumn({name: "updated_at"})
    "updatedAt": Date;
}