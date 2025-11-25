import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePhotoLikesTable1745906346100 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.createTable(new Table({
            name: "photos_likes",
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
                    name: "user_like_photo",
                    type: "boolean",
                    default: false
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
        await queryRunner.dropTable("photos_likes")
    }

}
