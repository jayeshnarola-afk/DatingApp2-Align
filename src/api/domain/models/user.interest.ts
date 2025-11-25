import { AppDataSource } from "../../config/db";
import { Interest } from "../entities/interest.entities";
import { InterestCategory } from "../entities/interest_category";
import { InterestSubCategory } from "../entities/interest_sub_category";
import { UserInterest } from "../entities/user.interest";
import { Users } from "../entities/users.enities";
import {  formateInterestCategory, formatUserResponse } from "../responseDto/userResponseDto";

export const addInterest = async (
  name: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const interestRepo = AppDataSource.getRepository(Interest);
    const createInterest = interestRepo.create({
      name: name,
    });
    const result = await interestRepo.save(createInterest);
    return callback(null, result);
  } catch (error) {
    if (error instanceof Error) {
      return callback(error.message, null);
    }
  }
};

// export const addUserInterest = async (
//     userId: number,
//     user_interest: { interest_id: number }[],
//     callback: (error: any, result: any) => void
// ) => {
//     try {
//         const userInterestRepo = AppDataSource.getRepository(UserInterest);
//         const userRepo = AppDataSource.getRepository(Users);
//         const interestRepo = AppDataSource.getRepository(Interest);

//         const user = await userRepo.findOne({ where: { id: userId } });
//         if (!user) {
//             return callback("User not found.", null);
//         }

//         // 2. Determine interests to remove
//         await userInterestRepo.delete({user:{id: userId} })

//         const interestToSave = [];

//         for (const userInt of user_interest) {
//             const interest = await interestRepo.findOne({ where: { id: userInt.interest_id } });

//             if (interest) {
//                 const userInterest = userInterestRepo.create({
//                     user: { id: userId },
//                     interest,
//                     created_at: new Date(),
//                 });
//                 interestToSave.push(userInterest);
//             }
//         }

//         let saved = [];
//         if (interestToSave.length > 0) {
//             saved = await userInterestRepo.save(interestToSave);

//         }

//         return callback(null, {
//             message: "User interests updated successfully.",
//             added: interestToSave.map(i => i.interest.id),
//             // removed: interestsToRemove.map(i => i.interest.id),
//         });

//     } catch (error) {
//         console.error(error);
//         return callback(error instanceof Error ? error.message : "Something went wrong.", null);
//     }
// };

export const addUserInterest = async (
  user: any,
  user_interest: { interest_id: number }[]
): Promise<any> => {
  console.log("user.id.......",user.id)
  try {
    const userInterestParsed = user_interest;
    const userInterestRepo = AppDataSource.getRepository(UserInterest);
    // const interestRepo = AppDataSource.getRepository(Interest);
    const subInterestRepo = AppDataSource.getRepository(InterestSubCategory);

    // Delete previous interests
    await userInterestRepo.delete({ user: { id: user.id } });

    // Use Promise.all with async map
    const newInterests = await Promise.all(
      userInterestParsed.map(async (userInt: any) => {
       
        const interest = await subInterestRepo.findOne({
          where: { id: userInt.interest_id },
          relations:['category']
        });

        if (!interest)
          throw new Error(`Interest ID ${userInt.interest_id} not found`);
        
            return userInterestRepo.create({
            user: user,
            subCategory: interest,
            // interest: interest, // Full relation object
        });
      })
    );

   
     // Step 3: Save all interests
      const savedInterests = await userInterestRepo.save(newInterests);
    // const formatdUserInterestResponse = formatedUserInterestArray(newInterests)
    return savedInterests;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
  }
};

export const interestList = async (
  callback: (error: any, result: any) => void
) => {
  try {
    const interestRepo = AppDataSource.getRepository(Interest);
    const InterestCategoryRepo = AppDataSource.getRepository(InterestCategory);


    const interest = await InterestCategoryRepo.find({
      relations:['subcategories']
    });
    const formattedResponse = interest.map(formateInterestCategory);
    return callback(null, formattedResponse);
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      return callback(error.message, null);
    }
  }
};
