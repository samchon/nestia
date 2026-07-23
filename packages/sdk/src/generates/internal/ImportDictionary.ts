import {
  type ImportClause,
  type Node,
  SyntaxKind,
  factory,
} from "@ttsc/factory";
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
        const imported: string = imp.elementAliases?.[elem] ?? elem;
        this.internal({
          type: "element",
          file: imp.file,
          name: imported,
          alias: imported === elem ? undefined : elem,
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
      elements: new TreeMap<string, string>(),
    }));
    if (props.type === "element") {
      const local: string = props.alias ?? props.name;
      value.elements.set(local, props.name);
    }
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
            factory.createImportDeclaration(
              undefined,
              this.toImportClaude(c),
              factory.createStringLiteral(c.file),
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

  private toImportClaude(c: ICompositeValue): ImportClause {
    // A namespace binding cannot carry a per-binding `type` modifier, so the
    // type-only flag goes on the clause itself (`import type * as X`) —
    // generated SDK code references DTO namespaces only in type positions.
    if (c.asterisk !== null)
      return factory.createImportClause(
        c.declaration ? SyntaxKind.TypeKeyword : undefined,
        undefined,
        factory.createNamespaceImport(factory.createIdentifier(c.asterisk)),
      );
    // `c.declaration` (type-only) belongs on the import clause, not on each
    // specifier — emitting both produces the invalid `import type { type X }`.
    return factory.createImportClause(
      c.declaration ? SyntaxKind.TypeKeyword : undefined,
      c.default !== null ? factory.createIdentifier(c.default) : undefined,
      c.elements.size() !== 0
        ? factory.createNamedImports(
            Array.from(c.elements).map(({ first: local, second: imported }) =>
              factory.createImportSpecifier(
                false,
                imported !== local
                  ? factory.createIdentifier(imported)
                  : undefined,
                factory.createIdentifier(local),
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
  /** Maps each local named binding to the exported name. */
  elements: TreeMap<string, string>;
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
