import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import type { ValidationError } from "../typia-error";

interface TypeGuardError {
  reason: string;
}

@Controller("provenance")
export class ProvenanceController {
  @core.TypedRoute.Get("typia")
  @core.TypedException<ValidationError>(400)
  public typia(): string {
    return "ok";
  }

  @core.TypedRoute.Get("local")
  @core.TypedException<TypeGuardError>(409)
  public local(): string {
    return "ok";
  }
}
