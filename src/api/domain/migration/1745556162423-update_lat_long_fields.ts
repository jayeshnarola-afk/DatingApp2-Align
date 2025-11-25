import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLatLongFields1745556162423 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`Alter Table "user" alter column "latitude" Type decimal(10,4)`);
        await queryRunner.query(`Alter Table "user" alter column "latitude" TYPE decimal(10,4)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" ALTER COLUMN "longitude" TYPE decimal(11,8)
          `);

        await queryRunner.query(`
            ALTER TABLE "user" ALTER COLUMN "latitude" TYPE decimal(11,8)
        `);
    }

}
