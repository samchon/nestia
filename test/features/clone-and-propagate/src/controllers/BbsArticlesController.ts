import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

@Controller("bbs/articles/:section")
export class BbsArticlesController {
    /**
     * List up summarized articles.
     *
     * @param section Target section
     * @param query Pagination query
     * @returns Paginated articles with summarization
     */
    @core.TypedRoute.Get()
    public async index(
        @core.TypedParam("section") section: string,
        @core.TypedQuery() query: IPage.IRequest,
    ): Promise<IPage<IBbsArticle.ISummary>> {
        const limit: number = query.limit ?? 100;
        const current: number = query.page ?? 1;
        const records: number = limit * (current + 3) + 5;

        return {
            pagination: {
                current,
                limit,
                records,
                pages: Math.ceil(records / limit),
            },
            data: new Array(limit).fill("").map(() => ({
                ...typia.random<IBbsArticle.ISummary>(),
                section,
            })),
        };
    }

    /**
     * Store a new article.
     *
     * @param section Section code
     * @param input Content to store
     * @returns Newly archived article
     */
    @core.TypedRoute.Post()
    public async store(
        @core.TypedParam("section") section: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            section,
            ...input,
        };
    }

    /**
     * Update an article.
     *
     * @param section Section code
     * @param id Target article ID
     * @param input Content to update
     * @returns Updated content
     */
    @core.TypedRoute.Put(":id")
    public async update(
        @core.TypedParam("section") section: string,
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            id,
            section,
            ...input,
        };
    }
}

interface IPage<T> {
    data: T[];
    pagination: IPage.IPagination;
}
namespace IPage {
    /**
     * Page request data
     */
    export interface IRequest {
        page?: null | (number & tags.Type<"uint32">);
        limit?: null | (number & tags.Type<"uint32">);
    }

    /**
     * Page information.
     */
    export interface IPagination {
        current: number & tags.Type<"uint32">;
        limit: number & tags.Type<"uint32">;
        records: number & tags.Type<"uint32">;
        pages: number & tags.Type<"uint32">;
    }
}

/**
 * Article info.
 */
interface IBbsArticle extends IBbsArticle.IStore {
    id: string & tags.Format<"uuid">;
    section: string;
    created_at: string & tags.Format<"date-time">;
    /**
     * @format date-time
     */
    updated_at: string;
}
namespace IBbsArticle {
    export interface IStore {
        title: string & tags.MinLength<3> & tags.MaxLength<50>;
        body: string;
        files: IAttachmentFile[];
    }

    export interface ISummary {
        id: string & tags.Format<"uuid">;
        section: string;
        writer: string;
        title: string & tags.MinLength<3> & tags.MaxLength<50>;
        created_at: string & tags.Format<"date-time">;
        /**
         * @format date-time
         */
        updated_at: string;
    }
}

/**
 * Attachment file.
 */
interface IAttachmentFile {
    name: null | (string & tags.MinLength<1> & tags.MaxLength<255>);
    extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
    url: string & tags.Format<"url">;
}
