import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { Exception } from "../dto/exception.interface";
import { IUser } from "../dto/user.interface";

@nest.Controller("user")
export class UserController {
  /**
   * get authorized user's profile
   *
   * @summary get user's profile
   * @tag user
   * @security bearer
   * @return user profile
   */
  @core.TypedException<Exception.Unauthorized>({
    status: nest.HttpStatus.UNAUTHORIZED,
  })
  @core.TypedRoute.Get("profile")
  async profile(): Promise<IUser.IProfile> {
    return typia.random<IUser.IProfile>();
  }
}
