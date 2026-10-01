import { Controller, Head, Header, Options } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../api/structures/IBbsArticle";

@Controller("method")
export class MethodController {
  @Head("response")
  public response(): IBbsArticle {
    return typia.random<IBbsArticle>();
  }
}
