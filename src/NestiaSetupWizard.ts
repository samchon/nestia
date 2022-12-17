import cp from "child_process";
import fs from "fs";

export namespace NestiaSetupWizard {
    export async function ttypescript(manager: string): Promise<void> {
        await prepare(manager);
        const { CoreSetupWizard } = await import(
            "@nestia/core/lib/executable/internal/CoreSetupWizard"
        );
        CoreSetupWizard.ttypescript(manager);
    }

    export async function tsPatch(manager: string): Promise<void> {
        await prepare(manager);
        const { CoreSetupWizard } = await import(
            "@nestia/core/lib/executable/internal/CoreSetupWizard"
        );
        CoreSetupWizard.tsPatch(manager);
    }

    export async function prepare(manager: string): Promise<any> {
        if (fs.existsSync("package.json") === false)
            halt(() => {})("make package.json file or move to it.");

        const pack: any = JSON.parse(
            await fs.promises.readFile("package.json", "utf8"),
        );
        add(manager)(pack)("@nestia/core", false);
        add(manager)(pack)("@nestia/sdk", false);
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
