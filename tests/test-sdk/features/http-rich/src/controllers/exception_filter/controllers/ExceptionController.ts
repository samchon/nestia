import core from "@nestia/core";
import {
  Controller,
  Get,
  InternalServerErrorException,
  UnprocessableEntityException,
  UseFilters,
} from "@nestjs/common";
import { tags } from "typia";
import { v4 } from "uuid";

import {
  ExceptionFilterIAttachmentFile,
  ExceptionFilterIBbsArticle,
} from "../../../structures/exception_filter/IBbsArticle";
import { RichHttpExceptionFilter } from "../filters/HttpExceptionFilter";

@Controller("http_rich/exception_filter/exception")
export class ExceptionFilterExceptionController {
  @UseFilters(RichHttpExceptionFilter)
  @core.TypedRoute.Post("typedBody")
  public typedBody(
    @core.TypedBody() input: ExceptionFilterIBbsArticle.IStore,
  ): ExceptionFilterIBbsArticle {
    return {
      ...input,
      id: v4(),
      created_at: new Date().toISOString(),
    };
  }

  @UseFilters(RichHttpExceptionFilter)
  @core.TypedRoute.Get("typedManual")
  public typedManual(): void {
    throw new UnprocessableEntityException("Unprocessable");
  }

  @UseFilters(RichHttpExceptionFilter)
  @core.TypedRoute.Get(":id/typedParam")
  public typedParam(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
  ): void {
    id;
  }

  @UseFilters(RichHttpExceptionFilter)
  @core.TypedRoute.Get("typedQuery")
  public typedQuery(
    @core.TypedQuery() file: ExceptionFilterIAttachmentFile,
  ): ExceptionFilterIAttachmentFile {
    return file;
  }

  @UseFilters(RichHttpExceptionFilter)
  @Get("internal")
  public internal(): void {
    throw new InternalServerErrorException("Intended internal server error.");
  }
}
