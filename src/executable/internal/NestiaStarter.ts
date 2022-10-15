import cp from "child_process";
import fs from "fs";

const PATH = __dirname + "/../../../template";

export namespace NestiaStarter {
    export async function start(dest: string | undefined): Promise<void> {
        // VALIDATION
        if (dest === undefined) throw new Error(message("is not specified."));
        else if (fs.existsSync(dest) === true)
            throw new Error(message("already exists"));

        console.log("-----------------------------------------");
        console.log(" Nestia Starter Kit");
        console.log("-----------------------------------------");

        // COPY PROJECTS
        console.log("Copying files...");
        await copy(PATH, dest);
        await copy(PATH + "/bundle/gitignore", dest + "/.gitignore");
        await copy(PATH + "/bundle/npmignore", dest + "/.npmignore");
        process.chdir(dest);

        // INSTALL DEPENDENCIES
        console.log("Installing dependencies...");
        cp.execSync("npm install", { stdio: "inherit" });

        // BUILD TYPESCRIPT
        console.log("Building project...");
        cp.execSync("npm run build", { stdio: "inherit" });

        // DO TEST
        console.log("Running test program...");
        cp.execSync("npm run test", { stdio: "inherit" });
    }

    async function copy(src: string, dest: string): Promise<void> {
        const stats: fs.Stats = await fs.promises.lstat(src);
        if (stats.isDirectory()) {
            if (src === PATH + "/.git" || src === PATH + "/bundle") return;

            await fs.promises.mkdir(dest);
            for (const file of await fs.promises.readdir(src))
                await copy(src + "/" + file, dest + "/" + file);
        } else {
            const content: string = await fs.promises.readFile(src, "utf8");
            await fs.promises.writeFile(dest, content, "utf8");
        }
    }
}

const message = (content: string) =>
    `Error on nestia.start(): target directory ${content}.`;
