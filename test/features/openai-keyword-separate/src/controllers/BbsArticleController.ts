import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { request } from "http";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

@Controller("bbs/articles")
export class BbsArticleController {
  /**
   * List up all summarized articles.
   *
   * List up all summarized articles with pagination and searching options.
   *
   * @param input Request info of pagination and searching options.
   * @returns Paginated summarized articles.
   * @author Samchon
   */
  @core.TypedRoute.Patch()
  public async index(
    @core.TypedQuery() query: IPage.IRequest,
  ): Promise<IPage<IBbsArticle.ISummary>> {
    query;
    return typia.random<IPage<IBbsArticle.ISummary>>();
  }

  /**
   * List up all abridged articles.
   *
   * List up all abridged articles with pagination and searching options.
   *
   * @param input Request info of pagination and searching options.
   * @returns Paginated abridged articles.
   * @author Samchon
   */
  @core.TypedRoute.Patch("abridges")
  public async abridges(
    @core.TypedBody() input: IBbsArticle.IRequest,
  ): Promise<IPage<IBbsArticle.IAbridge>> {
    input;
    return typia.random<IPage<IBbsArticle.IAbridge>>();
  }

  /**
   * Read individual article.
   *
   * Reads an article with its every {@link IBbsArticle.ISnapshot snapshots}.
   *
   * @param id Target article's {@link IBbsArticle.id}
   * @returns Article information
   * @author Samchon
   */
  @core.TypedRoute.Get(":id")
  public async at(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      id,
    };
  }

  /**
   * Create a new article.
   *
   * Create a new article with its first {@link IBbsArticle.ISnapshot snapshot}.
   *
   * @param input Article information to create.
   * @returns Newly created article.
   * @author Samchon
   */
  @core.TypedRoute.Post()
  public async create(
    @core.TypedBody() input: IBbsArticle.ICreate,
  ): Promise<IBbsArticle> {
    request;
    const output: IBbsArticle = {
      ...typia.random<IBbsArticle>(),
      ...input,
    };
    return output;
  }

  /**
   * Update an article.
   *
   * Accumulate a new {@link IBbsArticle.ISnapshot snapshot} record to the article.
   *
   * @param id Target article's {@link IBbsArticle.id}
   * @param input Article information to update.
   * @returns Newly accumulated snapshot information.
   * @author Samchon
   */
  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: IBbsArticle.IUpdate,
  ): Promise<IBbsArticle.ISnapshot> {
    id;
    input;
    return typia.random<IBbsArticle.ISnapshot>();
  }

  /**
   * Erase an article.
   *
   * Performs soft deletion to the article.
   *
   * @param id Target article's {@link IBbsArticle.id}
   * @param input Password of the article.
   * @author Samchon
   */
  @core.TypedRoute.Delete(":id")
  public async erase(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: IBbsArticle.IErase,
  ): Promise<void> {
    id;
    input;
  }
}
