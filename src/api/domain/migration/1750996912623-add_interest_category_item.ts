import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInterestCategoryItem1750996912623 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const categories = [
            'Arts & Culture',
            'Entertainment',
            'Music',
            'Food & Drink',
            'Fitness & Sports',
            'Travel & Adventure',
            'Nature & Outdoors',
            'Learning & Personal Growth',
            'Tech & Gaming',
            'Creative & DIY',
            'Social & Community',
            'Fashion & Style',
            'Pets & Animals',
            'Spirituality & Beliefs'
        ];

        const now = new Date().toISOString();
        for (const name of categories) {
            await queryRunner.query(
                `INSERT INTO interest_category (name, created_at, updated_at) values ($1, $2, $3)`,
                [name, now, now]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        DELETE FROM interest_category
            WHERE name IN (
                'Arts & Culture',
                'Entertainment',
                'Music',
                'Food & Drink',
                'Fitness & Sports',
                'Travel & Adventure',
                'Nature & Outdoors',
                'Learning & Personal Growth',
                'Tech & Gaming',
                'Creative & DIY',
                'Social & Community',
                'Fashion & Style',
                'Pets & Animals',
                'Spirituality & Beliefs'
            )
        `);
    }

}
