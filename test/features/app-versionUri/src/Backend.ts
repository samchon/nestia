import { INestApplication, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { ApplicationModule } from "./modules/ApplicationModule";

export class Backend {
    public readonly application: Singleton<Promise<INestApplication>> =
        new Singleton(async () => {
            const app = await NestFactory.create(ApplicationModule);
            app.enableVersioning({
                type: VersioningType.URI,
                prefix: "v",
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
