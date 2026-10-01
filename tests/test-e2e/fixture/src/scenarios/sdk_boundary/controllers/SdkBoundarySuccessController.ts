import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { SdkBoundaryPermissionFilter } from "../filters/SdkBoundaryPermissionFilter";
import { SdkBoundaryErrorCode } from "../structures/SdkBoundaryErrorCode";

@nest.UseFilters(SdkBoundaryPermissionFilter)
@nest.Controller("sdk_boundary/permission/success")
export class SdkBoundarySuccessController {
  @core.TypedException<SdkBoundaryErrorCode.Permission.Invalid>(
    nest.HttpStatus.UNAUTHORIZED,
  )
  @core.TypedRoute.Get()
  async get(): Promise<number> {
    throw new nest.UnauthorizedException("INVALID_PERMISSION");
  }

  @core.TypedException<
    | SdkBoundaryErrorCode.Permission.Expired
    | SdkBoundaryErrorCode.Permission.Required
  >(nest.HttpStatus.UNAUTHORIZED)
  @core.TypedRoute.Get(":error_type")
  async union(
    @core.TypedParam("error_type")
    error_type:
      | SdkBoundaryErrorCode.Permission.Expired
      | SdkBoundaryErrorCode.Permission.Required,
  ): Promise<number> {
    throw new nest.UnauthorizedException(error_type);
  }
}
