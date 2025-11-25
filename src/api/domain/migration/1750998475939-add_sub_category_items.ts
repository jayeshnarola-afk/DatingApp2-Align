import { category } from "fp-ts";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubCategoryItems1750998475939 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const now = new Date().toISOString();

        // step 1: Fetch all category and map name -> id
        const categories = await queryRunner.query(`select id, name from interest_category`);
        const categoryMap = new Map<string, number>();
        for (const category of categories) {
            categoryMap.set(category.name, category.id)
        }

        // step 2: define sub-categories under each category
        const subcategories = [
            {
                category: 'Arts & Culture',
                names: [
                'Museums & Exhibits',
                'Art Galleries',
                'Painting',
                'Drawing',
                'Sculpture',
                'Pottery & Ceramics',
                'Photography',
                'Calligraphy',
                'Theater & Performing Arts',
                'Opera',
                'Classical Music',
                'Architecture',
                'Street Art',
                ],
            },
            {
                category: 'Entertainment',
                names: [
      // Watchable Content – By Format
      'Movies',
      'Short Films',
      'Documentaries',
      'TV Series',
      'Miniseries',
      'Reality Shows',
      'Game Shows',
      'Talk Shows',
      'Stand-up Specials',
      'Animated Series',
      'Anime',
      'Cartoons',
      'Web Series',
      'YouTube Videos',
      'Vlogs',
      'Live Streams',
      'Twitch Streams',
      'Music Videos',
      'Sports Broadcasts',
      'eSports',
      'News Programs',

      // Watchable Content – By Genre
      'Comedy',
      'Drama',
      'Action',
      'Thriller',
      'Mystery',
      'Horror',
      'Sci-Fi',
      'Fantasy',
      'Romance',
      'Historical',
      'Biographical',
      'Crime',
      'True Crime',
      'Supernatural',
      'Coming-of-Age',
      'Political',
      'Nature/Wildlife',
      'Travel Shows',
      'Cooking Shows',
      'Home Improvement',
      'Fashion & Makeover Shows',
      'Talent Competitions',
      'Dance Shows'
                ]
            },
             {
                category: 'Music',
                names: [
                // Music Activities
                'Music Activities',
                'Going to Concerts',
                'Live DJ Sets',
                'Music Festivals',
                'Playing Instruments',
                'Singing',
                'Music Production',
                'Collecting Vinyl',
                'Karaoke',
                'Listening to Music',
                'Podcast Listening',

                // Music Genres
                'Music Genres',
                'Pop',
                'Rock',
                'Classic Rock',
                'Indie',
                'Alternative',
                'R&B',
                'Soul',
                'Hip-Hop',
                'Rap',
                'Jazz',
                'Blues',
                'Funk',
                'EDM',
                'House',
                'Techno',
                'Trance',
                'Lo-fi',
                'Classical',
                'Country',
                'Folk',
                'Bluegrass',
                'Reggae',
                'Ska',
                'Punk',
                'Metal',
                'K-pop',
                'J-pop',
                'Latin',
                'Afrobeat',
                'World Music',
                'Soundtracks / Film Scores',
                'Gospel',
                'Ambient',
                'New Age'
                ]
            },
            {
                category: 'Food & Drink',
                names: [
                    'Cooking',
                    'Baking',
                    'Trying New Restaurants',
                    'Coffee Tasting',
                    'Tea Culture',
                    'Wine Tasting',
                    'Craft Beer',
                    'Cocktail Making',
                    'Street Food',
                    'Vegan/Plant-Based Cuisine',
                    'Food Trucks',
                    'BBQ',
                    'Farmers Markets'
                ]
            },
            {
                category: 'Fitness & Sports',
                names: [
                    'Hiking',
                    'Running',
                    'Cycling',
                    'Gym Workouts',
                    'Yoga',
                    'Pilates',
                    'Swimming',
                    'Rock Climbing',
                    'Martial Arts',
                    'Dance Fitness',
                    'CrossFit',
                    'Team Sports',
                    'Tennis',
                    'Golf',
                    'Skiing/Snowboarding',
                    'Scuba Diving',
                    'Surfing'
                ]
            },
            {
                category: 'Travel & Adventure',
                names: [
                    'Weekend Getaways',
                    'Road Trips',
                    'International Travel',
                    'Backpacking',
                    'Beach Vacations',
                    'Camping',
                    'Glamping',
                    'Cruises',
                    'Cultural Travel',
                    'Travel Photography',
                    'Solo Travel',
                    'Eco-Tourism'
                ]
            },
            {
                category: 'Nature & Outdoors',
                names: [
                    'Stargazing',
                    'Gardening',
                    'Birdwatching',
                    'Nature Walks',
                    'Visiting National Parks',
                    'Foraging',
                    'Fishing',
                    'Horseback Riding',
                    'Boating',
                    'Kayaking',
                    'Picnicking'
                ]
            },
             {
                category: 'Learning & Personal Growth',
                names: [
                    'Reading Books',
                    'Audiobooks',
                    'Journaling',
                    'Creative Writing',
                    'Poetry',
                    'Language Learning',
                    'History',
                    'Philosophy',
                    'Psychology',
                    'Meditation',
                    'Mindfulness',
                    'Online Courses',
                    'TED Talks',
                    'Self-help & Personal Development'
                ]
            },
            {
                category: 'Tech & Gaming',
                names: [
                    'Video Gaming',
                    'Board Games',
                    'Coding',
                    'Esports',
                    'VR/AR',
                    'Streaming Games',
                    'Crypto',
                    'AI & Machine Learning',
                    'App Development',
                    'Robotics',
                    'Building PCs'
                ]
            },
            {
                category: 'Creative & DIY',
                names: [
                    'Crafting',
                    'DIY Projects',
                    'Home Renovation',
                    'Interior Design',
                    'Thrifting & Upcycling',
                    'Knitting',
                    'Sewing',
                    'Candle Making',
                    'Resin Art',
                    'Origami'
                ]
            },
             {
                category: 'Social & Community',
                names: [
                    'Volunteering',
                    'Activism',
                    'Attending Meetups',
                    'Networking Events',
                    'Hosting Dinner Parties',
                    'Trivia Nights',
                    'Game Nights',
                    'Supporting Local Businesses',
                    'LGBTQ+ Events',
                    'Community Organizing'
                ]
            },
            {
                category: 'Fashion & Style',
                names: [
                    'Thrifting',
                    'Streetwear',
                    'Vintage Fashion',
                    'Makeup Artistry',
                    'Hair Styling',
                    'Nail Art',
                    'Jewelry Making',
                    'Fashion Design'
                ]
            },
            {
                category: 'Pets & Animals',
                names: [
                    'Dog Lover',
                    'Cat Lover',
                    'Animal Rescue',
                    'Visiting Zoos/Aquariums',
                    'Wildlife Conservation',
                    'Horseback Riding',
                    'Exotic Pets'
                ]
            },
            {
                category: 'Spirituality & Beliefs',
                names: [
                    'Astrology',
                    'Tarot & Oracle Cards',
                    'Meditation',
                    'Yoga Philosophy',
                    'Nature-Based Spirituality',
                    'Manifestation',
                    'Energy Healing',
                    'Religious Study',
                    'Stoicism'
                ]
            }
        ];

          // Step 3: Insert subcategories
        for (const sub of subcategories) {
        const categoryId = categoryMap.get(sub.category);
        if (!categoryId) continue;

        for (const name of sub.names) {
            await queryRunner.query(
            `INSERT INTO interest_sub_category (name, interest_category_id, created_at, updated_at) VALUES ($1, $2, $3, $4)`,
            [name, categoryId, now, now]
            );
        }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
