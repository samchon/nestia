import core from "@nestia/core";
import { Controller, Get } from "@nestjs/common";

import { IHeaders } from "../api/structures/IHeaders";

@Controller("headers")
export class HeadersController {
    @Get()
    public headers(@core.TypedHeaders() headers: IHeaders): IHeaders {
        return headers;
    }
}
