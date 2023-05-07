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
