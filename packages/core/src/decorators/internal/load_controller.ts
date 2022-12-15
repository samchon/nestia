import is_ts_node from "detect-ts-node";
import fs from "fs";

import { Creator } from "../../typings/Creator";

export async function load_controllers(
    path: string,
): Promise<Creator<object>[]> {
    const output: any[] = [];
    await iterate(output, path);
    return output;
}

async function iterate(
    controllers: Creator<object>[],
    path: string,
): Promise<void> {
    const directory: string[] = await fs.promises.readdir(path);
    for (const file of directory) {
        const current: string = `${path}/${file}`;
        const stats: fs.Stats = await fs.promises.lstat(current);

        if (stats.isDirectory() === true) await iterate(controllers, current);
        else if (file.substring(file.length - 3) === `.${EXTENSION}`) {
            const external: any = await import(current);
            for (const key in external) {
                const instance: Creator<object> = external[key];
                if (Reflect.getMetadata("path", instance) !== undefined)
                    controllers.push(instance);
            }
        }
    }
}

const EXTENSION = is_ts_node ? "ts" : "js";
