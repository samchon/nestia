import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { PropagationErrorCode } from "../../../structures/exception_propagate/PropagationErrorCode";
import { PropagationExceptionFilter } from "./PropagationExceptionFilter";

@nest.UseFilters(PropagationExceptionFilter)
@nest.Controller("http_rich/options/exception_propagate/fail")
export class PropagationFailController {
  @core.TypedException<
    | PropagationErrorCode.Permission.Expired
    | PropagationErrorCode.Permission.Invalid
  >(nest.HttpStatus.UNAUTHORIZED)
  @core.TypedRoute.Get(":error_type")
  async get(
    @core.TypedParam("error_type")
    error_type:
      | PropagationErrorCode.Permission.Expired
      | PropagationErrorCode.Permission.Invalid,
  ): Promise<number> {
    throw new nest.UnauthorizedException(error_type);
  }

  @core.TypedException<
    | PropagationErrorCode.Permission.Expired
    | PropagationErrorCode.Permission.Invalid
    | PropagationErrorCode.Permission.Required
  >(nest.HttpStatus.UNAUTHORIZED)
  @core.TypedRoute.Get("composite/:error_type")
  async composite(
    @core.TypedParam("error_type")
    error_type:
      | PropagationErrorCode.Permission.Expired
      | PropagationErrorCode.Permission.Invalid
      | PropagationErrorCode.Permission.Required,
  ): Promise<number> {
    throw new nest.UnauthorizedException(error_type);
  }
}
