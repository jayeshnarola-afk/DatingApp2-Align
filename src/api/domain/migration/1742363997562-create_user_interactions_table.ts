import { MigrationInterface, QueryRunner, Table, TableUnique } from "typeorm";

export class CreateUserInteractionsTable1742363997562 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "user_interactions",
            columns:[
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "user_id",
                    type:"int",
                    isNullable: false
                },
                {
                    name: "target_user_id",
                    type:"int",
                    isNullable: false
                },
                {
                    name: "interaction_type",
                    type: "enum",
                    enum: ["like", "dislike"],
                    isNullable: false
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "NOW()"
                }
            ],

            foreignKeys: [
                {
                    columnNames: ["user_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "user",
                    onDelete: "CASCADE"
                },
                {
                    columnNames: ["target_user_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "user",
                    onDelete: "CASCADE"
                }
            ]
        }))

        await queryRunner.createUniqueConstraint("user_interactions", new TableUnique({
            columnNames: ["user_id", "target_user_id"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user_interactions");
    }

}
