import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateMessageTable1740138348605 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "message",
                columns:[
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        type: "bigint",
                        name: "message_id",
                        isNullable: true
                    },
                    {
                        name: "conversation_id",
                        type: "int"
                    },
                    {
                        name:"sender_id",
                        type: "int"
                    },
                    {
                        name: "content",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "message_type",
                        type: "enum",
                        enum: ["text","image","video","audio","document"],
                        default:"'text'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "NOW()"
                    },
                    {
                        name:"is_location_active",
                        type:"boolean",
                        default: true
                    },
                    {
                        name: "is_deleted_by_admin",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "NOW()"
                    },
                    {
                        name: "images",
                        type: "jsonb",
                        isNullable: true
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["sent", "delivered","read"],
                        default:"'sent'"
                    },
                    {
                        name: "media_url",
                        type: "varchar",
                        default: null,
                        isNullable: true
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            })
        )
        await queryRunner.createForeignKey(
            "message",
            new TableForeignKey({
                columnNames:["sender_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("message")
    }

}
