import fs from "fs";
import path from "path";

import { INestiaConfig } from "../INestiaConfig";
import { ConfigAnalyzer } from "../analyses/ConfigAnalyzer";
import { IRoute } from "../structures/IRoute";
import { E2eFileProgrammer } from "./internal/E2eFileProgrammer";

export namespace E2eGenerator {
    export const generate =
        (config: INestiaConfig) =>
        async (routeList: IRoute[]): Promise<void> => {
            console.log("Generating E2E Test Functions");

            // PREPARE DIRECTORIES
            const output: string = path.resolve(config.e2e!);
            await mkdir(output);
            await mkdir(path.join(output, "features"));
            await mkdir(path.join(output, "features", "api"));
            await mkdir(path.join(output, "features", "api", "automated"));

            // GENERATE TEST INDEX FILE
            await index(config)(path.join(config.e2e!, "index.ts"));

            // GENERATE EACH TEST FILES
            for (const route of routeList)
                await E2eFileProgrammer.generate(config)({
                    api: path.resolve(config.output!),
                    current: path.join(output, "features", "api", "automated"),
                })(route);
        };

    const index =
        (config: INestiaConfig) =>
        async (output: string): Promise<void> => {
            if (fs.existsSync(output)) return;

            const location: string = path.join(
                __dirname,
                "..",
                "..",
                "assets",
                "bundle",
                "e2e",
                "index.ts",
            );
            const content: string = await fs.promises.readFile(
                location,
                "utf8",
            );

            await fs.promises.writeFile(
                output,
                content.replace(
                    "${input}",
                    JSON.stringify(await ConfigAnalyzer.input(config)),
                ),
                "utf8",
            );
        };
}

const mkdir = async (location: string): Promise<void> => {
    try {
        await fs.promises.mkdir(location);
    } catch {}
};
