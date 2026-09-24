import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import {
  DomainError,
  GoneError,
  NotFoundError,
  OtherError,
} from "../DomainErrors";

@Controller("errors")
export class DomainErrorController {
  @core.TypedRoute.Get("domain")
  public domain(): void {
    throw new DomainError();
  }

  @core.TypedRoute.Get("other")
  public other(): void {
    throw new OtherError();
  }

  @core.TypedRoute.Get("notFound")
  public notFound(): void {
    throw new NotFoundError();
  }

  @core.TypedRoute.Get("gone")
  public gone(): void {
    throw new GoneError();
  }
}
