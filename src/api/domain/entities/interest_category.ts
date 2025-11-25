import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserInterest } from "./user.interest";
import { InterestSubCategory } from "./interest_sub_category";

@Entity('interest_category')
export class InterestCategory {
    @PrimaryGeneratedColumn()
    "id": number;

    @Column({type: "varchar", length: 255})
    "name": string;

    @OneToMany(() => InterestSubCategory, (subCategory) => subCategory.category)
    "subcategories": InterestSubCategory[];
    
    @CreateDateColumn({name: "created_at"})
    "createdAt": Date;

    @UpdateDateColumn({name: "updated_at"})
    "updatedAt": Date;
}