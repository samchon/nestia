import fs from "fs";
import path from "path";

import { ITypedApplication } from "../../structures/ITypedApplication";

export namespace SdkWebSocketCloneProgrammer {
  export const write = async (app: ITypedApplication): Promise<Set<string>> => {
    const ctx: IContext = {
      output: `${app.project.config.output}/structures`,
      outputs: new Map(),
      visited: new Map(),
    };
    const cloned: Set<string> = new Set();
    for (const route of app.routes)
      if (route.protocol === "websocket")
        for (const imp of route.imports)
          for (const local of imp.elements) {
            const imported: string = imp.elementAliases?.[local] ?? local;
            if (await clone(ctx)(imp.file, imported))
              cloned.add(importKey(imp.file, imported));
          }
    return cloned;
  };

  const clone =
    (ctx: IContext) =>
    async (file: string, name: string): Promise<boolean> => {
      const location: string | null = await resolveSourceFile(file);
      if (location === null || isNodeModulesPath(location)) return false;

      const key: string = `${location}#${name}`;
      const status: CloneStatus | undefined = ctx.visited.get(key);
      if (status === "written" || status === "pending") return true;
      else if (status === "missing") return false;
      ctx.visited.set(key, "pending");

      const text: string = await fs.promises.readFile(location, "utf8");
      const declarations: string[] = getDeclarations(text, name);
      if (declarations.length === 0) {
        ctx.visited.set(key, "missing");
        return false;
      }

      const body: string = declarations.join("\n\n");
      const imports: string[] = await collectImports(ctx)({
        body,
        location,
        source: text,
        target: name,
      });

      const content: string =
        [...imports, body].filter((line) => line.length).join("\n\n") + "\n";
      const oldbie: string | undefined = ctx.outputs.get(name);
      if (oldbie !== undefined && oldbie !== content) {
        ctx.visited.set(key, "missing");
        return false;
      }
      ctx.outputs.set(name, content);

      await fs.promises.mkdir(ctx.output, { recursive: true });
      await fs.promises.writeFile(`${ctx.output}/${name}.ts`, content, "utf8");
      ctx.visited.set(key, "written");
      return true;
    };

  const collectImports =
    (ctx: IContext) =>
    async (props: {
      body: string;
      location: string;
      source: string;
      target: string;
    }): Promise<string[]> => {
      const imports: string[] = [];
      const add = (line: string): void => {
        if (imports.includes(line) === false) imports.push(line);
      };

      for (const imp of getImports(props.source)) {
        const relative: boolean = imp.specifier.startsWith(".");
        for (const elem of imp.elements) {
          if (uses(props.body, elem.local) === false) continue;

          if (relative === false) {
            add(imp.text);
            continue;
          }

          const sourceFile: string = path.resolve(
            path.dirname(props.location),
            imp.specifier,
          );
          if ((await clone(ctx)(sourceFile, elem.imported)) === false) {
            add(imp.text);
            continue;
          }
          add(
            `import type { ${elem.imported}${elem.imported === elem.local ? "" : ` as ${elem.local}`} } from "./${elem.imported}";`,
          );
        }
        for (const name of [imp.default, imp.namespace])
          if (name !== null && uses(props.body, name)) add(imp.text);
      }

      for (const name of getExportedNames(props.source)) {
        if (name === null || name === props.target) continue;
        if (uses(props.body, name) === false) continue;
        if ((await clone(ctx)(props.location, name)) === true)
          add(`import type { ${name} } from "./${name}";`);
      }
      return imports.sort();
    };

