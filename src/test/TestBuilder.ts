import cp from "child_process";
import fs from "fs";

import { NestiaCommand } from "../executable/internal/NestiaCommand";

export namespace TestBuilder {
    export async function generate(
        name: string,
        job: "sdk" | "swagger",
        argv: string[],
    ): Promise<void> {
        const task =
            job === "sdk"
                ? {
                      generate: NestiaCommand.sdk,
                      file: "src/api/functional/index.ts",
                  }
                : {
                      generate: NestiaCommand.swagger,
                      file: "swagger.json",
                  };

        process.chdir(`${PATH}/../../demo/${name}`);

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
            cp.execSync("npx ts-node -C ttypescript src/test");
        } catch (exp) {
            console.log(exp);
            throw exp;
        }
    }

    const PATH = __dirname;
}
