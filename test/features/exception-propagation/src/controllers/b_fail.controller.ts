import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { ErrorCode } from "../structures/ErrorCode";

@nest.Controller("fail")
export class FailController {
    @core.TypedException<
        ErrorCode.Permission.Expired | ErrorCode.Permission.Invalid
    >(nest.HttpStatus.UNAUTHORIZED)
    @core.TypedRoute.Get(":error_type")
    async get(
        @core.TypedParam("error_type")
        error_type: ErrorCode.Permission.Expired | ErrorCode.Permission.Invalid,
    ): Promise<number> {
        throw new nest.UnauthorizedException(error_type);
    }

    @core.TypedException<
        | ErrorCode.Permission.Expired
        | ErrorCode.Permission.Invalid
        | ErrorCode.Permission.Required
    >(nest.HttpStatus.UNAUTHORIZED)
    @core.TypedRoute.Get("composite/:error_type")
    async composite(
        @core.TypedParam("error_type")
        error_type:
            | ErrorCode.Permission.Expired
            | ErrorCode.Permission.Invalid
            | ErrorCode.Permission.Required,
    ): Promise<number> {
        throw new nest.UnauthorizedException(error_type);
    }
}
