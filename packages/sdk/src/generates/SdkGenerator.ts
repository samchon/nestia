import fs from "fs";
import NodePath from "path";
import { IPointer } from "tstl";
import ts from "typescript";

import { INestiaConfig } from "../INestiaConfig";
import { IRoute } from "../structures/IRoute";
import { SdkDistributionComposer } from "./internal/SdkDistributionComposer";
import { SdkDtoGenerator } from "./internal/SdkDtoGenerator";
import { SdkFileProgrammer } from "./internal/SdkFileProgrammer";

export namespace SdkGenerator {
    export const generate =
        (checker: ts.TypeChecker) =>
        (config: INestiaConfig) =>
        async (routes: IRoute[]): Promise<void> => {
            console.log("Generating SDK Library");

            // PREPARE NEW DIRECTORIES
            try {
                await fs.promises.mkdir(config.output!);
            } catch {}

            // BUNDLING
            const bundle: string[] = await fs.promises.readdir(BUNDLE_PATH);
            for (const file of bundle) {
                const current: string = `${BUNDLE_PATH}/${file}`;
                const target: string = `${config.output}/${file}`;
                const stats: fs.Stats = await fs.promises.stat(current);

                if (stats.isFile() === true) {
                    const content: string = await fs.promises.readFile(
                        current,
                        "utf8",
                    );
                    if (fs.existsSync(target) === false)
                        await fs.promises.writeFile(target, content, "utf8");
                    else if (BUNDLE_CHANGES[file] !== undefined) {
                        const r: IPointer<string> = {
                            value: await fs.promises.readFile(target, "utf8"),
                        };
                        for (const [before, after] of BUNDLE_CHANGES[file])
                            r.value = r.value.replace(before, after);
                        await fs.promises.writeFile(target, r.value, "utf8");
                    }
                }
            }
            if (
                config.simulate === true &&
                routes.some((r) => !!r.parameters.length)
            ) {
                try {
                    await fs.promises.mkdir(`${config.output}/utils`);
                } catch {}
                await fs.promises.copyFile(
                    `${BUNDLE_PATH}/utils/NestiaSimulator.ts`,
                    `${config.output}/utils/NestiaSimulator.ts`,
                );
            }

            // STRUCTURES
            if (config.clone)
                await SdkDtoGenerator.generate(checker)(config)(routes);

            // FUNCTIONAL
            await SdkFileProgrammer.generate(config)(routes);

            // DISTRIBUTION
            if (config.distribute !== undefined)
                await SdkDistributionComposer.compose(config);
        };

    export const BUNDLE_PATH = NodePath.join(
        __dirname,
        "..",
        "..",
        "assets",
        "bundle",
        "api",
    );
}

const BUNDLE_CHANGES: Record<string, [string, string][]> = {
    "IConnection.ts": [
        [
            `export { IConnection } from "@nestia/fetcher"`,
            `export type { IConnection } from "@nestia/fetcher"`,
        ],
    ],
    "module.ts": [
        [`export * from "./IConnection"`, `export type * from "./IConnection"`],
        [`export * from "./Primitive"`, `export type * from "./Primitive"`],
    ],
    "Primitive.ts": [
        [
            `export { Primitive } from "@nestia/fetcher"`,
            `export type { Primitive } from "@nestia/fetcher"`,
        ],
    ],
};
