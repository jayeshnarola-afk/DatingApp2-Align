import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMettingStatusIntoMessage1752568908190 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("message", new TableColumn({
            name: "meeting_status",
            type: "varchar",
            length: "50",
            isNullable: true,
            default: null
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("message", "meeting_status");
    }

}
