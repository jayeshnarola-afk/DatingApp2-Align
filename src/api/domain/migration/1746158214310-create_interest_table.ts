import { MigrationInterface, QueryRunner, Table, TableUnique } from "typeorm";

export class CreateInterestTable1746158214310 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "interest",
            columns:[
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy:"increment"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "250",
                    isUnique: true
                },
                {
                    name: "emoji",
                    type: "varchar",
                    default: null
                }
            ],
        }), true);

        // Create user_interest join table
        await queryRunner.createTable(new Table({
            name: "user_interest",
            columns:[
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy:"increment"
                },
                {
                    name: "user_id",
                    type: "int",
                    isNullable: false
                },
                {
                    name: "interest_id",
                    type: "int",
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
                    columnNames: ["interest_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "interest",
                    onDelete: "CASCADE"
                },
            ],
            uniques:[
                new TableUnique({
                    name: "UQ_users_interest",
                    columnNames:["user_id","interest_id"]
                })
            ]
        }), true)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user_interest");
        await queryRunner.dropTable("interest")
    }

}
