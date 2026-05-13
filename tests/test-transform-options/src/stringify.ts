import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import type { tags } from "typia";

interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
  count: number;
}

@Controller("stringify")
export class StringifyController {
  @TypedRoute.Get()
  public get(): IArticle {
    return {
      id: "00000000-0000-4000-8000-000000000000",
      title: "title",
      count: 1,
    };
  }
}
