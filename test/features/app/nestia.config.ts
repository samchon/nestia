import { INestiaConfig } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { ApplicationModule } from "./src/modules/ApplicationModule";

export const NESTIA_CONFIG: INestiaConfig = {
    input: async () => {
        const app: INestApplication = await NestFactory.create(
            ApplicationModule,
            {
                logger: false,
            },
        );
        return app;
    },
    output: "src/api",
    e2e: "src/test",
    swagger: {
        output: "swagger.json",
        security: {
            bearer: {
                type: "apiKey",
            },
        },
    },
};
export default NESTIA_CONFIG;
