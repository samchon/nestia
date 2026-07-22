import {
  TypedBody,
  TypedHeaders,
  TypedParam,
  TypedQuery,
  TypedRoute,
} from "@nestia/core";
import { Controller } from "@nestjs/common";
import type { tags } from "typia";

interface IArticle {
  id?: string & tags.Format<"uuid">;
  title: string;
  count: number;
}

interface ISearch {
  keyword?: string;
}

interface IHeaders {
  title: string;
  count: number;
}

@Controller("validate")
export class ValidateController {
  @TypedRoute.Post(":id")
  public create(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedQuery() query: ISearch,
    @TypedBody() input: IArticle,
  ): IArticle {
    query;
    return {
      ...input,
      id,
    };
  }

  @TypedRoute.Post("headers")
  public headers(@TypedHeaders() headers: IHeaders): IHeaders {
    return headers;
  }
}
