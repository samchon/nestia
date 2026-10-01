import core from "@nestia/core";
import { Controller, NotFoundException } from "@nestjs/common";

export interface ISdkBoundaryRangeError {
  message: string;
}

@Controller("sdk_boundary/range")
export class SdkBoundaryRangeController {
  @core.TypedException<ISdkBoundaryRangeError>("4XX")
  @core.TypedRoute.Get()
  public get(): string {
    throw new NotFoundException("missing");
  }
}
