import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { IAuth } from "../dto/auth.interface";
import { Exception } from "../dto/exception.interface";

@nest.Controller("auth")
export class AuthController {
  /**
   * 계정 프로필 정보 불러오기
   *
   * @summary get account profile
   * @tag auth
   * @param body account_token
   */
  @core.TypedException<Exception.Unauthorized>({
    status: nest.HttpStatus.UNAUTHORIZED,
  })
  @core.TypedRoute.Get("account")
  async account(): Promise<IAuth.IAccount> {
    return typia.random<IAuth.IAccount>();
  }
}
