import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiSecurity } from "@nestjs/swagger";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("bbs/articles/:section")
export class BbsArticlesController {
  /**
   * Would be shown without any mark.
   *
   * @param section Section code
   * @param input Content to store
   * @returns Newly archived article
   *
   * @tag public Some description describing public group...
   * @summary Public API
   * @security bearer
   * @security oauth2 read write
   */
  @TypedRoute.Post()
  public async store(
    @TypedParam("section") section: string,
    @TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...input,
      section,
    };
  }

  /**
   * Deprecated API.
   *
   * Would be marked as "deprecated".
   *
   * For reference, top sentence "Deprecated API." can replace the `@summary` tag.
   *
   * @param section Section code
   * @param id Target article ID
   * @param input Content to update
   * @returns Updated content
   *
   * @deprecated
   * @operationId updateArticle
   * @security basic
   * @security bearer
   */
  @TypedRoute.Put(":id")
  public async update(
    @TypedParam("section") section: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...input,
      id,
      section,
    };
  }

  /**
   * Would not be shown.
   *
   * @internal
   */
  @ApiSecurity("custom") // LEGACY DECORATOR ALSO CAN BE USED
  @TypedRoute.Delete(":id")
  public erase(
    @TypedParam("section") section: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): void {
    section;
    id;
  }
}
