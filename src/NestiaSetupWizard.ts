import cp from "child_process";
import fs from "fs";

export namespace NestiaSetupWizard {
    export interface IArguments {
        manager: "npm" | "pnpm" | "yarn";
        project: string;
    }

    export async function ttypescript(args: IArguments): Promise<void> {
        const wizard = await prepare(args);
        await wizard.ttypescript(args);
    }

    export async function tsPatch(args: IArguments): Promise<void> {
        const wizard = await prepare(args);
        await wizard.tsPatch(args);
    }

    async function prepare(args: IArguments) {
        if (fs.existsSync("package.json") === false)
            halt(() => {})("make package.json file or move to it.");

        const pack: any = JSON.parse(
            await fs.promises.readFile("package.json", "utf8"),
        );
        add(args.manager)(pack)("@nestia/core", false);
        add(args.manager)(pack)("@nestia/sdk", false);

        const modulo: typeof import("@nestia/core/lib/executable/internal/CoreSetupWizard") =
            await import(
                process.cwd() +
                    "/node_modules/@nestia/core/lib/executable/internal/CoreSetupWizard"
            );
        return modulo.CoreSetupWizard;
    }
}

const add =
    (manager: string) =>
    (pack: any) =>
    (modulo: string, devOnly: boolean): void => {
        const exists: boolean =
            (devOnly === false
                ? !!pack.dependencies && !!pack.dependencies[modulo]
                : !!pack.devDependencies && !!pack.devDependencies[modulo]) &&
            fs.existsSync("node_modules/" + modulo);
        const middle: string =
            manager === "yarn"
                ? `add${devOnly ? " -D" : ""}`
                : `install ${devOnly ? "--save-dev" : "--save"}`;
        if (exists === false) execute(`${manager} ${middle} ${modulo}`);
    };

const halt =
    (closer: () => any) =>
    (desc: string): never => {
        closer();
        console.error(desc);
        process.exit(-1);
    };

function execute(command: string): void {
    console.log(command);
    cp.execSync(command, { stdio: "inherit" });
}
