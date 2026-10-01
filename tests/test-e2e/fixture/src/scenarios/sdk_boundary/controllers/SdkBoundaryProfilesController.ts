import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { SdkBoundaryProfileErrorCode } from "./SdkBoundaryProfileErrorCode";

@nest.Controller("sdk_boundary/profiles")
export class SdkBoundaryProfilesController {
  /**
   * - When namespaced DTO type comes, `@nestia/sdk` had taken a mistake that
   *   writing only the deepest type even in the top or middle level namespaced
   *   types.
   * - When `clone` mode being used in SDK generator, it was not possible to clone
   *   recursive DTO type.
   */
  @core.TypedException<SdkBoundaryProfileErrorCode.NotFound>(404)
  @core.TypedRoute.Get(":user_id/oauth")
  public async getOauthProfile(
    @core.TypedParam("user_id") user_id: string,
    @core.TypedQuery() query: ISdkBoundaryAuthentication,
  ): Promise<ISdkBoundaryAuthentication.IProfile> {
    user_id;
    query;
    return typia.random<ISdkBoundaryAuthentication.IProfile>();
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
  @core.TypedException<SdkBoundaryProfileErrorCode.NotFound>(404)
  @core.TypedRoute.Get(":user_id/user")
  public async getUserProfile(
    @core.TypedParam("user_id") user_id: string,
    @core.TypedQuery() query: ISdkBoundaryUser.ISearch,
  ): Promise<ISdkBoundaryUser> {
    user_id;
    query;
    return typia.random<ISdkBoundaryUser>();
  }

  /** - Check optional, nullable property */
  @core.TypedRoute.Post(":user_id/user")
  public async updateUserProfile(
    @core.TypedParam("user_id") user_id: string,
    @core.TypedBody() body: ISdkBoundaryUser.IUpdate,
  ): Promise<ISdkBoundaryUser> {
    user_id;
    body;
    return typia.random<ISdkBoundaryUser>();
  }
}

interface ISdkBoundaryAuthentication {
  user_id: string;
  oauth_type: ISdkBoundaryAuthentication.OauthType;
}

namespace ISdkBoundaryAuthentication {
  export type OauthType = "google" | "github" | "kakao";
  export interface IProfile {
    id: string;
    name: string;
    /** @format email */
    email: string | null;
    oauth_type: OauthType;
  }
}

interface ISdkBoundaryUser {
  id: string;
  name: string;
  email: (string & typia.tags.Format<"email">) | null;
  optional_attr?: string;
  undefindable_attr: string | undefined;
  both_optional_and_undefindable?: string | undefined;
  nullable_attr: string | null;
  optional_and_nullable_attr?: number | null;
  user_type: ISdkBoundaryUser.Type;
}

namespace ISdkBoundaryUser {
  export type Type = "admin" | "default" | "seller";
  /**
   * This type name expected to 'IUpdate', but cloned dto name is
   * 'PartialPickISdkBoundaryUsernameemailnullable_attr'
   */
  export type IUpdate = Partial<
    Pick<ISdkBoundaryUser, "name" | "email" | "nullable_attr" | "optional_attr">
  >;
  export interface ISearch {
    user_type?: Type;
  }
}
