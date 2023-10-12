import cp from "child_process";
import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";

export namespace SdkDistributionComposer {
    export const compose = async (config: INestiaConfig) => {
        if (!fs.existsSync(config.distribute!))
            await fs.promises.mkdir(config.distribute!);

        const root: string = process.cwd();
        const output: string = path.resolve(config.output!);
        process.chdir(config.distribute!);

        const exit = () => process.chdir(root);
        if (await configured()) return exit();

        // COPY FILES
        console.log("Composing SDK distribution environments...");
        for (const file of await fs.promises.readdir(BUNDLE))
            await fs.promises.copyFile(`${BUNDLE}/${file}`, file);

        // CONFIGURE PATHS
        for (const file of ["package.json", "tsconfig.json"])
            await replace({ root, output })(file);

        // INSTALL PACKAGES
        const versions: IDependencies = await dependencies();
        execute("npm install --save-dev rimraf");
        execute(
            `npm install --save @nestia/fetcher@${versions["@nestia/fetcher"]}`,
        );
        execute(`npm install --save typia@${versions["typia"]}`);
        execute("npx typia setup --manager npm");

        exit();
    };

    const configured = async (): Promise<boolean> =>
        ["package.json", "tsconfig.json"].every(fs.existsSync) &&
        (await (async () => {
            const content = JSON.parse(
                await fs.promises.readFile("package.json", "utf8"),
            );
            return !!content.dependencies?.["@nestia/fetcher"];
        })());

    const execute = (command: string) => {
        console.log(`  - ${command}`);
        cp.execSync(command, { stdio: "ignore" });
    };

    const replace =
        (props: { root: string; output: string }) =>
        async (file: string): Promise<void> => {
            const relative = (from: string) => (to: string) =>
                path.relative(from, to).split("\\").join("/");
            const root: string = relative(process.cwd())(props.root);
            const output: string = relative(process.cwd())(props.output);
            const current: string = relative(props.root)(process.cwd());

            const content: string = await fs.promises.readFile(file, "utf8");
            await fs.promises.writeFile(
                file,
                content
                    .split("${root}")
                    .join(root)
                    .split("${output}")
                    .join(output)
                    .split("${current}")
                    .join(current),
                "utf8",
            );
        };

    const dependencies = async () => {
        const content: string = await fs.promises.readFile(
            __dirname + "/../../../package.json",
            "utf8",
        );
        const json: { dependencies: IDependencies } = JSON.parse(content);
        return json.dependencies;
    };
}

interface IDependencies {
    "@nestia/fetcher": string;
    typia: string;
}
const BUNDLE = __dirname + "/../../../assets/bundle/distribute";
