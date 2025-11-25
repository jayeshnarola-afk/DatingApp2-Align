import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLongLatField1746505422839 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`Alter Table "user" alter column "longitude" TYPE decimal(10,4)`);
        await queryRunner.query(`Alter Table "user" alter column "latitude" TYPE decimal(10,4)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          alter table "user" alter column "longitude" TYPE decimal(11,8)  
        `);

        await queryRunner.query(`
            alter table "user" alter column "latitude" TYPE decimal(11,8)  
        `);
    }

}
