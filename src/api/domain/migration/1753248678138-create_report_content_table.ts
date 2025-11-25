import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateReportContentTable1753248678138 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "reported_content",
                columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "content_type",
                    type: "enum",
                    enum: ["image", "bio", "message"],
                },
                {
                    name: "content_id",
                    type: "int",
                    isNullable: true,
                },
                {
                    name: "reported_by",
                    type: "int",
                },
                {
                    name: "reported_user",
                    type: "int",
                },
                {
                    name: "reason",
                    type: "varchar",
                    length: "255",
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["pending", "resolved", "dismissed"],
                    default: "'pending'",
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP",
                },
                ],
            }),
            true
        );

        // ✅ Foreign Key for reported_by
        await queryRunner.createForeignKey(
        "reported_content",
        new TableForeignKey({
            columnNames: ["reported_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "CASCADE",
        })
        );

        // ✅ Foreign Key for reported_user
        await queryRunner.createForeignKey(
        "reported_content",
        new TableForeignKey({
            columnNames: ["reported_user"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "CASCADE",
        })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
