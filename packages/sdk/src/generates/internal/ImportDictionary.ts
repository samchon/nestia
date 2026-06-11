import { Node, TypeScriptFactory } from "@nestia/factory";
import path from "path";
import { HashMap, TreeMap, hash } from "tstl";

import { ImportAnalyzer } from "../../analyses/ImportAnalyzer";
import { IReflectImport } from "../../structures/IReflectImport";
import { FilePrinter } from "./FilePrinter";

export class ImportDictionary {
  private readonly components_: HashMap<ICompositeKey, ICompositeValue> =
    new HashMap(
      (key) => hash(key.file, key.declaration, key.asterisk, key.default),
      (a, b) =>
        a.file === b.file &&
        a.declaration === b.declaration &&
        a.asterisk === b.asterisk &&
        a.default === b.default,
    );

  public constructor(public readonly file: string) {}

  public empty(): boolean {
    return this.components_.empty();
  }

  public declarations(imports: IReflectImport[]): void {
    imports = ImportAnalyzer.merge(imports);
    for (const imp of imports) {
      if (imp.asterisk !== null)
        this.internal({
          type: "asterisk",
          file: imp.file,
          name: imp.asterisk,
          declaration: true,
        });
      if (imp.default !== null)
        this.internal({
          type: "default",
          file: imp.file,
          name: imp.default,
          declaration: true,
        });
      for (const elem of imp.elements) {
        if (elem === "WebSocketAcceptor") continue;
        this.internal({
          type: "element",
          file: imp.file,
          name: elem,
          declaration: true,
        });
      }
    }
  }

  public external(props: ImportDictionary.IProps): string {
    const file: string = `node_modules/${props.file}`;
    return this.internal({
      ...props,
      file,
    });
  }

  public internal(props: ImportDictionary.IProps): string {
    const file: string = normalize(trimSourceExtension(props.file));
    const key: ICompositeKey = {
      file: file,
      declaration: props.declaration,
      asterisk: props.type === "asterisk" ? props.name : null,
      default: props.type === "default" ? props.name : null,
    };
    const value: ICompositeValue = this.components_.take(key, () => ({
      ...key,
      elements: new TreeMap<string, string | null>(),
    }));
    if (props.type === "element")
      value.elements.set(props.name, props.alias ?? null);
    return props.type === "element" ? (props.alias ?? props.name) : props.name;
  }

  public toStatements(outDir: string): Node[] {
    outDir = path.resolve(outDir);

    const external: Node[] = [];
    const internal: Node[] = [];
    const locator = (str: string) => {
      const location: string = path
        .relative(outDir, str)
        .split(path.sep)
        .join("/");
      const index: number = location.lastIndexOf(NODE_MODULES);
      return index === -1
        ? location.startsWith("..")
          ? location
          : `./${location}`
        : location.substring(index + NODE_MODULES.length);
    };
    const enroll =
      (filter: (str: string) => boolean) => (container: Node[]) => {
        const compositions: ICompositeValue[] = this.components_
          .toJSON()
          .filter((c) => filter(c.second.file))
          .map(
            (e) =>
              ({
                ...e.second,
                file: locator(e.second.file),
              }) satisfies ICompositeValue,
          )
          .sort((a, b) => a.file.localeCompare(b.file));
        for (const c of compositions)
          container.push(
            TypeScriptFactory.createImportDeclaration(
              undefined,
              this.toImportClaude(c),
              TypeScriptFactory.createStringLiteral(c.file),
              undefined,
            ),
          );
      };

    enroll((str) => str.indexOf(NODE_MODULES) !== -1)(external);
    enroll((str) => str.indexOf(NODE_MODULES) === -1)(internal);
    return [
      ...external,
      ...(external.length && internal.length ? [FilePrinter.enter()] : []),
      ...internal,
    ];
  }

  private toImportClaude(c: ICompositeValue): Node {
    if (c.asterisk !== null)
      return TypeScriptFactory.createImportClause(
        c.declaration,
        undefined,
        TypeScriptFactory.createNamespaceImport(
          TypeScriptFactory.createIdentifier(c.asterisk),
        ),
      );
    return TypeScriptFactory.createImportClause(
      c.declaration,
      c.default !== null
        ? TypeScriptFactory.createIdentifier(c.default)
        : undefined,
      c.elements.size() !== 0
        ? TypeScriptFactory.createNamedImports(
            Array.from(c.elements).map(({ first: name, second: alias }) =>
              TypeScriptFactory.createImportSpecifier(
                c.declaration,
                alias !== null
                  ? TypeScriptFactory.createIdentifier(name)
                  : undefined,
                TypeScriptFactory.createIdentifier(alias ?? name),
              ),
            ),
          )
        : undefined,
    );
  }
}
export namespace ImportDictionary {
  export interface IProps {
    type: "default" | "element" | "asterisk";
    file: string;
    name: string;
    alias?: string;
    declaration: boolean;
  }
}

interface ICompositeKey {
  file: string;
  declaration: boolean;
  asterisk: string | null;
  default: string | null;
}
interface ICompositeValue extends ICompositeKey {
  elements: TreeMap<string, string | null>;
}

const NODE_MODULES = "node_modules/";
const SOURCE_EXTENSIONS: string[] = [
  ".d.mts",
  ".d.cts",
  ".d.ts",
  ".mts",
  ".cts",
  ".tsx",
  ".ts",
  ".mjs",
  ".cjs",
  ".jsx",
  ".js",
];

const normalize = (file: string): string => {
  file = path.resolve(file);
  if (file.includes(`node_modules${path.sep}`))
    file =
      "node_modules/" +
      file.split(`node_modules${path.sep}`).at(-1)!.split(path.sep).join("/");
  return file;
};

const trimSourceExtension = (file: string): string => {
  if (file.startsWith(`${NODE_MODULES}`)) return file;
  for (const ext of SOURCE_EXTENSIONS)
    if (file.endsWith(ext)) return file.substring(0, file.length - ext.length);
  return file;
};
