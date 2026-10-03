import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { CloneDuplicateException } from "../../../structures/clone_duplicate/CloneDuplicateException";
import { CloneDuplicateIUser } from "../../../structures/clone_duplicate/CloneDuplicateIUser";

@nest.Controller("http_rich/options/clone_duplicate/user")
export class CloneDuplicateUserController {
  /**
   * Get authorized user's profile
   *
   * @returns User profile
   * @summary get user's profile
   * @tag user
   * @security bearer
   */
  @core.TypedException<CloneDuplicateException.Unauthorized>({
    status: nest.HttpStatus.UNAUTHORIZED,
  })
  @core.TypedRoute.Get("profile")
  async profile(): Promise<CloneDuplicateIUser.IProfile> {
    return typia.random<CloneDuplicateIUser.IProfile>();
  }
}
