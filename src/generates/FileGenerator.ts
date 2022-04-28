import * as fs from "fs";
import { HashMap } from "tstl/container/HashMap";
import { IConfiguration } from "../IConfiguration";

import { IRoute } from "../structures/IRoute";
import { ImportDictionary } from "../utils/ImportDictionary";
import { FunctionGenerator } from "./FunctionGenerator";

export namespace FileGenerator
{
    /* ---------------------------------------------------------
        CONSTRUCTOR
    --------------------------------------------------------- */
    export async function generate(config: IConfiguration, routeList: IRoute[]): Promise<void>
    {
        // CONSTRUCT FOLDER TREE
        const root: Directory = new Directory(null, "functional");
        for (const route of routeList)
            emplace(root, route);

        // RELOCATE FOR ONLY ONE CONTROLLER METHOD IN AN URL CASE
        relocate(root);

        // ITERATE FILES
        await iterate(config, config.output + "/functional", root);
    }

    function emplace(directory: Directory, route: IRoute): void
    {
        // SEPARATE IDENTIFIERS
        const identifiers: string[] = route.path
            .split("/")
            .filter(str => str[0] !== ":" && str.length !== 0)
            .map(str => str.split("-").join("_").split(".").join("_"));

        // OPEN DIRECTORIES
        for (const key of identifiers)
            directory = directory.directories.take
            (
                key, 
                () => new Directory(directory, key)
            );

        // ADD ROUTE
        directory.routes.push(route);
    }

    function relocate(directory: Directory): void
    {
        if (directory.parent !== null 
            && directory.directories.empty() 
            && directory.routes.length === 1
            && directory.name === directory.routes[0].name)
        {
            directory.parent.routes.push(directory.routes[0]);
            directory.parent.directories.erase(directory.name);
        }
        else if (directory.directories.empty() === false)
            for (const it of directory.directories)
                relocate(it.second);
    }

    /* ---------------------------------------------------------
        FILE ITERATOR
    --------------------------------------------------------- */
    async function iterate
        (
            config: IConfiguration, 
            outDir: string, 
            directory: Directory
        ): Promise<void>
    {
        // CREATE A NEW DIRECTORY
        try
        {
            await fs.promises.mkdir(outDir);
        }
        catch {}
        
        // ITERATE CHILDREN
        const content: string[] = [];
        for (const it of directory.directories)
        {
            await iterate(config, `${outDir}/${it.first}`, it.second);
            content.push(`export * as ${it.first} from "./${it.first}";`);
        }
        if (content.length && directory.routes.length)
            content.push("");

        // ITERATE ROUTES
        const importDict: ImportDictionary = new ImportDictionary();
        directory.routes.forEach((route, i) =>
        {
            for (const tuple of route.imports)
                for (const instance of tuple[1])
                    importDict.emplace(tuple[0], false, instance);

            content.push(FunctionGenerator.generate(config, route));
            if (i !== directory.routes.length - 1)
                content.push("");
        });

        // FINALIZE THE CONTENT
        if (directory.routes.length !== 0)
        {
            const primitived: boolean = directory.routes.some(route => route.output !== "void" 
                || route.parameters.some(param => param.category !== "param")
            );
            const asserted: boolean = config.assert === true
                && directory.routes.some(route => route.parameters.length !== 0);
            const json: boolean = config.json === true
                && directory.routes.some(route => route.method === "POST" || route.method === "PUT" || route.method === "PATCH");
            
            const fetcher: string[] = ["Fetcher"];
            if (primitived)
                fetcher.push("Primitive");
            
            const head: string[] = [
                `import { ${fetcher.join(", ")} } from "nestia-fetcher";`,
                `import type { IConnection } from "nestia-fetcher";`,
            ];
            if (asserted)
                head.push(`import { assertType } from "typescript-is";`);
            if (json)
                head.push(`import { createStringifier } from "typescript-json";`);
            if (!importDict.empty())
                head.push("", importDict.toScript(outDir));

            content.push
            (
                ...head,
                "", 
                ...content.splice(0, content.length)
            );
        }

        const script: string 
            = "/**\n"
            + " * @packageDocumentation\n"
            + ` * @module ${directory.module}\n`
            + " */\n"
            + "//================================================================\n"
            + content.join("\n");
        await fs.promises.writeFile(`${outDir}/index.ts`, script, "utf8");
    }
}

class Directory
{
    public readonly module: string;
    public readonly directories: HashMap<string, Directory>;
    public readonly routes: IRoute[];

    public constructor(readonly parent: Directory | null, readonly name: string)
    {
        this.directories = new HashMap();
        this.routes = [];
        this.module = (this.parent !== null)
            ? `${this.parent.module}.${name}`
            : `api.${name}`;
    }
}