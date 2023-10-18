import { INestApplication, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { ApplicationModule } from "./modules/ApplicationModule";

export class Backend {
    public readonly application: Singleton<Promise<INestApplication>> =
        new Singleton(async () => {
            const app: INestApplication = await NestFactory.create(
                ApplicationModule,
                { logger: false },
            );
            await app.setGlobalPrefix("api");
            await app.enableVersioning({
                type: VersioningType.URI,
                prefix: "v",
                defaultVersion: ["1", "2", "3"],
            });
            return app;
        });

    public async open(): Promise<void> {
        return (await this.application.get()).listen(37_000);
    }

    public async close(): Promise<void> {
        return (await this.application.get()).close();
    }
}
