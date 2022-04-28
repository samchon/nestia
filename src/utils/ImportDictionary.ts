import * as path from "path";

import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";
import { Pair } from "tstl/utility/Pair";

export class ImportDictionary
{
    private readonly dict_: HashMap<string, Pair<boolean, HashSet<string>>> = new HashMap();

    public empty(): boolean
    {
        return this.dict_.empty();
    }

    public emplace(file: string, realistic: boolean, instance: string): void
    {
        if (file.substr(-5) === ".d.ts")
            file = file.substr(0, file.length - 5);
        else if (file.substr(-3) === ".ts")
            file = file.substr(0, file.length - 3);
        else
            throw new Error(`Error on ImportDictionary.emplace(): extension of the target file "${file}" is not "ts".`);

        const pair: Pair<boolean, HashSet<string>> = this.dict_.take
        (
            file, 
            () => new Pair(realistic, new HashSet())
        );
        pair.second.insert(instance);
    }

    public toScript(outDir: string): string
    {
        const statements: string[] = [];
        for (const it of this.dict_)
        {
            const file: string = path.relative(outDir, it.first).split("\\").join("/");
            const realistic: boolean = it.second.first;
            const instances: string[] = it.second.second.toJSON();

            statements.push(`import ${!realistic ? "type " : ""}{ ${instances.join(", ")} } from "./${file}";`);
        }
        return statements.join("\n");
    }
}