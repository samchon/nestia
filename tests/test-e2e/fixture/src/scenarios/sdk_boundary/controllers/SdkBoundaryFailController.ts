import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { SdkBoundaryPermissionFilter } from "../filters/SdkBoundaryPermissionFilter";
import { SdkBoundaryErrorCode } from "../structures/SdkBoundaryErrorCode";

@nest.UseFilters(SdkBoundaryPermissionFilter)
@nest.Controller("sdk_boundary/permission/fail")
export class SdkBoundaryFailController {
  @core.TypedException<
    | SdkBoundaryErrorCode.Permission.Expired
    | SdkBoundaryErrorCode.Permission.Invalid
  >(nest.HttpStatus.UNAUTHORIZED)
  @core.TypedRoute.Get(":error_type")
  async get(
    @core.TypedParam("error_type")
    error_type:
      | SdkBoundaryErrorCode.Permission.Expired
      | SdkBoundaryErrorCode.Permission.Invalid,
  ): Promise<number> {
    throw new nest.UnauthorizedException(error_type);
  }

  @core.TypedException<
    | SdkBoundaryErrorCode.Permission.Expired
    | SdkBoundaryErrorCode.Permission.Invalid
    | SdkBoundaryErrorCode.Permission.Required
  >(nest.HttpStatus.UNAUTHORIZED)
  @core.TypedRoute.Get("composite/:error_type")
  async composite(
    @core.TypedParam("error_type")
    error_type:
      | SdkBoundaryErrorCode.Permission.Expired
      | SdkBoundaryErrorCode.Permission.Invalid
      | SdkBoundaryErrorCode.Permission.Required,
  ): Promise<number> {
    throw new nest.UnauthorizedException(error_type);
  }
}
