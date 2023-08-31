import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { ISeller } from "@api/lib/structures/ISeller";

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
