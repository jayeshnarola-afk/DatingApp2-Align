// @ts-ignore
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity,BeforeInsert, BeforeUpdate,OneToOne,JoinColumn, OneToMany, ManyToMany, JoinTable} from "typeorm";
// @ts-ignore
import bcrypt = require("bcrypt")
import { ConversationParticipant } from "./conversation.participant.entities";
import { Message } from "./message.entity";

import { CallHistory } from "./call.history.entities";
import { UserInteraction } from "./user.interactions.entities";
import { PhotosGallary } from "./photo_gallary.entities";
import { Interest } from "./interest.entities";
import { UserInterest } from "./user.interest";
import { VideosGallary } from "./video_gallary.entities";
import { ReportedContent } from "./reported.content.entities";

export enum UserStatus {
  IS_APPROVED = "is_approved",
  IS_REJECTED = "is_rejected",
  IS_BAN = "is_ban",
  IS_RESTRICT = "is_restrict"
}
@Entity({ name: "user" })
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn()
  'id': number;

  @Column({type:"varchar", length: 255, nullable: true})
  'name': string;

  @Column({type: "varchar", length:255, nullable: true})
  'mobile': string | null;

  @Column({type:"varchar", length: 255, nullable: true})
  'email': string | null;

  @Column({type: "varchar", length: 255, nullable: true})
  'profile_image': string;

  @Column({type: "varchar",length:255,  nullable: true, default: null})
  "otp": string | null;

  @Column({type: "timestamp",nullable: true, default: null})
  "otpExpiry": Date | null;

  @Column({type:"int", nullable: true})
  'age': number;

  @Column({type: "boolean", default: false})
  "is_profile_completed": boolean;

  @Column({type: "boolean", default: false})
  "is_mobile_verified": boolean;

  @Column({type: "boolean", default: false})
  "is_email_verified": boolean

  @Column({type: "timestamp", nullable: true})
  "date_of_birth":Date;

  @Column({type: "boolean", default: false})
  "is_blocked":boolean;

  @Column({
    type:"enum",
    enum:["male","female","other"],
    default:"other"
  })
  'gender': string;

  @Column()
  'status': boolean

  @Column({type: "varchar", length: 255, nullable:true})
  'facebook_provider_id':string | null;

  @Column({type:"decimal", precision:9, scale: 6, nullable: true})
  'latitude': number | null;

  @Column({type: "decimal", precision: 10, scale:6, nullable:true})
  'longitude': number | null;

  @Column({type: "varchar",nullable: false})
  "country_code": string;

  @Column({type: "varchar",nullable: false})
  "country_iso_code": string;

  @Column({type: "varchar",length:"255", nullable: false})
  "looking_for":string;

  @Column({type: "varchar", length:"255",nullable: true, default:null})
  "about_me":string | null;

  @Column({type: "varchar", length: 255, nullable: true})
  "place_id": string;

  @Column({type: "varchar",length:"255", nullable: false})
  "address": string;

  @Column({type: "varchar", length:"255", nullable: false})
  "job": string;

  
  @Column({type: "boolean", default: false})
  "is_deleted": boolean;

  @Column({type: "timestamp", default: null, nullable: true})
  "last_seen": Date | null;

  @Column({type: "boolean", default: false})
  "is_online": boolean;
  
  @Column({type: "timestamp",nullable: true,default: null})
  "last_online": Date | null;
  
  @Column({type: "boolean", default: false})
  "is_approved": boolean;
  
  @Column({type: "boolean", default: false})
  "is_rejected": boolean;
  
  @Column({type: "boolean", default: false})
  "is_ban": boolean;
  
  @Column({type: "boolean", default: false})
  "is_restrict": boolean;
  
  @OneToMany(() => ConversationParticipant, (participant) => participant.user)
  "conversations": ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.sender)
  "message": Message[];

  @OneToMany(() => UserInteraction, (interaction) => interaction.user)
  "interactions": UserInteraction[];

  @OneToMany(() => UserInteraction, (interaction) => interaction.targetUser)
  "receivedInteractions": UserInteraction[];

  @OneToMany(() => PhotosGallary, photo => photo.user)
  "photos": PhotosGallary[];
  
  @OneToMany(() => VideosGallary, (video) => video.user)
  "videos": VideosGallary[];
  
  @OneToMany(() => UserInterest, (userInterest) => userInterest.user)
  "userInterests": UserInterest[];

  @OneToMany(() => ReportedContent, (report) => report.reportedBy)
  "reportsMade": ReportedContent[];

  @OneToMany(() => ReportedContent, (report) => report.reportedUser)
  "reportsAgainst": ReportedContent[];
  
  // @Column({type:"boolean", default: true})
  // 'password':string
  // @BeforeInsert()
  // @BeforeUpdate()
  // async hashPassword() {
  //   if(this.password)
  //     this.password = await bcrypt.hash(this.password, 10);
  // }
}

