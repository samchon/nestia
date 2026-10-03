import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

@Controller("http_rich/options/clone_shapes/base")
export class CloneShapesBaseAppController {
  @TypedRoute.Get()
  getHello(): CloneShapesBaseGetHelloResponseDto {
    return typia.random<CloneShapesBaseGetHelloResponseDto>();
  }
}

interface CloneShapesBaseMessage {
  type: 0 | 1;
  payload?: string;
}

interface CloneShapesBaseGetHelloResponseDto {
  messages?:
    | Array<CloneShapesBaseMessage>
    | Readonly<Array<CloneShapesBaseMessage>>;
}
