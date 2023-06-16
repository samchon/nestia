import fs from "fs";
import NodePath from "path";

import { INestiaConfig } from "../INestiaConfig";
import { IRoute } from "../structures/IRoute";
import { DistributionComposer } from "./internal/DistributionComposer";
import { SdkFileProgrammer } from "./internal/SdkFileProgrammer";

export namespace SdkGenerator {
    export const generate =
        (config: INestiaConfig) =>
        async (routes: IRoute[]): Promise<void> => {
            console.log("Generating SDK Library");

            // FIND IMPLICIT TYPES
            const implicit: IRoute[] = routes.filter(is_implicit_return_typed);
            if (implicit.length > 0)
                throw new Error(
                    "NestiaApplication.sdk(): implicit return type is not allowed.\n" +
                        "\n" +
                        "List of implicit return typed routes:\n" +
                        implicit
                            .map((it) => `  - ${it.symbol} at "${it.location}"`)
                            .join("\n"),
                );

            // PREPARE NEW DIRECTORIES
            try {
                await fs.promises.mkdir(config.output!);
            } catch {}

            // BUNDLING
            const bundle: string[] = await fs.promises.readdir(BUNDLE_PATH);
            for (const file of bundle) {
                const current: string = `${BUNDLE_PATH}/${file}`;
                const stats: fs.Stats = await fs.promises.stat(current);

                if (stats.isFile() === true) {
                    const content: string = await fs.promises.readFile(
                        current,
                        "utf8",
                    );
                    if (fs.existsSync(`${config.output}/${file}`) === false)
                        await fs.promises.writeFile(
                            `${config.output}/${file}`,
                            content,
                            "utf8",
                        );
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

            // FUNCTIONAL
            await SdkFileProgrammer.generate(config)(routes);

            // DISTRIBUTION
            if (config.distribute !== undefined)
                await DistributionComposer.compose(config);
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

const is_implicit_return_typed = (route: IRoute): boolean => {
    const name: string = route.output.name;
    if (name === "void") return false;
    else if (name.indexOf("readonly [") !== -1) return true;

    const pos: number = name.indexOf("__object");
    if (pos === -1) return false;

    const before: number = pos - 1;
    const after: number = pos + "__object".length;
    for (const i of [before, after])
        if (name[i] === undefined) continue;
        else if (VARIABLE.test(name[i])) return false;
    return true;
};
const VARIABLE = /[a-zA-Z_$0-9]/;
