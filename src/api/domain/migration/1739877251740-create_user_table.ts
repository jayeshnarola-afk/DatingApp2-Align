import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserTable1739877251740 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255",
                        isNullable: true
                    },
                    {
                        name:"mobile",
                        type:"varchar",
                        length:"255",
                        isNullable:true
                    },
                    {
                        name:"profile_image",
                        type:"varchar",
                        length:"255",
                        isNullable: true
                    },
                    {
                        name:"email",
                        type:"varchar",
                        length:"255",
                        isNullable:true
                    },
                    {
                        name:"otp",
                        type:"varchar",
                        length:"255",
                        default: null
                    },
                    {
                        name: "otpExpiry",
                        type: "timestamp",
                        default: null
                    },
                    {
                        name: "age",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "is_profile_completed",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_mobile_verified",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_email_verified",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "date_of_birth",
                        type:"timestamp",
                        isNullable: true
                    },
                    {
                        name: "gender",
                        type: "enum",
                        enum: ["male", "female", "other"],
                        isNullable: false,
                        default: "'other'"
                    },
                    {
                        name: "status",
                        type: "boolean",
                        isNullable: false,
                        default: true
                    },
                    {
                        name:"facebook_provider_id",
                        type:"varchar",
                        isNullable: true,
                        default:null
                    },
                    {
                        name:"latitude",
                        type:"decimal",
                        precision:10,
                        scale:8,
                        isNullable: true
                    },
                    {
                        name:"longitude",
                        type:"decimal",
                        precision:11,
                        scale:8,
                        isNullable: true
                    },
                    {
                        name: "country_code",
                        type: "varchar",
                        length: "255",
                        isNullable: true
                    },
                    {
                        name: "country_iso_code",
                        type: "varchar",
                        length: "255",
                        isNullable: true
                    },
                    {
                        name: "looking_for",
                        type: "varchar",
                        length:"255",
                        isNullable: true
                    },
                    {
                        name:"about_me",
                        type: "varchar",
                        length:"255",
                        default: null
                    },
                    {
                        name:"place_id",
                        type: "varchar",
                        length:"255",
                        isNullable: true
                    },{
                        name: "address",
                        type: "varchar",
                        length:"255",
                        isNullable: true
                    },
                    {
                        name: "job",
                        type: "varchar",
                        length:"255",
                        isNullable: true
                    },
                    {
                        name: "last_seen",
                        type: "timestamp",
                        isNullable: true,
                        default: null
                    },
                    {
                        name: "last_online",
                        type: "timestamp",
                        isNullable: true,
                        default: null
                    },
                    {
                        name: "is_online",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_blocked",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_approved",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_rejected",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_ban",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_restrict",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_deleted",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate:"CURRENT_TIMESTAMP"
                    }
                ]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user");
    }
}
