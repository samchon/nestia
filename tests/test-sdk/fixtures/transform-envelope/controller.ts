import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import type { IEnvelopeArticle } from "./dto.js";

@Controller("envelope")
export class EnvelopeController {
  @TypedRoute.Post()
  public store(@TypedBody() input: IEnvelopeArticle): IEnvelopeArticle {
    return input;
  }
}
