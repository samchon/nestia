import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia, { tags } from "typia";

@nest.Controller("sellers/authenticate")
export class SellerAuthenticateController {
    /**
     * Join as a seller.
     *
     * @param input Information of yours
     * @return Information of newly joined seller
     * @setHeader authorization.token Authorization
     */
    @core.EncryptedRoute.Post("join")
    public async join(
        @core.EncryptedBody() input: ISeller.IJoin,
    ): Promise<ISeller.IAuthorized> {
        return {
            ...typia.random<ISeller.IAuthorized>(),
            email: input.email,
            name: input.name,
            mobile: input.mobile,
            company: input.company,
        };
    }

    /**
     * Log-in as a seller.
     *
     * @param input Email and password
     * @return Information of the seller
     * @assignHeaders authorization
     */
    @core.EncryptedRoute.Post("login")
    public async login(
        @core.EncryptedBody() input: ISeller.ILogin,
    ): Promise<ISeller.IAuthorized> {
        return {
            ...typia.random<ISeller.IAuthorized>(),
            email: input.email,
        };
    }

    /**
     * Change password.
     *
     * @param input Old and new passwords
     * @return Empty object
     */
    @nest.Patch("password/change")
    public async change(
        @core.EncryptedBody() input: ISeller.IChangePassword,
    ): Promise<void> {
        input;
    }

    /**
     * Erase the seller by itself.
     */
    @nest.Delete("exit")
    public async exit(): Promise<void> {}
}

/**
 * Seller information.
 */
interface ISeller {
    /**
     * Primary key.
     */
    id: number & tags.Type<"uint32">;

    /**
     * Email address.
     */
    email: string & tags.Format<"email">;

    /**
     * Name of the seller.
     */
    name: string;

    /**
     * Mobile number of the seller.
     */
    mobile: string;

    /**
     * Belonged company name.
     */
    company: string;

    /**
     * Joined time.
     */
    created_at: string & tags.Format<"date-time">;
}

export namespace ISeller {
    export interface ILogin {
        email: string & tags.Format<"email">;
        password: string;
    }

    export interface IJoin {
        email: string & tags.Format<"email">;
        password: string;
        name: string;
        mobile: string;
        company: string;
    }

    export interface IChangePassword {
        old_password: string;
        new_password: string;
    }

    export interface IAuthorized extends ISeller {
        authorization: {
            token: string;
            expires_at: string & tags.Format<"date-time">;
        };
    }
}
