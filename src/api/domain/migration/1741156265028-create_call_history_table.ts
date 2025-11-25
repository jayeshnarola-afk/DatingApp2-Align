import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateCallHistoryTable1741156265028 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "call_history",
                columns:[
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "caller_id",
                        type: "int",
                        isNullable: false
                    },
                    {
                        name: "receiver_id",
                        type: "int",
                        isNullable: false
                    },
                    {
                        name: "call_ended_by",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "call_type",
                        type: "enum",
                        enum: ["voice","video"],
                        isNullable: false
                    },
                    {
                        name: "call_status",
                        type: "enum",
                        enum: ["incoming", "outgoing", "missed", "answered", "ongoing","ended"],
                        isNullable: false
                    },
                    {
                        name: "duration",
                        type: "int",
                        isNullable: true,
                    },
                    {
                        name: "is_seen",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ]
            })
        )

        await queryRunner.createForeignKeys("call_history",[
            new TableForeignKey({
                columnNames:["caller_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete: "CASCADE"
            }),
            new TableForeignKey({
                columnNames: ["receiver_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        ])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("call_history");
    }

}
