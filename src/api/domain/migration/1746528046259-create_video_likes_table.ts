import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateVideoLikesTable1746528046259 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.createTable(new Table({
                    name: "video_likes",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment"
                        },
                        {
                            name: "video_id",
                            type: "int",
                            isNullable: false
                        },
                        {
                            name: "user_id",
                            type: "int",
                            isNullable: false
                        },
                        {
                            name: "user_like_video",
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
                            columnNames: ["video_id"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "videos_gallary",
                            onDelete: "CASCADE"
                        }
                    ]
                }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("video_likes")
    }

}
