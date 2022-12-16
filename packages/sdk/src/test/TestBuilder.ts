import cp from "child_process";
import fs from "fs";

import { NestiaSdkCommand } from "../executable/internal/NestiaSdkCommand";

export namespace TestBuilder {
    export async function generate(
        name: string,
        job: "sdk" | "swagger",
        argv: string[],
    ): Promise<void> {
        const task =
            job === "sdk"
                ? {
                      generate: NestiaSdkCommand.sdk,
                      file: "src/api/functional/index.ts",
                  }
                : {
                      generate: NestiaSdkCommand.swagger,
                      file: "swagger.json",
                  };

        process.chdir(`${PATH}/../../demo/${name}`);
        if (fs.existsSync(task.file)) await fs.promises.unlink(task.file);

        try {
            await task.generate(argv, false);
            if (fs.existsSync(task.file) === false)
                throw new Error(
                    `Bug on NestiaCommand.${job}(): failed to generate file(s).`,
                );
        } catch (exp) {
            console.log(exp);
            throw exp;
        }
    }

    export async function test(name: string): Promise<void> {
        process.chdir(`${PATH}/../../demo/${name}`);

        try {
            cp.execSync("npx ts-node -C ttypescript src/test", {
                stdio: "inherit",
            });
        } catch (exp) {
            console.log(exp);
            throw exp;
        }
    }

    const PATH = __dirname;
}
