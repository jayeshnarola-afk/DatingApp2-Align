import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInterestCategoryTable1750996480080 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'interest_category',
                columns:[
                    {
                        name: "id",
                        type: "int",
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('interest_category');
    }

}
