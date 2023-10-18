import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

export class Backend {
    public readonly application: Singleton<Promise<INestApplication>> =
        new Singleton(async () =>
            NestFactory.create(
                await core.EncryptedModule.dynamic(__dirname + "/controllers", {
                    key: "A".repeat(32),
                    iv: "B".repeat(16),
                }),
                { logger: false },
            ),
        );

    public async open(): Promise<void> {
        return (await this.application.get()).listen(37_000);
    }

    public async close(): Promise<void> {
        return (await this.application.get()).close();
    }
}
