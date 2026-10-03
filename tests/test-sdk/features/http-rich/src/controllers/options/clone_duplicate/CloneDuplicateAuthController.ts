import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { CloneDuplicateException } from "../../../structures/clone_duplicate/CloneDuplicateException";
import { CloneDuplicateIAuth } from "../../../structures/clone_duplicate/CloneDuplicateIAuth";

@nest.Controller("http_rich/options/clone_duplicate/auth")
export class CloneDuplicateAuthController {
  /**
   * 계정 프로필 정보 불러오기
   *
   * @param body Account_token
   * @summary get account profile
   * @tag auth
   */
  @core.TypedException<CloneDuplicateException.Unauthorized>({
    status: nest.HttpStatus.UNAUTHORIZED,
  })
  @core.TypedRoute.Get("account")
  async account(): Promise<CloneDuplicateIAuth.IAccount> {
    return typia.random<CloneDuplicateIAuth.IAccount>();
  }
}
