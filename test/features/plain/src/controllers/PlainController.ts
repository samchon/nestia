import { Controller, Post, Header } from "@nestjs/common";

import core from "@nestia/core";

@Controller("plain")
export class PlainController {
    @Header("Content-Type", "text/plain")
    @Post()
    public async send(@core.PlainBody() body: string): Promise<string> {
        return body;
    }
}
