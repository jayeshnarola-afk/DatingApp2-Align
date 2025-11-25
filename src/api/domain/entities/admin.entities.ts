import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("admins")
export class Admins {
  @PrimaryGeneratedColumn()
  "id": number;

  @Column({ unique: true })
  "email": string;

  @Column({type: "varchar",default:"admin"})
  "user_type":string;

  @Column()
  "password": string;

  @Column({ nullable: true })
  "name": string;

  @Column({ default: true })
  "is_active": boolean;

  @CreateDateColumn({ type: 'timestamp' })
  "created_at": Date;

  @UpdateDateColumn({ type: 'timestamp' })
  "updated_at": Date;
}