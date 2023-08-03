import { MapUtil } from "../utils/MapUtil";

export class ImportProgrammer {
    private dict: Map<string, Set<string>> = new Map();

    public add(props: ImportProgrammer.IProps): string {
        MapUtil.take(this.dict)(props.library)(() => new Set()).add(
            props.instance,
        );
        return props.instance;
    }

    public toScript(): string {
        return [...this.dict.entries()]
            .map(
                ([library, properties]) =>
                    `import { ${[...properties].join(
                        ", ",
                    )} } from "${library}";`,
            )
            .join("\n");
    }
}
export namespace ImportProgrammer {
    export interface IProps {
        library: string;
        instance: string;
    }
}
