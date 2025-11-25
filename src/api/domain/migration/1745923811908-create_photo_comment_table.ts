import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePhotoCommentTable1745923811908 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.createTable(new Table({
                    name: "photos_comment",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment"
                        },
                        {
                            name: "photo_id",
                            type: "int",
                            isNullable: false
                        },
                        {
                            name: "user_id",
                            type: "int",
                            isNullable: false
                        },
                        {
                            name:"comment",
                            type: "varchar",
                            length: "255",
                            isNullable: true
                        },
                        {
                            name: "created_at",
                            type: "timestamp",
                            default: "NOW()"
                        }
                    ],
        
                    foreignKeys:[
                        {
                            columnNames:["user_id"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "user",
                            onDelete: "CASCADE"
                        },
                        {
                            columnNames: ["photo_id"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "photos_gallary",
                            onDelete: "CASCADE"
                        }
                    ]
                }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("photos_comment")
    }

}
