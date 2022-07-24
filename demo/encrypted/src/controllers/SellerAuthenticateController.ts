import express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { ISeller } from "../api/structures/ISeller";

@nest.Controller("sellers/authenticate")
export class SellerAuthenticateController {
    /**
     * Join as a seller.
     *
     * @param input Information of yours
     * @return Information of newly joined seller
     */
    @helper.EncryptedRoute.Post("join")
    public async join(
        @helper.EncryptedBody() input: ISeller.IJoin,
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
    @helper.EncryptedRoute.Post("login")
    public async login(
        @helper.EncryptedBody() input: ISeller.ILogin,
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
        @helper.EncryptedBody() input: ISeller.IChangePassword,
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
