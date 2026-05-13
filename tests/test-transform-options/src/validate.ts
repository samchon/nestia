import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import type { tags } from "typia";

interface IArticle {
  id?: string & tags.Format<"uuid">;
  title: string;
  count: number;
}

@Controller("validate")
export class ValidateController {
  @TypedRoute.Post(":id")
  public create(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() input: IArticle,
  ): IArticle {
    return {
      ...input,
      id,
    };
  }
}
