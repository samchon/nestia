import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IArticle {
  id: string;
  weak: WeakMap<object, object>;
}

@Controller("llm/route")
export class LlmRouteController {
  @TypedRoute.Get()
  public at(): IArticle {
    return {
      id: "id",
      weak: new WeakMap(),
    };
  }
}
