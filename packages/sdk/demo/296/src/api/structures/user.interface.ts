import { IAuthentication } from "./auth.interface";

export interface IUser {
    /**
     * @format uuid
     */
    readonly id: string;
    /**
     * oauth server's user id
     */
    readonly sub: string;
    readonly oauth_type: IUser.OauthType;
    /**
     * @format email
     */
    readonly email: string;
    readonly name: string;
    readonly address: string | null;
    /**
     * @pattern ^010-[0-9]{4}-[0-9]{4}$
     */
    readonly phone: string | null;
    readonly role: IUser.Role;
    readonly is_deleted: boolean;
    /**
     * ISO 8601 type
     * @pattern ^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]).[0-9]{3}Z$
     */
    readonly created_at: string;
    /**
     * ISO 8601 type
     * @pattern ^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]).[0-9]{3}Z$
     */
    readonly updated_at: string;
}

export namespace IUser {
    export type OauthType = "google" | "github";
    export type Role = "normal" | "vender" | "admin";
    export type Public = Pick<IUser, "id" | "name" | "email">;
    export interface Detail extends Omit<IUser, "sub" | "oauth_type"> {}

    export interface CreateInput extends IAuthentication.OauthProfile {}

    export interface UpdateInput
        extends Partial<Pick<IUser, "name" | "address" | "phone">> {}
}
