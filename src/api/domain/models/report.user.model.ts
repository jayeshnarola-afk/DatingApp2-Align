import { AppDataSource } from "../../config/db";
import { NotificationType } from "../../enum";
import { Message } from "../entities/message.entity";
import { PhotosGallary } from "../entities/photo_gallary.entities";
import { ContentType, ReportedContent, ReportStatus } from "../entities/reported.content.entities";
import { ReportedUser } from "../entities/reported.user.entities";
import { Users } from "../entities/users.enities";
import { VideosGallary } from "../entities/video_gallary.entities";
import { saveNotificationHistory } from "./notification.history.model";

export async function addReportUser(
    reporterId: number,
    reqBody: any,
    callback:(error:any, result:any) => void
){
    const {reportedId, reason, description}  = reqBody
    try {
        if(!reporterId || !reportedId || !reason || !description){
            return callback("reporter_id, reportedId, reason, description are required field",null)
        }

        if(reporterId === reportedId){
            return callback("you cannot report yourself.",null)
        }

        const userRepository = AppDataSource.getRepository(Users);
        const reportRepository = AppDataSource.getRepository(ReportedUser);

        const reporter = await userRepository.findOne({where:{id: reporterId} })
        const reported = await userRepository.findOne({where:{id: reportedId} })

        if(!reporter || !reported){
            return callback("Reporter or Reported user does not exist.",null)
        }

        const report = reportRepository.create({
            reporter,
            reported,
            reason,
            description
        })
        await reportRepository.save(report);
        const title = "User Reported";
        const body = `${reporter.name} has reported ${reported.name} for ${reason}.`
        const notificationType = NotificationType.REPORT_USER
        await saveNotificationHistory(
            reporterId, 
            reportedId, 
            title, 
            body,
            null,
            notificationType,
            null,
            null,
            null,
            null,
            null
        )

        return callback(null,"Report submit successfully.")
    } catch (error) {
        return callback(error,null)
    }
}

export async function addReportedContent(
  reporterId: number,
  reqBody: any,
  callback: (error: any, result: any) => void
) {
  const { contentType, contentId, reportedUserId, reason, description } = reqBody;

  try {
    // ✅ Validate required fields
    if (!reporterId || !contentType || !contentId || !reportedUserId || !reason) {
      return callback("reporterId, contentType, contentId, reportedUserId, reason are required.", null);
    }

    // ✅ Prevent self-reporting
    if (reporterId === reportedUserId) {
      return callback("You cannot report yourself.", null);
    }

    // ✅ Validate contentType
    if (!Object.values(ContentType).includes(contentType)) {
      return callback("Invalid contentType. Allowed: image, bio, message", null);
    }

    const userRepository = AppDataSource.getRepository(Users);
    const reportRepository = AppDataSource.getRepository(ReportedContent);

    // ✅ Check reporter & reported user exists
    const reporter = await userRepository.findOne({ where: { id: reporterId } });
    const reportedUser = await userRepository.findOne({ where: { id: reportedUserId } });

    if (!reporter || !reportedUser) {
      return callback("Reporter or Reported user does not exist.", null);
    }

    // ✅ Validate content exists
    if (contentType === ContentType.IMAGE) {
      const imageGallaryRepo = AppDataSource.getRepository(PhotosGallary);
      const image = await imageGallaryRepo.findOne({ where: { id: contentId, user: { id: reportedUserId } } });
      if (!image) return callback("Image not found or does not belong to reported user.", null);
    }

    // ✅ Validate content exists
    if (contentType === ContentType.VIDEO) {
      const videoGallayrRepo = AppDataSource.getRepository(VideosGallary);
      const video = await videoGallayrRepo.findOne({ where: { id: contentId, user: { id: reportedUserId } } });
      if (!video) return callback("Video not found or does not belong to reported user.", null);
    }

    if (contentType === ContentType.MESSAGE) {
      const messageRepo = AppDataSource.getRepository(Message);
      const message = await messageRepo.findOne({ where: { id: contentId, sender: { id: reportedUserId } } });
      if (!message) return callback("Message not found or does not belong to reported user.", null);
    }

    // ✅ For bio, just check user exists (already done above)
    
    // ✅ Create Report
    const report = reportRepository.create({
      content_id:contentId,
      reportedBy: reporter,
      reportedUser,
      reason,
      notes: description || null,
      content_type: contentType,
      status: ReportStatus.PENDING,
      createdAt: new Date()
    });

    await reportRepository.save(report);

    return callback(null, "Reported content successfully.");
  } catch (error) {
    console.error("Error in addReportedContent:", error);
    return callback(error, null);
  }
}


export async function reportedContentLists(
  reqQuery: any,
  callback: (error: any, result: any) => void
) {
  const {  page = 1, limit = 10, status, content_type, reported_user} = reqQuery;
  const reportRepository = AppDataSource.getRepository(ReportedContent);

  try {
    const query = reportRepository
    .createQueryBuilder("report")
    .leftJoinAndSelect("report.reportedBy","reportedBy")
    .leftJoinAndSelect("report.reportedUser","reportedUser")
    .orderBy("report.createdAt","DESC");

     // ✅ Apply filters
    if (status) {
      query.andWhere("report.status = :status", { status });
    }
    if (content_type) {
      query.andWhere("report.content_type = :contentType", { contentType: content_type });
    }
    if (reported_user) {
      query.andWhere("reportedUser.id = :reportedUser", { reportedUser: reported_user });
    }

    // ✅ Pagination
     const skip = (Number(page) - 1) * Number(limit);
    query.skip(skip).take(Number(limit));

    const [data, total] = await query.getManyAndCount();
    const pagination = {
        totalUsers: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };

    return callback(null,{
      pagination,data
    });
  } catch (error) {
    console.error("Error in addReportedContent:", error);
    return callback(error, null);
  }
}