import { Request, Response } from "express";
import {
  ErrorResponse,
  notFoundResponse,
  successResponse,
  validationErrorWithData,
} from "../../../../helpers/apiResponse";
import { Constants } from "../../../../config/constants";
import {
  createAppContent,
  updateAppContent,
  deleteAppContent,
  getAppContentById,
  listAppContents,
} from "../../../../domain/models/app.content.model";

export const createAppContentHandler = async (req: Request, res: Response): Promise<void> => {
  const body = req.body || {};
  const content = body.content;

  if (!content || (typeof content === "string" && !content.trim())) {
    return validationErrorWithData(res, "Content is required.", { field: "content" });
  }

  createAppContent(
    {
      content: String(content).trim(),
    },
    (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error);
      }
      return res.status(Constants.ERROR_CODES.CREATE_SUCCESS_CODE).json({
        status: 1,
        message: "App content created successfully.",
        data: result,
      });
    }
  );
};

export const updateAppContentHandler = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return ErrorResponse(res, "Invalid app content ID.");
  }
  const body = req.body || {};
  const content = body.content;

  const updateData: any = {};
  if (content !== undefined) updateData.content = content;

  updateAppContent(id, updateData, (error: any, result: any) => {
    if (error) {
      if (error === "App content not found.") {
        return notFoundResponse(res, error);
      }
      return ErrorResponse(res, error);
    }
    return successResponse(res, "App content updated successfully.", result);
  });
};

export const deleteAppContentHandler = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return ErrorResponse(res, "Invalid app content ID.");
  }
  deleteAppContent(id, (error: any, success: boolean) => {
    if (error) {
      if (error === "App content not found.") {
        return notFoundResponse(res, error);
      }
      return ErrorResponse(res, error);
    }
    return successResponse(res, "App content deleted successfully.", { deleted: true });
  });
};

export const getAppContentDetailHandler = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return ErrorResponse(res, "Invalid app content ID.");
  }
  getAppContentById(id, (error: any, result: any) => {
    if (error) {
      if (error === "App content not found.") {
        return notFoundResponse(res, error);
      }
      return ErrorResponse(res, error);
    }
    return successResponse(res, "Success", result);
  });
};

export const listAppContentsHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

  listAppContents(page, limit, (error: any, result: any) => {
    if (error) {
      return ErrorResponse(res, error);
    }
    return res.status(Constants.ERROR_CODES.SUCCESS_CODE).json({
      status: 1,
      message: "Success",
      data: result?.contents ?? [],
      pagination: {
        total: result?.total ?? 0,
        page: result?.page ?? page,
        totalPages: result?.totalPages ?? 0,
        limit,
      },
    });
  });
};
