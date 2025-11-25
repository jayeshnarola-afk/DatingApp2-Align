import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateUnmatchUserTable1746531508056 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name:"unmatched_users",
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
                    type: "int"
                },
                {
                    name: "unmatch_id",
                    type: "int"
                },
                {
                    name: "conversation_id",
                    type:"int"
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }))

        await queryRunner.createForeignKey(
            'unmatched_users',
            new TableForeignKey({
              columnNames: ['user_id'],
              referencedTableName: 'user',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            })
          );
      
          await queryRunner.createForeignKey(
            'unmatched_users',
            new TableForeignKey({
              columnNames: ['unmatch_id'],
              referencedTableName: 'user',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            })
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('unmatched_users');
    }

}
