import * as path from "path";
import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";

export class ImportDictionary
{
    private readonly dict_: HashMap<string, HashSet<string>> = new HashMap();

    public emplace(file: string, instance: string): void
    {
        if (file.substr(-5) === ".d.ts")
            file = file.substr(0, file.length - 5);
        else if (file.substr(-3) === ".ts")
            file = file.substr(0, file.length - 3);
        else
            throw new Error(`Error on ImportDictionary.emplace(): extension of the target file "${file}" is not "ts".`);

        let it = this.dict_.find(file);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(file, new HashSet()).first;
        it.second.insert(instance);
    }

    public toScript(outDir: string): string
    {
        const statements: string[] = [];
        for (const it of this.dict_)
        {
            const file: string = path.relative(outDir, it.first).split("\\").join("/");
            statements.push(`import { ${it.second.toJSON().join(", ")} } from "./${file}";`);
        }
        return statements.join("\n");
    }

    public toJSON(): Array<[string, string[]]>
    {
        return this.dict_.toJSON().map(it => [it.first, it.second.toJSON()]);
    }
}