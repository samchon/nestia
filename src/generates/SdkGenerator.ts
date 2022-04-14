import * as fs from "fs";
import * as path from "path";
import { DirectoryUtil } from "../utils/DirectoryUtil";

import { IRoute } from "../structures/IRoute";
import { FileGenerator } from "./FileGenerator";
import { IConfiguration } from "../IConfiguration";

export namespace SdkGenerator
{
    export async function generate
        (
            config: IConfiguration,
            routeList: IRoute[],
        ): Promise<void>
    {
        // PREPARE NEW DIRECTORIES
        try { await fs.promises.mkdir(config.output); } catch {}

        // BUNDLING
        const bundle: string[] = await fs.promises.readdir(BUNDLE_PATH);
        for (const file of bundle)
        {
            const current: string = `${BUNDLE_PATH}/${file}`;
            const stats: fs.Stats = await fs.promises.stat(current);

            if (stats.isFile() === true)
            {
                const content: string = await fs.promises.readFile(current, "utf8");
                await fs.promises.writeFile(`${config.output}/${file}`, content, "utf8");
            }
        }
        await DirectoryUtil.copy(BUNDLE_PATH + "/__internal", config.output + "/__internal");
        
        // FUNCTIONAL
        await FileGenerator.generate(config, routeList);
    }

    export const BUNDLE_PATH = path.join(__dirname, "..", "..", "bundle");
}