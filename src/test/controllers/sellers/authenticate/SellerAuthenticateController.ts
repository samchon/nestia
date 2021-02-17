import * as express from "express";
import * as nest from "@nestjs/common";
import * as helper from "encrypted-nestjs";

import { ISeller } from "../../../../../api/structures/actors/ISeller";

@nest.Controller("markets/sellers/authenticate")
export class SellerAuthenticateController
{
    @helper.EncryptedRoute.Post("join")
    public async join
        (
            @helper.EncryptedBody() input: ISeller.IJoin
        ): Promise<ISeller>
    {
        input;
        return null!;
    }

    @helper.EncryptedRoute.Post("login")
    public async login
        (
            @helper.EncryptedBody() input: ISeller.ILogin
        ): Promise<ISeller>
    {
        input;
        return null!;
    }

    @helper.EncryptedRoute.Patch("password/change")
    public async change
        (
            @nest.Request() httpReq: express.Request,
            @helper.EncryptedBody() input: ISeller.IChangePassword
        ): Promise<object>
    {
        httpReq;
        input;
        return {};
    }
}