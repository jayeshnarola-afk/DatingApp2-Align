import { tree } from "fp-ts";
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateInterestSubCategory1750997895147 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'interest_sub_category',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                        length: '255'
                    },
                    {
                        name: 'interest_category_id',
                        type: 'int',
                        isNullable: false
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'current_timestamp'
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'current_timestamp',
                        onUpdate: 'current_timestamp' 
                    }
                ]
            })
        )

        await queryRunner.createForeignKey(
            'interest_sub_category',
            new TableForeignKey({
                columnNames: ['interest_category_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'interest_category',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('interest_sub_category');
    }

}
