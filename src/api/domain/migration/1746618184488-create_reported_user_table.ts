import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateReportedUserTable1746618184488 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "reported_users",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "reporter_id",
                        type: "int"
                    },
                    {
                        name:"reason",
                        type: "varchar"
                    },
                    {
                        name: "reported_id",
                        type: "int"
                    },
                    {
                        name: "description",
                        type: "varchar",
                        length:"255",
                        isNullable: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    }
                ]
            })
        )

        await queryRunner.createForeignKey(
            "reported_users",
            new TableForeignKey({
                columnNames: ["reporter_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        )

        await queryRunner.createForeignKey(
            "reported_users",
            new TableForeignKey({
                columnNames: ['reported_id'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('reported_users');
    }

}
