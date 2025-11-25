import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnumIntoMessage1752132328177 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "message_message_type_enum" ADD VALUE IF NOT EXISTS 'location';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