  const resolveSourceFile = async (file: string): Promise<string | null> => {
    const base: string = trimRuntimeExtension(file);
    const candidates: string[] = [
      file,
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.d.ts`,
      path.join(base, "index.ts"),
      path.join(base, "index.d.ts"),
    ];
    for (const candidate of candidates) {
      try {
        const location: string = path.resolve(candidate);
        const stat: fs.Stats = await fs.promises.stat(location);
        if (stat.isFile()) return location;
      } catch {}
    }
    return null;
  };

  const trimRuntimeExtension = (file: string): string => {
    for (const ext of [".js", ".jsx", ".mjs", ".cjs"])
      if (file.endsWith(ext)) return file.slice(0, -ext.length);
    return file;
  };

  const getDeclarations = (source: string, name: string): string[] => {
    const output: string[] = [];
    const searchable: string = maskTrivia(source);
    const regex: RegExp = declarationRegex(name);
    for (const match of searchable.matchAll(regex)) {
      if (isTopLevel(searchable, match.index!) === false) continue;
      const end: number = declarationEnd(searchable, match.index!, match[1]!);
      if (end !== -1) output.push(source.slice(match.index!, end).trim());
    }
    return output;
  };

  const getExportedNames = (source: string): string[] => {
    const searchable: string = maskTrivia(source);
    return Array.from(
      searchable.matchAll(declarationRegex("[A-Za-z_$][\\w$]*")),
    )
      .filter((match) => isTopLevel(searchable, match.index!))
      .map((match) => match[2]!);
  };

  const declarationRegex = (name: string): RegExp =>
    new RegExp(
      `export\\s+(?:declare\\s+)?(interface|type|enum|namespace|class)\\s+(${name})\\b`,
      "g",
    );

  const declarationEnd = (
    source: string,
    start: number,
    kind: string,
  ): number => {
    let depth: number = 0;
    let block: boolean = false;
    for (let i = start; i < source.length; ++i) {
      const ch: string = source[i]!;
      if (ch === "{") {
        ++depth;
        block = true;
      } else if (ch === "}") {
        --depth;
        if (kind !== "type" && block && depth === 0) return i + 1;
      } else if (ch === ";" && block === false && depth === 0) return i + 1;
      else if (ch === ";" && kind === "type" && depth === 0) return i + 1;
    }
    return -1;
  };

  const isTopLevel = (source: string, index: number): boolean => {
    let depth: number = 0;
    for (let i = 0; i < index; ++i) {
      const ch: string = source[i]!;
      if (ch === "{") ++depth;
      else if (ch === "}") --depth;
    }
    return depth === 0;
  };

  const maskTrivia = (source: string): string => {
    const out: string[] = source.split("");
    const mask = (index: number): void => {
      if (out[index] !== "\n" && out[index] !== "\r") out[index] = " ";
    };

    let quote: string | null = null;
    let escaped: boolean = false;
    for (let i = 0; i < out.length; ++i) {
      const ch: string = source[i]!;
      const next: string | undefined = source[i + 1];
      if (quote !== null) {
        mask(i);
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === quote) quote = null;
      } else if (ch === "/" && next === "/") {
        mask(i++);
        for (; i < out.length && source[i] !== "\n"; ++i) mask(i);
        --i;
      } else if (ch === "/" && next === "*") {
        mask(i++);
        mask(i);
        for (++i; i < out.length; ++i) {
          const current: string = source[i]!;
          const following: string | undefined = source[i + 1];
          mask(i);
          if (current === "*" && following === "/") {
            mask(++i);
            break;
          }
        }
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
        mask(i);
      }
    }
    return out.join("");
  };

  const getImports = (source: string): IImport[] =>
    Array.from(
      source.matchAll(/import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];?/g),
    ).map((match) => {
      const clause: string = match[1]!.trim();
      const specifier: string = match[2]!;
      return {
        text: match[0]!.trim(),
        specifier,
        default: defaultImportName(clause),
        namespace: namespaceImportName(clause),
        elements: namedImportElements(clause),
      };
    });

  const defaultImportName = (clause: string): string | null => {
    const first: string = clause
      .split(",")[0]!
      .trim()
      .replace(/^type\s+/, "");
    return first.length && first.startsWith("{") === false ? first : null;
  };

  const namespaceImportName = (clause: string): string | null => {
    const match: RegExpMatchArray | null = clause.match(/\*\s+as\s+(\w+)/);
    return match?.[1] ?? null;
  };

  const namedImportElements = (clause: string): IImportElement[] => {
    const match: RegExpMatchArray | null = clause.match(/\{([\s\S]*?)\}/);
    if (match === null) return [];
    return match[1]!
      .split(",")
      .map((part) => part.trim().replace(/^type\s+/, ""))
      .filter((part) => part.length)
      .map((part) => {
        const pieces: string[] = part.split(/\s+as\s+/);
        const imported: string = pieces[0]!.trim();
        return {
          imported,
          local: (pieces[1] ?? imported).trim(),
        };
      });
  };

  const uses = (body: string, name: string): boolean =>
    new RegExp(`\\b${escapeRegExp(name)}\\b`).test(body);

  const escapeRegExp = (str: string): string =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  export const importKey = (file: string, name: string): string =>
    `${file}#${name}`;

  export const isNodeModulesPath = (file: string): boolean =>
    path
      .resolve(file)
      .split(/[\\/]+/)
      .includes("node_modules");
}

interface IContext {
  output: string;
  outputs: Map<string, string>;
  visited: Map<string, CloneStatus>;
}

type CloneStatus = "pending" | "written" | "missing";

interface IImport {
  text: string;
  specifier: string;
  default: string | null;
  namespace: string | null;
  elements: IImportElement[];
}

interface IImportElement {
  imported: string;
  local: string;
}
