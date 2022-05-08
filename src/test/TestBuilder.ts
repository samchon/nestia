import cp from "child_process";
import fs from "fs";
import process from "process";

import { NestiaCommand } from "../executable/internal/NestiaCommand";

export namespace TestBuilder
{
    export async function main
        (
            name: string, 
            job: "sdk" | "swagger", 
            argv: string[]
        ): Promise<void>
    {
        const task = job === "sdk" ? 
        {
            generate: NestiaCommand.sdk,
            file: "src/api/functional/index.ts"
        } :
        {
            generate: NestiaCommand.swagger,
            file: "swagger.json"
        };
        
        process.chdir(`${PATH}/../../demo/${name}`);
        if (job === "sdk" && fs.existsSync("src/api/functional"))
            cp.execSync("npx rimraf src/api/functional");
        else if (job === "swagger" && fs.existsSync("swagger.json"))
            cp.execSync("npx rimraf swagger.json");
        
        try
        {
            await task.generate(argv, false);
            if (fs.existsSync(task.file) === false)
                throw new Error(`Bug on NestiaCommand.${job}(): failed to generate file(s).`);
        }
        catch (exp)
        {
            console.log(exp);
            throw exp;
        }
    }

    const PATH = __dirname;
}