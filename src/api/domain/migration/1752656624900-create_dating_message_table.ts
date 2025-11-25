import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDatingMessageTable1752656624900 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "message_meetings",
                columns: [
                    {
                        name: "id",
                        type:"int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy:"increment"
                    },
                    {
                        name:"message_id",
                        type:"int",
                        isNullable: false
                    },
                    {
                        name: "name",
                        type:"varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "address",
                        type:"text",
                        isNullable: false
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
                        name: "meeting_status",
                        type:"varchar",
                        length:"20",
                        default: "'pending'"
                    },
                     {
                        name: "schedule_time",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "image_url",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "rating",
                        type: "float",
                        isNullable: true,
                    },
                    {
                        name: "place_id",
                        type: "varchar",
                        length: "100",
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'current_timestamp'
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'current_timestamp',
                        onUpdate: 'current_timestamp' 
                    }
                ]
            })
        )
        await queryRunner.createForeignKey(
            "message_meetings",
            new TableForeignKey({
                columnNames: ["message_id"],
                referencedTableName: "message",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("message_meetings");
    }

}
