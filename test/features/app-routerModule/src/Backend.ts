import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { ApplicationModule } from "./modules/ApplicationModule";

export class Backend {
    public readonly application: Singleton<Promise<INestApplication>> =
        new Singleton(() =>
            NestFactory.create(ApplicationModule, { logger: false }),
        );

    public async open(): Promise<void> {
        return (await this.application.get()).listen(37_000);
    }

    public async close(): Promise<void> {
        return (await this.application.get()).close();
    }
}
