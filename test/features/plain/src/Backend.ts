import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import core from "@nestia/core";

export class Backend {
    private application_?: INestApplication;

    public async open(): Promise<void> {
        this.application_ = await NestFactory.create(
            await core.EncryptedModule.dynamic(__dirname + "/controllers", {
                key: "A".repeat(32),
                iv: "B".repeat(16),
            }),
            { logger: false },
        );
        await this.application_.listen(37_000);
    }

    public async close(): Promise<void> {
        if (this.application_ === undefined) return;

        const app = this.application_;
        await app.close();

        delete this.application_;
    }
}
