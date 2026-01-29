import { AppDataSource } from "../../config/db";
import { AppContent } from "../entities/app.content.entities";

export interface CreateAppContentInput {
  content: string;
}

export interface UpdateAppContentInput {
  content?: string;
}

export async function createAppContent(
  data: CreateAppContentInput,
  callback: (error: any, result: AppContent | null) => void
): Promise<void> {
  try {
    if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
      return callback("Content is required.", null);
    }

    const repo = AppDataSource.getRepository(AppContent);
    const appContent = repo.create({
      content: data.content.trim(),
    });
    const saved = await repo.save(appContent);
    return callback(null, saved);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}

export async function updateAppContent(
  id: number,
  data: UpdateAppContentInput,
  callback: (error: any, result: AppContent | null) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AppContent);
    const appContent = await repo.findOne({ where: { id } });
    if (!appContent) {
      return callback("App content not found.", null);
    }
    if (data.content !== undefined) {
      if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
        return callback("Content is required.", null);
      }
      appContent.content = data.content.trim();
    }
    const saved = await repo.save(appContent);
    return callback(null, saved);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}

export async function deleteAppContent(
  id: number,
  callback: (error: any, success: boolean) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AppContent);
    const appContent = await repo.findOne({ where: { id } });
    if (!appContent) {
      return callback("App content not found.", false);
    }
    await repo.remove(appContent);
    return callback(null, true);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, false);
  }
}

export async function getAppContentById(
  id: number,
  callback: (error: any, result: AppContent | null) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AppContent);
    const appContent = await repo.findOne({ where: { id } });
    if (!appContent) {
      return callback("App content not found.", null);
    }
    return callback(null, appContent);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}

export async function listAppContents(
  page: number,
  limit: number,
  callback: (error: any, result: { contents: AppContent[]; total: number; page: number; totalPages: number } | null) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AppContent);
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.min(Math.max(1, limit), 100);

    const [contents, total] = await repo.findAndCount({
      order: { created_at: "DESC" },
      skip,
      take,
    });
    const totalPages = Math.ceil(total / take);
    return callback(null, {
      contents,
      total,
      page: Math.max(1, page),
      totalPages,
    });
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}
