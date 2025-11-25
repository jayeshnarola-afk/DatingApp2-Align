import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateConversations1740137176905 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "conversations",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name:"type",
                        type:"enum",
                        enum: ["one-to-one", "group"],
                        default: "'one-to-one'",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "NOW()"
                    }
                ]
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("conversations")
    }

}
