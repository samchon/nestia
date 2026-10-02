import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IArticle {
  title: string;
  thumbnail?: string;
}

@Controller("llm/body")
export class LlmBodyController {
  @TypedRoute.Post()
  public store(@TypedBody() input: IArticle): void {
    input;
  }
}
