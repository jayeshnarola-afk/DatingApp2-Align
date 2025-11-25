import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDeviceTokenTable1739941164358 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "device_table",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "user_id",
                        type: "int",
                        isNullable: false
                    },
                    {
                        name:"device_type",
                        type:"enum",
                        enum:["android","ios","web"],
                        isNullable: true
                    },
                    {
                        name: "fcm_token",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            })
        )
        await queryRunner.createForeignKey(
            "device_table",
            new TableForeignKey({
                columnNames:["user_id"],
                referencedColumnNames:["id"],
                referencedTableName:"user",
                onDelete:"CASCADE"
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("device_table")
    }

}
