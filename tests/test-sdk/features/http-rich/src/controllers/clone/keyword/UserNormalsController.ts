import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { ErrorCode } from "../common/ErrorCode";

@nest.Controller("http_rich/clone/keyword/users")
export class CloneKeywordUsersController {
  /**
   * - When namespaced DTO type comes, `@nestia/sdk` had taken a mistake that
   *   writing only the deepest type even in the top or middle level namespaced
   *   types.
   * - When `clone` mode being used in SDK generator, it was not possible to clone
   *   recursive DTO type.
   */
  @core.TypedException<ErrorCode.NotFound>({
    status: 404,
  })
  @core.TypedRoute.Get(":user_id/oauth")
  public async getOauthProfile(
    @core.TypedParam("user_id") user_id: string,
    @core.TypedQuery() query: CloneKeywordIAuthentication,
  ): Promise<CloneKeywordIAuthentication.IProfile> {
    user_id;
    query;
    return typia.random<CloneKeywordIAuthentication.IProfile>();
  }

  /**
   * - When namespaced DTO type comes, `@nestia/sdk` had taken a mistake that
   *   writing only the deepest type even in the top or middle level namespaced
   *   types.
   * - When propagation mode being used with `@TypedException<T>()` decorator,
   *   target `T` type had not been cloned.
   * - When `clone` mode being used in SDK generator, it was not possible to clone
   *   recursive DTO type.
   * - Check optional query DTO
   * - When use HttpCode decorator, sdk build fail code
   */
  @nest.HttpCode(nest.HttpStatus.ACCEPTED)
  @core.TypedException<ErrorCode.NotFound>(404)
  @core.TypedRoute.Get(":user_id/user")
  public async getUserProfile(
    @core.TypedParam("user_id") user_id: string,
    @core.TypedQuery() query: CloneKeywordIUser.ISearch,
  ): Promise<CloneKeywordIUser> {
    user_id;
    query;
    return typia.random<CloneKeywordIUser>();
  }

  /** - Check optional, nullable property */
  @core.TypedRoute.Post(":user_id/user")
  public async updateUserProfile(
    @core.TypedParam("user_id") user_id: string,
    @core.TypedBody() body: CloneKeywordIUser.IUpdate,
  ): Promise<CloneKeywordIUser> {
    user_id;
    body;
    return typia.random<CloneKeywordIUser>();
  }
}

interface CloneKeywordIAuthentication {
  user_id: string;
  oauth_type: CloneKeywordIAuthentication.OauthType;
}

namespace CloneKeywordIAuthentication {
  export type OauthType = "google" | "github" | "kakao";
  export interface IProfile {
    id: string;
    name: string;
    /** @format email */
    email: string | null;
    oauth_type: OauthType;
  }
}

interface CloneKeywordIUser {
  id: string;
  name: string;
  email: (string & typia.tags.Format<"email">) | null;
  optional_attr?: string;
  undefindable_attr: string | undefined;
  both_optional_and_undefindable?: string | undefined;
  nullable_attr: string | null;
  optional_and_nullable_attr?: number | null;
  user_type: CloneKeywordIUser.Type;
}

namespace CloneKeywordIUser {
  export type Type = "admin" | "default" | "seller";
  /**
   * This type name expected to 'IUpdate', but cloned dto name is
   * 'PartialPickIUsernameemailnullable_attr'
   */
  export type IUpdate = Partial<
    Pick<
      CloneKeywordIUser,
      "name" | "email" | "nullable_attr" | "optional_attr"
    >
  >;
  export interface ISearch {
    user_type?: Type;
  }
}
