import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "../entities/users.enities";

@Entity({name : "device_table"})
export class DeviceTable extends BaseEntity {
    @PrimaryGeneratedColumn()
    'id':number;

    @ManyToOne(() => Users, user => user.id, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    'user': Users;

    @Column({type: "enum", enum:["android", "ios", "web"], nullable: false})
    'device_type': string;

    @Column({type:"varchar", length:255, nullable: false})
    'fcm_token': string;

    @CreateDateColumn()
    'createdAt': Date;

    @UpdateDateColumn()
    'updatedAt': Date
}