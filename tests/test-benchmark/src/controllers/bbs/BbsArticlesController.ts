import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "../../api/structures/bbs/IBbsArticle";
import { IPage } from "../../api/structures/common/IPage";

/**
 * This is a fake controller.
 *
 * Remove it or make it to be real one.
 */
@Controller("bbs/articles/:section")
export class BbsArticlesController {
  /**
   * List up entire articles, but paginated and summarized.
   *
   * This method is for listing up summarized articles with pagination.
   *
   * If you want, you can search and sort articles with specific conditions.
   *
   * @param section Target section
   * @param input Pagination request info with searching and sorting options
   * @returns Paginated articles with summarization
   */
  @core.TypedRoute.Patch()
  public async index(
    @core.TypedParam("section") section: string,
    @core.TypedBody() input: IBbsArticle.IRequest,
  ): Promise<IPage<IBbsArticle.ISummary>> {
    section;
    input;
    return typia.random<IPage<IBbsArticle.ISummary>>();
  }

  /**
   * Get an article with detailed info.
   *
   * Open an article with detailed info, increasing reading count.
   *
   * @param section Target section
   * @param id Target articles id
   * @returns Detailed article info
   */
  @core.TypedRoute.Get(":id")
  public async at(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string,
  ): Promise<IBbsArticle> {
    section;
    id;
    return typia.random<IBbsArticle>();
  }

  /**
   * Create a new article.
   *
   * Create a new article and returns its detailed record info.
   *
   * @param section Target section
   * @param input New article info
   * @returns Newly created article info
   */
  @core.TypedRoute.Post()
  public async create(
    @core.TypedParam("section") section: string,
    @core.TypedBody() input: IBbsArticle.ICreate,
  ): Promise<IBbsArticle> {
    section;
    input;
    return typia.random<IBbsArticle>();
  }

  /**
   * Update article.
   *
   * When updating, this BBS system does not overwrite the content, but accumulate it.
   * Therefore, whenever an article being updated, length of {@link IBbsArticle.snapshots}
   * would be increased and accumulated.
   *
   * @param section Target section
   * @param id Target articles id
   * @param input Content to update
   * @returns Newly created content info
   */
  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: IBbsArticle.IUpdate,
  ): Promise<IBbsArticle.ISnapshot> {
    section;
    id;
    input;
    return typia.random<IBbsArticle.ISnapshot>();
  }
}
