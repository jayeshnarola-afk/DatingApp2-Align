import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum BlogStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

@Entity("blogs")
export class Blog {
  @PrimaryGeneratedColumn()
  "id": number;

  @Column({ type: "varchar", length: 255 })
  "title": string;

  @Column({ type: "text" })
  "content": string;

  @Column({ type: "varchar", length: 500, nullable: true })
  "featured_image": string | null;

  @Column({ type: "varchar", length: 20, default: "draft" })
  "status": string;

  @CreateDateColumn({ type: "timestamp" })
  "created_at": Date;

  @UpdateDateColumn({ type: "timestamp" })
  "updated_at": Date;
}
