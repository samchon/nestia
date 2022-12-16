import helper from "@nestia/core";
import * as nest from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { Configuration } from "./Configuration";

export class Backend {
    private application_?: nest.INestApplication;

    public async open(): Promise<void> {
        this.application_ = await NestFactory.create(
            await helper.EncryptedModule.dynamic(
                __dirname,
                Configuration.ENCRYPTION_PASSWORD,
            ),
            { logger: false },
        );
        await this.application_.listen(Configuration.PORT);
    }

    public async close(): Promise<void> {
        if (this.application_ === undefined) return;

        const app = this.application_;
        delete this.application_;
        await app.close();
    }
}
