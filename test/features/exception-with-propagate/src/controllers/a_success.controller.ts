import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { HttpExceptionFilter } from "../filters/HttpExceptionFilter";
import { ErrorCode } from "../structures/ErrorCode";

@nest.UseFilters(HttpExceptionFilter)
@nest.Controller("success")
export class SuccessController {
    @core.TypedException<ErrorCode.Permission.Invalid>(
        nest.HttpStatus.UNAUTHORIZED,
    )
    @core.TypedRoute.Get()
    async get(): Promise<number> {
        throw new nest.UnauthorizedException("INVALID_PERMISSION");
    }

    @core.TypedException<
        ErrorCode.Permission.Expired | ErrorCode.Permission.Required
    >(nest.HttpStatus.UNAUTHORIZED)
    @core.TypedRoute.Get(":error_type")
    async union(
        @core.TypedParam("error_type")
        error_type:
            | ErrorCode.Permission.Expired
            | ErrorCode.Permission.Required,
    ): Promise<number> {
        throw new nest.UnauthorizedException(error_type);
    }
}
