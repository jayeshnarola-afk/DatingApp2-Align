import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmokeingCategory1751281125084 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const now = new Date().toISOString();
        
        // step 1: Insert main category
        await queryRunner.query(`
            Insert into interest_category(name, created_at, updated_at) values($1, $2, $3)    
        `,['Lifestyle Preferences', now, now])

        // step 2: Fetch id of the inserted category
        const result = await queryRunner.query(
            `select id from interest_category where name = $1 LIMIT 1`,
            ['Lifestyle Preferences']
        )

        const categoryId = result[0]?.id;
        if(!categoryId){
            throw new Error('Lifestyle Preferences category insertion failed')
        }

        // Step 3: Define subcategories
        const subcategories = [
        'Vegetarian',
        'Vegan',
        'Non-Vegetarian',
        'Eggetarian',
        'Pescatarian',
        'Gluten-Free',
        'Lactose Intolerant',
        'Organic Food',
        'Jain Food',
        'Non-Smoker',
        'Occasional Smoker',
        'Regular Smoker',
        'Trying to Quit Smoking',
        'Doesn’t Drink',
        'Drinks Socially',
        'Regular Drinker',
        'Trying to Quit Drinking',
        'Fitness Enthusiast',
        'Early Riser',
        'Night Owl',
        'Meditation Practitioner',
        'Minimalist',
        'Tech-Free Lifestyle'
        ];

        // Step 4: Insert subcategories
        for (const name of subcategories) {
            await queryRunner.query(
                `INSERT INTO interest_sub_category (name, interest_category_id, created_at, updated_at) VALUES ($1, $2, $3, $4)`,
                [name, categoryId, now, now]
            );
        }

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all inserted subcategories
    await queryRunner.query(`
      DELETE FROM interest_sub_category
      WHERE interest_category_id = (
        SELECT id FROM interest_category WHERE name = 'Lifestyle Preferences'
      )
    `);

        // Remove the main category
        await queryRunner.query(`
            DELETE FROM interest_category WHERE name = 'Lifestyle Preferences'
        `);
    }

}
