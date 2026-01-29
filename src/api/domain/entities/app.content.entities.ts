import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("app_content")
export class AppContent {
  @PrimaryGeneratedColumn()
  "id": number;

  @Column({ type: "text" })
  "content": string;

  @CreateDateColumn({ type: "timestamp" })
  "created_at": Date;

  @UpdateDateColumn({ type: "timestamp" })
  "updated_at": Date;
}
