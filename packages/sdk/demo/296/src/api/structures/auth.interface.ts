import { IUser } from "./user.interface";

export namespace IAuthentication {
    export type OauthProfile = Pick<
        IUser,
        "sub" | "oauth_type" | "email" | "name"
    >;
    export type AccessTokenPayload = Pick<IUser, "id" | "role">;
    export type RefreshTokenPayload = Pick<IUser, "id">;
    export type IdTokenPayload = IUser.Detail;

    export interface SignInBody {
        readonly oauth_type: IUser.OauthType;
        readonly code: string;
    }

    export interface Credentials {
        readonly access_token: string;
        readonly refresh_token: string;
        readonly id_token: string;
    }
    export interface RefreshedCredential {
        readonly access_token: string;
    }
}
