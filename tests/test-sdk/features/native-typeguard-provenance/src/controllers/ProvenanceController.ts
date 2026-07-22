import core from "@nestia/core";
import { Controller } from "@nestjs/common";

interface TypeGuardError {
  reason: string;
}

@Controller("provenance")
export class ProvenanceController {
  @core.TypedRoute.Get("local")
  @core.TypedException<TypeGuardError>(409)
  public local(): string {
    return "ok";
  }
}
