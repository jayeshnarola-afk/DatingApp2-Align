import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateVideoGallaryTable1746507695494 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.createTable(new Table({
            name: "videos_gallary",
            columns:[
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "url",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "is_deleted_by_admin",
                    type: "boolean",
                    default: false
                },
                {
                    name: "thubmnail_image",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "caption",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "user_id",
                    type: "int",
                    isNullable: false
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default:"NOW()"
                }
            ],
            foreignKeys:[
                {
                    columnNames:["user_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "user",
                    onDelete:"CASCADE"
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.dropTable("videos_gallary");
    }

}
