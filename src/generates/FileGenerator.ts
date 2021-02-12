import * as fs from "fs";
import { HashMap } from "tstl/container/HashMap";

import { IRoute } from "../structures/IRoute";
import { DirectoryUtil } from "../utils/DirectoryUtil";
import { ImportDictionary } from "../utils/ImportDictionary";
import { FunctionGenerator } from "./FunctionGenerator";

export namespace FileGenerator
{
    /* ---------------------------------------------------------
        CONSTRUCTOR
    --------------------------------------------------------- */
    export async function generate(outDir: string, routeList: IRoute[]): Promise<void>
    {
        const root: Directory = new Directory("functional");
        for (const route of routeList)
            emplace(root, route);

        const defaultImportDict: ImportDictionary = new ImportDictionary();
        defaultImportDict.emplace(`${outDir}/__internal/AesPkcs5.ts`, true, "AesPkcs5");
        defaultImportDict.emplace(`${outDir}/__internal/Fetcher.ts`, true, "Fetcher");
        defaultImportDict.emplace(`${outDir}/IConnection.ts`, false, "IConnection");
        defaultImportDict.emplace(`${outDir}/Primitive.ts`, false, "Primitive");

        await DirectoryUtil.remove(outDir + "/functional");
        await iterate(defaultImportDict, outDir + "/functional", root);
    }

    function emplace(directory: Directory, route: IRoute): void
    {
        // SEPARATE IDENTIFIERS
        const identifiers: string[] = route.path.split("/").filter(str => str[0] !== ":" && str.length !== 0);

        for (const key of identifiers)
        {
            // EMPLACE IF REQUIRED
            let it: HashMap.Iterator<string, Directory> = directory.directories.find(key);
            if (it.equals(directory.directories.end()) === true)
                it = directory.directories.emplace(key, new Directory(key)).first;

            // FOR THE NEXT STEP
            directory = it.second;
        }
        directory.routes.push(route);
    }

    /* ---------------------------------------------------------
        FILE ITERATOR
    --------------------------------------------------------- */
    async function iterate(defaultImportDict: ImportDictionary, outDir: string, directory: Directory): Promise<void>
    {
        // CREATE A NEW DIRECTORY
        try
        {
            await fs.promises.mkdir(outDir);
        }
        catch {}
        
        // ITERATE CHILDREN
        let content: string = "";
        for (const it of directory.directories)
        {
            await iterate(defaultImportDict, `${outDir}/${it.first}`, it.second);
            content += `export * as ${it.first} from "./${it.first}";\n`;
        }
        content += "\n";

        // ITERATE ROUTES
        const importDict: ImportDictionary = new ImportDictionary();
        for (const route of directory.routes)
        {
            for (const tuple of route.imports)
                for (const instance of tuple[1])
                    importDict.emplace(tuple[0], false, instance);
            content += FunctionGenerator.generate(route) + "\n\n";
        }

        if (directory.routes.length !== 0)
            content = defaultImportDict.toScript(outDir) + "\n\n" 
                + importDict.toScript(outDir) + "\n\n" 
                + content + "\n\n"
                + defaultImportDict.listUp();
        await fs.promises.writeFile(`${outDir}/index.ts`, content, "utf8");
    }
}

class Directory
{
    public readonly directories: HashMap<string, Directory>;
    public readonly routes: IRoute[];

    public constructor(readonly name: string)
    {
        this.directories = new HashMap();
        this.routes = [];
    }
}