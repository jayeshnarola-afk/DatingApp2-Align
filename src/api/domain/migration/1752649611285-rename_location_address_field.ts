import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameLocationAddressField1752649611285 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`Alter Table "message" RENAME COLUMN "location_address" TO "dating_details"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message" RENAME COLUMN "dating_details" TO "location_address"`);
    }

}
