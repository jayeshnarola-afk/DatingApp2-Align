import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateNotificationHistoryTable1741164305756 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "notification_history",
                columns:[
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "sender_id",
                        type: "int"
                    },
                    {
                        name: "receiver_id",
                        type: "int"
                    },
                    {
                        name: "title",
                        type: "varchar"
                    },
                    {
                        name: "body",
                        type: "text"
                    },
                    {
                        name: "is_read",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "notification_type",
                        type: "varchar",
                        default: null
                    },
                    {
                        name: "photo_id",
                        type: "int",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "video_id",
                        type: "int",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "comment_id",
                        type: "int",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "comment_message",
                        type: "varchar",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "conversation_id",
                        type: "int",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ]
            })
        )

        await queryRunner.createForeignKey(
            "notification_history",
            new TableForeignKey({
                columnNames: ["sender_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )

        await queryRunner.createForeignKey(
            "notification_history",
            new TableForeignKey({
                columnNames: ["receiver_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("notification_history");
    }

}
