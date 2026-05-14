import {
  TypedBody as Body,
  TypedParam as Param,
  TypedQuery as Query,
  TypedRoute as Route,
} from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IArticle {
  title: string;
  count: number;
}

interface ISearch {
  keyword: string;
}

/**
 * Verifies aliased @nestia/core decorator imports still receive native
 * transform arguments.
 *
 * The TypeScript-side transformer resolved decorator declarations, so local
 * aliases like `TypedBody as Body` were valid. The Go migration has to
 * normalize those aliases before classifying decorator kinds; otherwise the
 * runtime receives undecorated validators and route stringifiers.
 *
 * 1. Import core decorators with local aliases.
 * 2. Compile the controller through the native transform.
 * 3. Assert body, param, query, and route decorators all receive generated
 *    arguments.
 */
@Controller("aliases")
export class AliasController {
  @Route.Post(":id")
  public store(
    @Param("id") id: string,
    @Query() query: ISearch,
    @Body() input: IArticle,
  ): IArticle {
    id;
    query;
    return input;
  }
}
