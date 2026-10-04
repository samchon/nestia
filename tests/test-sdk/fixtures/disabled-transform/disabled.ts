import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IArticle {
  title: string;
  count: number;
}

@Controller("disabled")
export class DisabledController {
  @TypedRoute.Get()
  public get(): IArticle {
    return {
      title: "title",
      count: 1,
    };
  }

  @TypedRoute.Post()
  public post(@TypedBody() input: IArticle): IArticle {
    return input;
  }
}
