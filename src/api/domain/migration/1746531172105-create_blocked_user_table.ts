import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateBlockedUserTable1746531172105 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "blocked_users",
            columns:[
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "blocker_id",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "blocked_id",
                    type: "int"
                },
                {
                    name: "conversation_id",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "is_admin",
                    type: "boolean",
                    default: false
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }))

        await queryRunner.createForeignKey(
            'blocked_users',
            new TableForeignKey({
              columnNames: ['blocker_id'],
              referencedTableName: 'user',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            })
          );
      
          await queryRunner.createForeignKey(
            'blocked_users',
            new TableForeignKey({
              columnNames: ['blocked_id'],
              referencedTableName: 'user',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            })
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('blocked_users');
    }

}
