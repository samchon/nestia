import { MapUtil } from "../utils/MapUtil";

export class ImportProgrammer {
    private external_: Map<string, Set<string>> = new Map();
    private dtos_: Set<string> = new Set();

    public constructor(public readonly name: string | null) {}

    public empty(): boolean {
        return this.external_.size === 0 && this.dtos_.size === 0;
    }

    public external(props: ImportProgrammer.IProps): string {
        MapUtil.take(this.external_)(props.library)(() => new Set()).add(
            props.instance.split(".")[0],
        );
        return props.instance;
    }

    public tag(type: string, arg: number | string): string {
        this.external({
            library: "typia",
            instance: "tags",
        });
        return `tags.${type}<${JSON.stringify(arg)}>`;
    }

    public dto(name: string): string {
        const file: string = name.split(".")[0];
        if (this.name !== file) this.dtos_.add(file);
        return name;
    }

    public toScript(
        dtoPath: (name: string) => string,
        current?: string,
    ): string[] {
        const content: string[] = [...this.external_.entries()].map(
            ([library, properties]) =>
                `import { ${[...properties].join(", ")} } from "${library}";`,
        );
        if (this.external_.size && this.dtos_.size) content.push("");
        content.push(
            ...[...this.dtos_]
                .filter(
                    current
                        ? (name) => name !== current!.split(".")[0]
                        : () => true,
                )
                .map((i) => `import { ${i} } from "${dtoPath(i)}";`),
        );
        return content;
    }
}
export namespace ImportProgrammer {
    export interface IProps {
        library: string;
        instance: string;
    }
}
