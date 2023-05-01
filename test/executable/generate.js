const fs = require("fs");

const directory = (name) => `${__dirname}/../features/${name}`;

const copy =
    (src) =>
    async (dest) => {
        const stats = await fs.promises.lstat(src);
        if (stats.isDirectory()) {
            await fs.promises.mkdir(dest);
            for (const file of await fs.promises.readdir(src))
                await copy(`${src}/${file}`)(`${dest}/${file}`);
        } else await fs.promises.copyFile(src, dest);
    };

const main = async () => {
    const name = process.argv[2];
    if (name === undefined)
        throw new Error("No name specified. (e.g. npm run generate route-error-generic");
    
    const type = name.includes("error") ? "error" : "success";
    if (fs.existsSync(directory(name)))
        throw new Error("duplicated name exists.");
    await copy(`${__dirname}/../template/${type}`)(directory(name));
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
