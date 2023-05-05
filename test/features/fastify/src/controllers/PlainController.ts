import { Controller, Post } from "@nestjs/common";

import core from "@nestia/core";

@Controller("plain")
export class PlainController {
    @Post()
    public async send(@core.PlainBody() body: string): Promise<string> {
        return body;
    }
}
