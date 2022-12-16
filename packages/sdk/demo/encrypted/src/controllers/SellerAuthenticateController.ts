import core from "@nestia/core";
import * as nest from "@nestjs/common";
import type express from "express";

import { ISeller } from "../api/structures/ISeller";

@nest.Controller("sellers/authenticate")
export class SellerAuthenticateController {
    /**
     * Join as a seller.
     *
     * @param input Information of yours
     * @return Information of newly joined seller
     */
    @core.EncryptedRoute.Post("join")
    public async join(
        @core.EncryptedBody() input: ISeller.IJoin,
    ): Promise<ISeller> {
        return {
            id: 0,
            email: input.email,
            name: input.name,
            mobile: input.mobile,
            company: input.company,
            created_at: new Date().toString(),
        };
    }

    /**
     * Log-in as a seller.
     *
     * @param input Email and password
     * @return Information of the seller
     */
    @core.EncryptedRoute.Post("login")
    public async login(
        @core.EncryptedBody() input: ISeller.ILogin,
    ): Promise<ISeller> {
        return {
            id: 0,
            email: input.email,
            mobile: "01012345678",
            name: "John Doe",
            company: "ABC Company",
            created_at: new Date().toString(),
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
        @nest.Request() _httpReq: express.Request,
        @core.EncryptedBody() input: ISeller.IChangePassword,
    ): Promise<void> {
        input;
    }

    /**
     * Erase the seller by itself.
     */
    @nest.Delete("exit")
    public async exit(
        @nest.Request() _httpReq: express.Request,
    ): Promise<void> {}
}
