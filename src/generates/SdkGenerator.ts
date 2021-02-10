import * as fs from "fs";

import { IRoute } from "../structures/IRoute";
import { DirectoryUtil } from "../utils/DirectoryUtil";
import { FileGenerator } from "./FileGenerator";

export namespace SdkGenerator
{
    export async function generate(outDir: string, routeList: IRoute[]): Promise<void>
    {
        // PREPARE NEW DIRECTORIES
        try { await fs.promises.mkdir(outDir); } catch {}

        // BUNDLING
        const bundle: string[] = await fs.promises.readdir(BUNDLE);
        for (const file of bundle)
        {
            const current: string = `${BUNDLE}/${file}`;
            const stats: fs.Stats = await fs.promises.stat(current);

            if (stats.isFile() === true)
            {
                const content: string = await fs.promises.readFile(current, "utf8");
                await fs.promises.writeFile(`${outDir}/${file}`, content, "utf8");
            }
        }
        await DirectoryUtil.copy(BUNDLE + "/__internal", outDir + "/__internal");
        
        // FUNCTIONAL
        await FileGenerator.generate(outDir, routeList);
    }
}

const BUNDLE = __dirname + "/../bundle"