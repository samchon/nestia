import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { ErrorCode } from "./ErrorCode";

@nest.Controller("users")
export class UsersController {
    /**
     * - When namespaced DTO type comes, `@nestia/sdk` had taken a mistake that writing only the deepest type even in the top or middle level namespaced types.
     * - When `clone` mode being used in SDK generator, it was not possible to clone recursive DTO type.
     */
    @core.TypedException<ErrorCode.NotFound>(404)
    @core.TypedRoute.Get(":user_id/oauth")
    public async getOauthProfile(
        @core.TypedParam("user_id") user_id: string,
        @core.TypedQuery() query: IAuthentication,
    ): Promise<IAuthentication.IProfile> {
        user_id;
        query;
        return typia.random<IAuthentication.IProfile>();
    }

    /**
     * - When namespaced DTO type comes, `@nestia/sdk` had taken a mistake that writing only the deepest type even in the top or middle level namespaced types.
     * - When propagation mode being used with `@TypedException<T>()` decorator, target `T` type had not been cloned.
     * - When `clone` mode being used in SDK generator, it was not possible to clone recursive DTO type.
     * - check optional query DTO
     * - when use HttpCode decorator, sdk build fail code
     */
    @nest.HttpCode(nest.HttpStatus.ACCEPTED)
    @core.TypedException<ErrorCode.NotFound>(404)
    @core.TypedRoute.Get(":user_id/user")
    public async getUserProfile(
        @core.TypedParam("user_id") user_id: string,
        @core.TypedQuery() query: IUser.ISearch,
    ): Promise<IUser> {
        user_id;
        query;
        return typia.random<IUser>();
    }

    /**
     * - check optional, nullable property
     */
    @core.TypedRoute.Post(":user_id/user")
    public async updateUserProfile(
        @core.TypedParam("user_id") user_id: string,
        @core.TypedBody() body: IUser.IUpdate,
    ): Promise<IUser> {
        user_id;
        body;
        return typia.random<IUser>();
    }
}

interface IAuthentication {
    user_id: string;
    oauth_type: IAuthentication.OauthType;
}

namespace IAuthentication {
    export type OauthType = "google" | "github" | "kakao";
    export interface IProfile {
        id: string;
        name: string;
        /** @format email */
        email: string | null;
        oauth_type: OauthType;
    }
}

interface IUser {
    id: string;
    name: string;
    email: (string & typia.tags.Format<"email">) | null;
    optional_attr?: string;
    undefindable_attr: string | undefined;
    both_optional_and_undefindable?: string | undefined;
    nullable_attr: string | null;
    optional_and_nullable_attr?: number | null;
    user_type: IUser.Type;
}

namespace IUser {
    export type Type = "admin" | "default" | "seller";
    /**
     * this type name expected to 'IUpdate', but cloned dto name is 'PartialPickIUsernameemailnullable_attr'
     */
    export type IUpdate = Partial<
        Pick<IUser, "name" | "email" | "nullable_attr" | "optional_attr">
    >;
    export interface ISearch {
        user_type?: Type;
    }
}
