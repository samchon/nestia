import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

@Controller()
export class AppController {
  @TypedRoute.Get()
  getHello(): GetHelloResponseDto {
    return typia.random<GetHelloResponseDto>();
  }
}

interface Message {
  type: 0 | 1;
  payload?: string;
}

interface GetHelloResponseDto {
  messages?: Array<Message> | Readonly<Array<Message>>;
}
