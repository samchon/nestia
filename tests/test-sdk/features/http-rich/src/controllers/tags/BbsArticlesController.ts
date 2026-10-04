import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import typia, { tags } from "typia";

import { TagsIBbsArticle } from "../../structures/tags/TagsIBbsArticle";

@ApiTags("bbs")
@Controller("http_rich/tags/bbs/articles/:section")
export class TagsBbsArticlesController {
  /**
   * Would be shown without any mark.
   *
   * @param section Section code
   * @param input Content to store
   * @returns Newly archived article
   * @tag public Some description describing public group...
   * @tag write Write accessor
   * @summary Public API
   * @security bearer
   * @security tagsOAuth2 read write
   */
  @TypedRoute.Post()
  public async store(
    @TypedParam("section") section: string,
    @TypedBody() input: TagsIBbsArticle.IStore,
  ): Promise<TagsIBbsArticle> {
    return {
      ...typia.random<TagsIBbsArticle>(),
      ...input,
      section,
    };
  }

  /**
   * Deprecated API.
   *
   * Would be marked as "deprecated".
   *
   * For reference, top sentence "Deprecated API." can replace the `@summary`
   * tag.
   *
   * @deprecated
   * @param section Section code
   * @param id Target article ID
   * @param input Content to update
   * @returns Updated content
   * @operationId updateArticle
   * @security basic
   * @security bearer
   */
  @ApiTags("public", "write")
  @TypedRoute.Put(":id")
  public async update(
    @TypedParam("section") section: string,
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() input: TagsIBbsArticle.IStore,
  ): Promise<TagsIBbsArticle> {
    return {
      ...typia.random<TagsIBbsArticle>(),
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
