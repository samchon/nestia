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

/**
 * The imports of one generated file, merged by module and kind, and printed as
 * import declarations.
 *
 * @evidence contracts/common.md#principled-implementation An import is keyed by its module, its type-only flag, and its default or namespace name, so the same import is one declaration whose named bindings are collected in order.
 * @evidence contracts/common.md#clear-and-simple-design One class with a hash map of components, and private helpers for the paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The keys are equal exactly when the declarations can be merged.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidence contracts/portability.md#os-neutral-implementation Source path spelling uses Node path.resolve and relative imports use path.relative followed by native-separator conversion to forward slashes. Package registration uses a node_modules marker; normalization is lexical, not symlink or filesystem-case canonicalization.
 */
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

  /**
   * Reports whether the file has no import.
   *
   * @evidence contracts/common.md#principled-implementation The dictionary is empty exactly when no component was registered.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the map.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ImportDictionary.prototype.empty composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  public empty(): boolean {
    return this.components_.empty();
  }

  /**
   * Registers the imports a route's declarations need, merged by file, as
   * type-only imports.
   *
   * The `WebSocketAcceptor` element is skipped, because the SDK refers to it
   * through `tgrid`.
   *
   * @evidence contracts/common.md#principled-implementation Each namespace, default, and named import is registered under its alias so a name resolves to the same local binding.
   * @evidence contracts/common.md#clear-and-simple-design One loop over the merged imports.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The skipped element is the one binding that the generated code supplies itself.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Source path spelling uses Node path.resolve and relative imports use path.relative followed by native-separator conversion to forward slashes. Package registration uses a node_modules marker; normalization is lexical, not symlink or filesystem-case canonicalization.
   */
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

  /**
   * Every identifier the imports bind in the file.
   *
   * @evidence contracts/common.md#principled-implementation The namespace, the default, and each named local are collected, so a caller can see what a route name would shadow.
   * @evidence contracts/common.md#clear-and-simple-design One loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the components without changing them.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ImportDictionary.prototype.locals composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  public locals(): string[] {
    const output: string[] = [];
    for (const { second: c } of this.components_) {
      if (c.asterisk !== null) output.push(c.asterisk);
      if (c.default !== null) output.push(c.default);
      for (const { first: local } of c.elements) output.push(local);
    }
    return output;
  }

  /**
   * Returns registered bindings in the route import representation, retaining
   * normalized module paths and local-to-exported aliases. The route emitter
   * consumes these as type-only declarations.
   *
   * @evidence contracts/common.md#principled-implementation The projection reads the same normalized module keys and local-to-exported binding map used by toStatements, so a structural type writer and its route retain the same imports.
   * @evidence contracts/common.md#clear-and-simple-design One projection over existing registrations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No AST parsing or second import policy reconstructs the bindings.
   * @evidence contracts/common.md#meaningful-documentation Documents normalized paths, alias direction and the route's type-only consumption.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ImportDictionary.prototype.toImports composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  public toImports(): IReflectImport[] {
    return Array.from(this.components_).map(({ second: component }) => {
      const bindings = Array.from(component.elements);
      const aliases = Object.fromEntries(
        bindings
          .filter(({ first, second }) => first !== second)
          .map(({ first, second }) => [first, second]),
      );
      return {
        file: component.file,
        asterisk: component.asterisk,
        default: component.default,
        elements: bindings.map(({ first }) => first),
        ...(Object.keys(aliases).length ? { elementAliases: aliases } : {}),
      };
    });
  }

  /**
   * Registers an import of a package and returns the local name it binds.
   *
   * @evidence contracts/common.md#principled-implementation The file is placed under `node_modules`, so the printer emits the bare package specifier.
   * @evidence contracts/common.md#clear-and-simple-design One delegation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It shares the registration of `internal`.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Source path spelling uses Node path.resolve and relative imports use path.relative followed by native-separator conversion to forward slashes. Package registration uses a node_modules marker; normalization is lexical, not symlink or filesystem-case canonicalization.
   */
  public external(props: ImportDictionary.IProps): string {
    const file: string = `node_modules/${props.file}`;
    return this.internal({
      ...props,
      file,
    });
  }

  /**
   * Registers an import of a source file and returns the local name it binds.
   *
   * @evidence contracts/common.md#principled-implementation The path is normalized and its source extension removed, so equal normalized module spellings share a component, and a named binding is stored under its local name. Symlink and filesystem-case identity are not canonicalized.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result is the alias when there is one.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Source path spelling uses Node path.resolve and relative imports use path.relative followed by native-separator conversion to forward slashes. Package registration uses a node_modules marker; normalization is lexical, not symlink or filesystem-case canonicalization.
   */
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

  /**
   * Returns the import declarations, packages first and files after them,
   * sorted by module, with paths relative to the output directory.
   *
   * @evidence contracts/common.md#principled-implementation The package paths are cut at their last `node_modules`, and a file path is made relative with forward slashes, so the output does not depend on the platform.
   * @evidence contracts/common.md#clear-and-simple-design One function over one filter helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Both groups are sorted and separated by one empty line.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Source path spelling uses Node path.resolve and relative imports use path.relative followed by native-separator conversion to forward slashes. Package registration uses a node_modules marker; normalization is lexical, not symlink or filesystem-case canonicalization.
   */
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
              this.toImportClause(c),
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

  private toImportClause(c: ICompositeValue): ImportClause {
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
  /**
   * One import to register: its kind, its module, its name, an optional alias,
   * and whether it is type-only.
   *
   * @evidence contracts/common.md#principled-implementation The record is the argument of both registrations.
   * @evidence contracts/common.md#clear-and-simple-design A flat record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Source path spelling uses Node path.resolve and relative imports use path.relative followed by native-separator conversion to forward slashes. Package registration uses a node_modules marker; normalization is lexical, not symlink or filesystem-case canonicalization.
   */
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
