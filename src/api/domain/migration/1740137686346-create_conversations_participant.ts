import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateConversationsParticipant1740137686346 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "conversations_participant",
                columns:[
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "conversation_id",
                        type: "int"
                    },
                    {
                        name: "user_id",
                        type: "int"
                    },
                    {
                        name: "role",
                        type : "enum",
                        enum: ["member","admin"],
                        default: "'member'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "NOW()"
                    },
                    {
                        name: "last_cleared_message_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "last_read_message_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "is_notification_mute",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "is_unmatched_user",
                        type: "boolean",
                        default: false
                    }
                ]
            })
        )
        await queryRunner.createForeignKey(
            "conversations_participant",
            new TableForeignKey({
                columnNames:["conversation_id"],
                referencedColumnNames:["id"],
                referencedTableName:"conversations",
                onDelete:"CASCADE"
            })
        )
        await queryRunner.createForeignKey(
            "conversations_participant",
            new TableForeignKey({
                columnNames:["user_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("conversations_participant")
    }

}
