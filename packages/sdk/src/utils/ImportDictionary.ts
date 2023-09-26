import path from "path";
import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";
import { Pair } from "tstl/utility/Pair";

export class ImportDictionary {
    private readonly components_: HashMap<Pair<string, boolean>, IComposition> =
        new HashMap();

    public constructor(public readonly file: string) {}

    public empty(): boolean {
        return this.components_.empty();
    }

    public external(props: ImportDictionary.IExternalProps): string {
        const composition: IComposition = this.components_.take(
            new Pair(props.library, props.type),
            () => ({
                location: `node_modules/${props.library}`,
                elements: new HashSet(),
                default: false,
                type: props.type,
            }),
        );
        if (props.instance === null) composition.default = true;
        else composition.elements.insert(props.instance);
        return props.instance ?? props.library;
    }

    public internal(props: ImportDictionary.IInternalProps): string {
        const file: string = (() => {
            if (props.file.substring(props.file.length - 5) === ".d.ts")
                return props.file.substring(0, props.file.length - 5);
            else if (props.file.substring(props.file.length - 3) === ".ts")
                return props.file.substring(0, props.file.length - 3);
            return props.file;
        })();
        const composition: IComposition = this.components_.take(
            new Pair(file, props.type),
            () => ({
                location: file,
                elements: new HashSet(),
                default: false,
                type: props.type,
            }),
        );
        if (props.instance === null) {
            composition.default = true;
            if (props.name) composition.name = props.name;
        } else composition.elements.insert(props.instance);
        return props.instance ?? file;
    }

    public toScript(outDir: string): string {
        const external: string[] = [];
        const internal: string[] = [];

        const locator = (str: string) => {
            const location: string = path
                .relative(outDir, str)
                .split("\\")
                .join("/");
            const index: number = location.lastIndexOf(NODE_MODULES);
            return index === -1
                ? location.startsWith("..")
                    ? location
                    : `./${location}`
                : location.substring(index + NODE_MODULES.length);
        };
        const enroll =
            (filter: (str: string) => boolean) => (container: string[]) => {
                const compositions: IComposition[] = this.components_
                    .toJSON()
                    .filter((c) => filter(c.second.location))
                    .map((e) => ({
                        ...e.second,
                        location: locator(e.second.location),
                    }))
                    .sort((a, b) => a.location.localeCompare(b.location));
                for (const c of compositions) {
                    const brackets: string[] = [];
                    if (c.default) brackets.push(c.name ?? c.location);
                    if (c.elements.empty() === false)
                        brackets.push(
                            `{ ${c.elements
                                .toJSON()
                                .sort((a, b) => a.localeCompare(b))
                                .join(", ")} }`,
                        );
                    container.push(
                        `import ${c.type ? "type " : ""}${brackets.join(
                            ", ",
                        )} from "${c.location}";`,
                    );
                }
            };

        enroll((str) => str.indexOf(NODE_MODULES) !== -1)(external);
        enroll((str) => str.indexOf(NODE_MODULES) === -1)(internal);

        if (external.length && internal.length) external.push("");
        return [...external, ...internal].join("\n");
    }
}
export namespace ImportDictionary {
    export interface IExternalProps {
        type: boolean;
        library: string;
        instance: string | null;
    }
    export interface IInternalProps {
        type: boolean;
        file: string;
        instance: string | null;
        name?: string | null;
    }
}

interface IComposition {
    location: string;
    type: boolean;
    default: boolean;
    name?: string;
    elements: HashSet<string>;
}

const NODE_MODULES = "node_modules/";
