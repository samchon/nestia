import { Controller, Get } from "@nestjs/common";

import core from "@nestia/core";

@Controller("headers")
export class HeadersController {
    @Get()
    public headers(@core.TypedHeaders() headers: IHeaders[]): IHeaders[] {
        return headers;
    }
}
