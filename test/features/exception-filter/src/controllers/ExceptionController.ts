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

import { IAttachmentFile, IBbsArticle } from "@api/lib/structures/IBbsArticle";

import { HttpExceptionFilter } from "../filters/HttpExceptionFilter";

@Controller("exception")
export class ExceptionController {
    @UseFilters(HttpExceptionFilter)
    @core.TypedRoute.Post("typedBody")
    public typedBody(@core.TypedBody() input: IBbsArticle.IStore): IBbsArticle {
        return {
            ...input,
            id: v4(),
            created_at: new Date().toISOString(),
        };
    }

    @UseFilters(HttpExceptionFilter)
    @core.TypedRoute.Get("typedManual")
    public typedManual(): void {
        throw new UnprocessableEntityException("Unprocessable");
    }

    @UseFilters(HttpExceptionFilter)
    @core.TypedRoute.Get(":id/typedParam")
    public typedParam(
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
    ): void {
        id;
    }

    @UseFilters(HttpExceptionFilter)
    @core.TypedRoute.Get("typedQuery")
    public typedQuery(
        @core.TypedQuery() file: IAttachmentFile,
    ): IAttachmentFile {
        return file;
    }

    @UseFilters(HttpExceptionFilter)
    @Get("internal")
    public internal(): void {
        throw new InternalServerErrorException(
            "Intended internal server error.",
        );
    }
}
