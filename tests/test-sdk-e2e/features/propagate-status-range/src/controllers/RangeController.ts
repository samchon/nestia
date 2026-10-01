import core from "@nestia/core";
import { Controller, NotFoundException } from "@nestjs/common";

export interface IRangeError {
  message: string;
}

@Controller("range")
export class RangeController {
  @core.TypedException<IRangeError>("4XX")
  @core.TypedRoute.Get()
  public get(): string {
    throw new NotFoundException("missing");
  }
}
