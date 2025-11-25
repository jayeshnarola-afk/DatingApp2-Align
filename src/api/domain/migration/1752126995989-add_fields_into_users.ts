import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFieldsIntoUsers1752126995989 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    

        await queryRunner.addColumn("message", new TableColumn({
            name: "location_address",
            type: "jsonb",
            isNullable: true
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.dropColumn("messages", "location_address");
    }

}
