import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAdminsTable1753184201220 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "admins",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "email",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "user_type",
                    type: "varchar",
                    length:"255",
                    default: "'admin'"
                },
                {
                    name: "password",
                    type: "varchar"
                },
                {
                    name: "name",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "is_active",
                    type: "boolean",
                    default: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("admins");
    }

}
