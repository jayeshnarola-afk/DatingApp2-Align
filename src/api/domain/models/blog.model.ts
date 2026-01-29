import { AppDataSource } from "../../config/db";
import { Blog, BlogStatus } from "../entities/blog.entities";
import { uploadMultipleToFirebase } from "../../middlewares/uploadMedia";

export interface CreateBlogInput {
  title: string;
  content: string;
  featured_image?: string | null;
  status?: BlogStatus;
}

export interface UpdateBlogInput {
  title?: string;
  content?: string;
  featured_image?: string | null;
  status?: BlogStatus;
}

export async function createBlog(
  data: CreateBlogInput,
  files: any,
  callback: (error: any, result: Blog | null) => void
): Promise<void> {
  try {
    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
      return callback("Title is required.", null);
    }
    if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
      return callback("Content is required.", null);
    }
    const status = data.status && [BlogStatus.DRAFT, BlogStatus.PUBLISHED].includes(data.status)
      ? data.status
      : BlogStatus.DRAFT;

    let featuredImageUrl = data.featured_image ?? null;

    // Upload files if present
    if (files && Array.isArray(files) && files.length > 0) {
      const reqFiles = files as Express.Multer.File[];
      const fileUrls = await uploadMultipleToFirebase(reqFiles, "blogs");
      if (fileUrls && fileUrls.length > 0) {
        featuredImageUrl = fileUrls[0];
      }
    }

    const repo = AppDataSource.getRepository(Blog);
    const blog = repo.create({
      title: data.title.trim(),
      content: data.content.trim(),
      featured_image: featuredImageUrl,
      status,
    });
    const saved = await repo.save(blog);
    return callback(null, saved);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}

export async function updateBlog(
  id: number,
  data: UpdateBlogInput,
  files: any,
  callback: (error: any, result: Blog | null) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(Blog);
    const blog = await repo.findOne({ where: { id } });
    if (!blog) {
      return callback("Blog not found.", null);
    }
    if (data.title !== undefined) {
      if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
        return callback("Title is required.", null);
      }
      blog.title = data.title.trim();
    }
    if (data.content !== undefined) {
      if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
        return callback("Content is required.", null);
      }
      blog.content = data.content.trim();
    }
    
    // Upload files if present
    if (files && Array.isArray(files) && files.length > 0) {
      const reqFiles = files as Express.Multer.File[];
      const fileUrls = await uploadMultipleToFirebase(reqFiles, "blogs");
      if (fileUrls && fileUrls.length > 0) {
        blog.featured_image = fileUrls[0];
      }
    } else if (data.featured_image !== undefined) {
      blog.featured_image = data.featured_image ?? null;
    }
    
    if (data.status !== undefined && [BlogStatus.DRAFT, BlogStatus.PUBLISHED].includes(data.status)) {
      blog.status = data.status;
    }
    const saved = await repo.save(blog);
    return callback(null, saved);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}

export async function deleteBlog(
  id: number,
  callback: (error: any, success: boolean) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(Blog);
    const blog = await repo.findOne({ where: { id } });
    if (!blog) {
      return callback("Blog not found.", false);
    }
    await repo.remove(blog);
    return callback(null, true);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, false);
  }
}

export async function getBlogById(
  id: number,
  callback: (error: any, result: Blog | null) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(Blog);
    const blog = await repo.findOne({ where: { id } });
    if (!blog) {
      return callback("Blog not found.", null);
    }
    return callback(null, blog);
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}

export async function listBlogsAdmin(
  page: number,
  limit: number,
  callback: (error: any, result: { blogs: Blog[]; total: number; page: number; totalPages: number } | null) => void
): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(Blog);
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.min(Math.max(1, limit), 100);

    const [blogs, total] = await repo.findAndCount({
      order: { created_at: "DESC" },
      skip,
      take,
    });
    const totalPages = Math.ceil(total / take);
    return callback(null, {
      blogs,
      total,
      page: Math.max(1, page),
      totalPages,
    });
  } catch (error) {
    return callback(error instanceof Error ? error.message : error, null);
  }
}
