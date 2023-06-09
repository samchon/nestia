import cp from "child_process";
import fs from "fs";

export namespace NestiaStarter {
    export const start =
        (halter: (msg?: string) => never) =>
        async (argv: string[]): Promise<void> => {
            // VALIDATION
            const dest: string | undefined = argv[0];
            const manager: string =
                argv[1] === "--manager" && argv[2] ? argv[2] : "npm";
            if (dest === undefined) halter();
            else if (
                manager !== "npm" &&
                manager !== "yarn" &&
                manager !== "pnpm"
            )
                throw new Error(
                    "Invalid package manager. Only npm, yarn, and pnpm are supported.",
                );
            else if (fs.existsSync(dest) === true)
                halter("The target directory already exists.");

            console.log("-----------------------------------------");
            console.log(" Nestia Starter Kit");
            console.log("-----------------------------------------");

            // COPY PROJECTS
            execute(
                `git clone https://github.com/samchon/nestia-template ${dest}`,
            );
            console.log(`cd "${dest}"`);
            process.chdir(dest);

            // INSTALL DEPENDENCIES
            execute(`${manager} install`);

            // BUILD TYPESCRIPT
            execute("npm run build");

            // DO TEST
            execute("npm run test");

            // REMOVE .GIT DIRECTORY
            cp.execSync("npx rimraf .git");
        };

    function execute(command: string): void {
        console.log(command);
        cp.execSync(command, { stdio: "inherit" });
    }
}
