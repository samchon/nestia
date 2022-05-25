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