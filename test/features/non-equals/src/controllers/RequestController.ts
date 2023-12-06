import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IRequestDto } from "@api/lib/structures/IRequestDto";

@Controller("request")
export class RequestController {
  @TypedRoute.Post()
  public request(@TypedBody() input: IRequestDto): IRequestDto {
    return input;
  }
}
