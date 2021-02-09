import * as path from "path";
import * as fs from "fs";
import { InvalidArgument } from "tstl/exception/InvalidArgument";

import { IRoute } from "../structures/IRoute";
import { Directory } from "../utils/FileSystem";

export namespace SdkGenerator
{
    export async function generate(outDir: string, routeList: IRoute[]): Promise<void>
    {
        // PREPARE NEW DIRECTORIES
        try { await fs.promises.mkdir(outDir); } catch {}

        // BUNDLING
        await Directory.copy(__dirname + "/../bundle/typings", outDir + "/typings");
        await Directory.copy(__dirname + "/../bundle/utils", outDir + "/utils");
        
        // FUNCTIONAL
        await Directory.remake(outDir + "/functional");
        await functional(outDir + "/functional", routeList);
    }

    /* ---------------------------------------------------------
        FUNCTIONAL
    --------------------------------------------------------- */
    async function functional(outDir: string, routeList: IRoute[]): Promise<void>
    {
        const children: string[] = [];
        for (const route of routeList)
        {
            const moduleName: string = route.path.split("/").filter(str => str && str[0] !== ":").join(".") + "." + route.name;
            const importStatements: string = route.imports.map(tuple => get_import_statement(outDir, tuple)).join("\n");
            const parameters: string = route.parameters.map(param => `${param.name}: ${param.type}`).join(", ");

            const script: string = `${DEFAULT_IMPORT}\n`
                + `\n`
                + `${importStatements}\n`
                + `\n`
                + `export namespace ${moduleName}\n`
                + `{\n`
                + `    export async function call(connection: IConnection, ${parameters}): Promise<Primitive<${route.output}>>\n`
                + `    {\n`
                + `        AesPkcs5;\n`
                + `        Fetcher;\n`
                + `\n`
                + `        ${get_call_function_body(route)}\n`
                + `    }\n`
                + `}\n`;
            await fs.promises.writeFile(`${outDir}/${moduleName}.ts`, script, "utf8");

            children.push(moduleName);
        }

        const index: string = children.map(child => `export * from "${child}";`).join("\n");
        await fs.promises.writeFile(`${outDir}/index.ts`, index, "utf8");
    }

    function get_import_statement(outDir: string, tuple: [string, string[]]): string
    {
        let file: string = path.relative(outDir, tuple[0]).split("\\").join("/");
        if (file.substr(-5) === ".d.ts")
            file = file.substr(0, file.length - 5);
        else if (file.substr(-3) === ".ts")
            file = file.substr(0, file.length - 3);
        else
            throw new InvalidArgument(`Error on SdkGenerator.get_import_statement(): extension of the ${tuple[0]} file is not "ts".`);

        return `import { ${tuple[1].join(", ")} } from "./${file}";`
    }

    function get_call_function_body(route: IRoute): string
    {
        route;
        return "";
    }
}

const DEFAULT_IMPORT: string = 
[
    `import { AesPkcs5 } from "../utils/AesPkcs5";`,
    `import { Fetcher } from "../utils/Fetcher";`,
    `import { IConnection } from "../typings/IConnection";`,
    `import { Primitive } from "../typings/Primitive";`,
].join("\n");