import fs from "fs";
import typia from "typia";

const directory = (name: string) => `${__dirname}/../features/${name}`;

const copy =
    (src: string) =>
    async (dest: string): Promise<void> => {
        const stats: fs.Stats = await fs.promises.lstat(src);
        if (stats.isDirectory()) {
            await fs.promises.mkdir(dest);
            for (const file of await fs.promises.readdir(src))
                await copy(`${src}/${file}`)(`${dest}/${file}`);
        } else await fs.promises.copyFile(src, dest);
    };

const main = async (): Promise<void> => {
    const type: "success" | "error" = process.argv[2] as "success" | "error";
    const name: string = process.argv[3];

    typia.assert(type);
    typia.assert(name);

    if (fs.existsSync(directory(name)))
        throw new Error("duplicated name exists.");
    await copy(`${__dirname}/../template/${type}`)(directory(name));
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
