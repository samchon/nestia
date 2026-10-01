import {
  TypedBody as Body,
  TypedParam as Param,
  TypedQuery as Query,
  TypedRoute as Route,
} from "@nestia/core";
import { Controller } from "@nestjs/common";
import type { tags } from "typia";

/**
 * Connects all four aliased core decorator families to real request handling.
 *
 * @evidence contracts/common.md#principled-implementation Resolved public aliases retain generated parameter validators and route serialization in the common producer program.
 * @evidence contracts/common.md#clear-and-simple-design One stateless route exposes each independent parameter projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The class uses genuine public decorators and actual generated validators, without a decorator probe or replaced module loader.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the four aliased integration components.
 */
@Controller("core_boundary/alias")
export class CoreBoundaryAliasController {
  @Route.Post(":id")
  /**
   * Echoes validated body values alongside the typed path and query inputs.
   *
   * @evidence contracts/common.md#principled-implementation Authored UUID, required query and finite body properties define the generated validators; the returned fields come from their actual decoded values.
   * @evidence contracts/common.md#clear-and-simple-design A single projection connects parameter decoding to route serialization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected constant replaces request input or serializer output.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the three input sources and resulting response.
   */
  public store(
    @Param("id") id: string & tags.Format<"uuid">,
    @Query() query: { keyword: string },
    @Body() input: { title: string; count: number },
  ): { id: string; keyword: string; title: string; count: number } {
    return { id, keyword: query.keyword, ...input };
  }
}
