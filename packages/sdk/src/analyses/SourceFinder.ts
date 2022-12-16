import fs from "fs";
import glob from "glob";
import path from "path";

import { INestiaConfig } from "../INestiaConfig";

export namespace SourceFinder {
    export async function find(input: INestiaConfig.IInput): Promise<string[]> {
        const dict: Set<string> = new Set();

        await decode(input.include, (str) => dict.add(str));
        if (input.exclude)
            await decode(input.exclude, (str) => dict.delete(str));

        return [...dict];
    }

    async function decode(
        input: string[],
        closure: (location: string) => void,
    ): Promise<void> {
        for (const pattern of input) {
            for (const location of await _Glob(path.resolve(pattern))) {
                const stats: fs.Stats = await fs.promises.stat(location);
                if (stats.isDirectory() === true)
                    await iterate(closure, location);
                else if (stats.isFile() && _Is_ts_file(location))
                    closure(location);
            }
        }
    }

    async function iterate(
        closure: (location: string) => void,
        location: string,
    ): Promise<void> {
        const directory: string[] = await fs.promises.readdir(location);
        for (const file of directory) {
            const next: string = path.resolve(`${location}/${file}`);
            const stats: fs.Stats = await fs.promises.stat(next);

            if (stats.isDirectory() === true) await iterate(closure, next);
            else if (stats.isFile() && _Is_ts_file(file)) closure(next);
        }
    }

    function _Glob(pattern: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            glob(pattern, (err, matches) => {
                if (err) reject(err);
                else resolve(matches.map((str) => path.resolve(str)));
            });
        });
    }

    function _Is_ts_file(file: string): boolean {
        return file.substr(-3) === ".ts" && file.substr(-5) !== ".d.ts";
    }
}
