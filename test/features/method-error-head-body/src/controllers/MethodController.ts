import core from "@nestia/core";
import { Controller, Head } from "@nestjs/common";

import { IBbsArticle } from "../../api/structures/IBbsArticle";

@Controller("method")
export class MethodController {
  @Head("body")
  public body(@core.TypedBody() input: IBbsArticle.IStore): void {
    input;
  }
}
