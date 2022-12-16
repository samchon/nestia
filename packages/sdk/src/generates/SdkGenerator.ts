import fs from "fs";
import NodePath from "path";
import ts from "typescript";

import { INestiaConfig } from "../INestiaConfig";
import { IRoute } from "../structures/IRoute";
import { FileGenerator } from "./FileGenerator";

export namespace SdkGenerator {
    export async function generate(
        _checker: ts.TypeChecker,
        config: INestiaConfig,
        routeList: IRoute[],
    ): Promise<void> {
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
                await fs.promises.writeFile(
                    `${config.output}/${file}`,
                    content,
                    "utf8",
                );
            }
        }

        // FUNCTIONAL
        await FileGenerator.generate(config, routeList);
    }

    export const BUNDLE_PATH = NodePath.join(
        __dirname,
        "..",
        "..",
        "assets",
        "bundle",
    );
}
