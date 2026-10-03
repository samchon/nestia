import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IRequestDto } from "../../structures/non_equals/IRequestDto";

@Controller("http_rich/non_equals/request")
export class NonEqualsRequestController {
  @TypedRoute.Post()
  public request(@TypedBody() input: IRequestDto): IRequestDto {
    return input;
  }
}
