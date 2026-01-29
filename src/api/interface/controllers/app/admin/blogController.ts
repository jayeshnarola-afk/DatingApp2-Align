import { Request, Response } from "express";
import {
  ErrorResponse,
  notFoundResponse,
  successResponse,
  validationErrorWithData,
} from "../../../../helpers/apiResponse";
import { Constants } from "../../../../config/constants";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogById,
  listBlogsAdmin,
} from "../../../../domain/models/blog.model";
import { BlogStatus } from "../../../../domain/entities/blog.entities";

export const createBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const body = req.body || {};
  const files = req.files;
  const title = body.title;
  const content = body.content;
  const featured_image = body.featured_image ?? null;
  const status = body.status;

  if (!title || (typeof title === "string" && !title.trim())) {
    return validationErrorWithData(res, "Title is required.", { field: "title" });
  }
  if (!content || (typeof content === "string" && !content.trim())) {
    return validationErrorWithData(res, "Content is required.", { field: "content" });
  }
  const validStatus = status === BlogStatus.PUBLISHED ? BlogStatus.PUBLISHED : BlogStatus.DRAFT;

  createBlog(
    {
      title: String(title).trim(),
      content: String(content).trim(),
      featured_image: featured_image != null ? String(featured_image) : null,
      status: validStatus,
    },
    files,
    (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error);
      }
      return res.status(Constants.ERROR_CODES.CREATE_SUCCESS_CODE).json({
        status: 1,
        message: "Blog created successfully.",
        data: result,
      });
    }
  );
};

export const updateBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return ErrorResponse(res, "Invalid blog ID.");
  }
  const body = req.body || {};
  const files = req.files;
  const title = body.title;
  const content = body.content;
  const featured_image = body.featured_image;
  const status = body.status;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (featured_image !== undefined) updateData.featured_image = featured_image ?? null;
  if (status !== undefined) {
    updateData.status = status === BlogStatus.PUBLISHED ? BlogStatus.PUBLISHED : BlogStatus.DRAFT;
  }

  updateBlog(id, updateData, files, (error: any, result: any) => {
    if (error) {
      if (error === "Blog not found.") {
        return notFoundResponse(res, error);
      }
      return ErrorResponse(res, error);
    }
    return successResponse(res, "Blog updated successfully.", result);
  });
};

export const deleteBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return ErrorResponse(res, "Invalid blog ID.");
  }
  deleteBlog(id, (error: any, success: boolean) => {
    if (error) {
      if (error === "Blog not found.") {
        return notFoundResponse(res, error);
      }
      return ErrorResponse(res, error);
    }
    return successResponse(res, "Blog deleted successfully.", { deleted: true });
  });
};

export const getBlogDetailHandler = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return ErrorResponse(res, "Invalid blog ID.");
  }
  getBlogById(id, (error: any, result: any) => {
    if (error) {
      if (error === "Blog not found.") {
        return notFoundResponse(res, error);
      }
      return ErrorResponse(res, error);
    }
    return successResponse(res, "Success", result);
  });
};

export const listBlogsAdminHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

  listBlogsAdmin(page, limit, (error: any, result: any) => {
    if (error) {
      return ErrorResponse(res, error);
    }
    return res.status(Constants.ERROR_CODES.SUCCESS_CODE).json({
      status: 1,
      message: "Success",
      data: result?.blogs ?? [],
      pagination: {
        total: result?.total ?? 0,
        page: result?.page ?? page,
        totalPages: result?.totalPages ?? 0,
        limit,
      },
    });
  });
};
