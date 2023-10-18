import fs from "fs";
import glob from "glob";
import path from "path";

export namespace SourceFinder {
    interface IProps {
        exclude?: string[];
        include: string[];
        filter: (location: string) => Promise<boolean>;
    }

    export const find = async (props: IProps): Promise<string[]> => {
        const dict: Set<string> = new Set();

        await emplace(props.filter)(props.include)((str) => dict.add(str));
        if (props.exclude?.length)
            await emplace(props.filter)(props.exclude)((str) =>
                dict.delete(str),
            );

        return [...dict];
    };

    const emplace =
        (filter: (file: string) => Promise<boolean>) =>
        (input: string[]) =>
        async (closure: (location: string) => void): Promise<void> => {
            for (const pattern of input) {
                if (_Is_file(pattern)) {
                    closure(path.resolve(pattern));
                    continue;
                }
                for (const file of await _Glob(pattern)) {
                    const stats: fs.Stats = await fs.promises.stat(file);
                    if (stats.isDirectory() === true)
                        await iterate(filter)(closure)(file);
                    else if (stats.isFile() && (await filter(file)))
                        closure(file);
                }
            }
        };

    const iterate =
        (filter: (location: string) => Promise<boolean>) =>
        (closure: (location: string) => void) =>
        async (location: string): Promise<void> => {
            const directory: string[] = await fs.promises.readdir(location);
            for (const file of directory) {
                const next: string = path.resolve(`${location}/${file}`);
                const stats: fs.Stats = await fs.promises.stat(next);

                if (stats.isDirectory() === true)
                    await iterate(filter)(closure)(next);
                else if (stats.isFile() && (await filter(next))) closure(next);
            }
        };

    const _Glob = (pattern: string): Promise<string[]> =>
        new Promise((resolve, reject) => {
            glob(pattern, (err, matches) => {
                if (err) reject(err);
                else resolve(matches.map((str) => path.resolve(str)));
            });
        });

    const _Is_file = (pattern: string): boolean =>
        pattern.endsWith(".ts") &&
        !pattern.endsWith(".d.ts") &&
        fs.existsSync(pattern);
}
