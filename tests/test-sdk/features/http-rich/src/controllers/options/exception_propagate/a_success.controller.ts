import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { PropagationErrorCode } from "../../../structures/exception_propagate/PropagationErrorCode";
import { PropagationExceptionFilter } from "./PropagationExceptionFilter";

@nest.UseFilters(PropagationExceptionFilter)
@nest.Controller("http_rich/options/exception_propagate/success")
export class PropagationSuccessController {
  @core.TypedException<PropagationErrorCode.Permission.Invalid>(
    nest.HttpStatus.UNAUTHORIZED,
  )
  @core.TypedRoute.Get()
  async get(): Promise<number> {
    throw new nest.UnauthorizedException("INVALID_PERMISSION");
  }

  @core.TypedException<
    | PropagationErrorCode.Permission.Expired
    | PropagationErrorCode.Permission.Required
  >(nest.HttpStatus.UNAUTHORIZED)
  @core.TypedRoute.Get(":error_type")
  async union(
    @core.TypedParam("error_type")
    error_type:
      | PropagationErrorCode.Permission.Expired
      | PropagationErrorCode.Permission.Required,
  ): Promise<number> {
    throw new nest.UnauthorizedException(error_type);
  }
}
