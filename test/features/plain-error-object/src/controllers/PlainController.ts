import { Controller, Post, Header } from "@nestjs/common";

import core from "@nestia/core";
import { ISomething } from "../api/structures/ISomething";

@Controller("plain")
export class PlainController {
    @Header("Content-Type", "text/plain")
    @Post()
    public async send(@core.PlainBody() body: ISomething): Promise<string> {
        return JSON.stringify(body);
    }
}
