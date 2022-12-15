import cp from "child_process";
import fs from "fs";

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
        execute(`git clone https://github.com/samchon/nestia-template ${dest}`);
        console.log(`cd "${dest}"`);
        process.chdir(dest);

        // INSTALL DEPENDENCIES
        execute("npm install");

        // BUILD TYPESCRIPT
        execute("npm run build");

        // DO TEST
        execute("npm run test");

        // REMOVE .GIT DIRECTORY
        cp.execSync("npx rimraf .git");
    }

    function execute(command: string): void {
        console.log(command);
        cp.execSync(command, { stdio: "inherit" });
    }
}

const message = (content: string) =>
    `Error on nestia.start(): target directory ${content}.`;
