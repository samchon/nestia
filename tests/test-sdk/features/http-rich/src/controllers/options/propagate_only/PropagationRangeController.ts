import core from "@nestia/core";
import { Controller, NotFoundException } from "@nestjs/common";

export interface PropagationRangeError {
  message: string;
}

@Controller("http_rich/options/propagate_only/range")
export class PropagationRangeController {
  @core.TypedException<PropagationRangeError>("4XX")
  @core.TypedRoute.Get()
  public get(): string {
    throw new NotFoundException("missing");
  }
}
