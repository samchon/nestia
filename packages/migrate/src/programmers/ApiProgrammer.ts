import { HashMap, IPointer, hash } from "tstl";
import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateProgram } from "../module";
import { IMigrateFile } from "../structures/IMigrateFile";
import { FilePrinter } from "../utils/FilePrinter";
import { StringUtil } from "../utils/StringUtil";
import { ApiFileProgrammer } from "./ApiFileProgrammer";

export namespace ApiProgrammer {
  export const write = (program: IMigrateProgram): IMigrateFile[] => {
    const dict: HashMap<string[], ApiFileProgrammer.IProps> = new HashMap(
      (x) => hash(x.join(".")),
      (a, b) => a.join(".") === b.join("."),
    );
    for (const controller of program.controllers)
      for (const route of controller.routes) {
        const namespace: string[] = [
          ...controller.path.split("/"),
          ...route.path.split("/"),
        ]
          .filter((str) => !!str.length && str[0] !== ":")
          .map(StringUtil.normalize)
          .map((str) => (Escaper.variable(str) ? str : `_${str}`));
        const last: IPointer<ApiFileProgrammer.IProps> = {
          value: dict.take(namespace, () => ({
            namespace,
            children: new Set(),
            entries: [],
          })),
        };
        last.value.entries.push({
          controller,
          route,
          alias: route.name,
        });
        namespace.slice(0, -1).forEach((_i, i, array) => {
          const partial: string[] = namespace.slice(0, array.length - i);
          const props: ApiFileProgrammer.IProps = dict.take(partial, () => ({
            namespace: partial,
            children: new Set(),
            entries: [],
          }));
          props.children.add(last.value.namespace.at(-1)!);
          last.value = props;
        });
      }
    for (const { second: props } of dict)
      props.entries.forEach(
        (entry, i) =>
          (entry.alias = StringUtil.escapeDuplicate([
            ...props.children,
            ...entry.route.parameters.map((p) => p.key),
            ...(entry.route.body ? [entry.route.body.key] : []),
            ...(entry.route.query ? [entry.route.query.key] : []),
            ...props.entries.filter((_, j) => i !== j).map((e) => e.alias),
          ])(entry.alias)),
      );

    return [...dict].map(({ second: props }) => ({
      location: `src/api/functional/${props.namespace.join("/")}`,
      file: "index.ts",
      content: FilePrinter.write({
        statements: ApiFileProgrammer.write(program.swagger.components)(props),
      }),
    }));
  };
}
