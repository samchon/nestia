const { version } = require("../../../../package.json");
const cp = require("child_process");
const fs = require("fs");

const ROOT = `${__dirname}/../..`;
const ASSETS = `${ROOT}/assets`;
const TYPIA = require("js-yaml").load(
  fs.readFileSync(`${__dirname}/../../../../pnpm-lock.yaml`, "utf8"),
).catalogs.samchon;

const update = (content, options = {}) => {
  const parsed = JSON.parse(content);
  for (const record of [
    parsed.dependencies ?? {},
    parsed.devDependencies ?? {},
  ])
    for (const key of Object.keys(record))
      if (key.startsWith("@nestia/") || key === "nestia")
        record[key] = `^${version}`;
      else if (TYPIA[key]) record[key] = TYPIA[key].specifier;
  migratePackageJson(parsed);
  if (options.sdkAggregate) {
    parsed.devDependencies ??= {};
    parsed.devDependencies["@nestia/core"] = `^${version}`;
  }
  return JSON.stringify(parsed, null, 2);
};

const migratePackageJson = (parsed) => {
  if (parsed.scripts)
    for (const [key, value] of Object.entries(parsed.scripts))
      if (typeof value === "string")
        parsed.scripts[key] = normalizeScript(value);

  const devDependencies = parsed.devDependencies;
  if (devDependencies) {
    const usesTypeScript = typeof devDependencies.typescript === "string";
    delete devDependencies["typescript-transform-paths"];
    if (usesTypeScript) devDependencies.ttsc ??= "^0.10.2";
  }
};

const trimTemplateDependencies = (parsed) => {
  if (parsed.dependencies) {
    delete parsed.dependencies.commander;
    delete parsed.dependencies.inquirer;
  }
  if (parsed.devDependencies) {
    delete parsed.devDependencies["@types/inquirer"];
    delete parsed.devDependencies.commander;
    delete parsed.devDependencies.inquirer;
  }
};

const normalizeScript = (script) =>
  script.replace(/(^|[^A-Za-z0-9_-])tsc(?=$|[^A-Za-z0-9_-])/g, "$1ttsc");

const ARGUMENT_PARSER = `import { createInterface } from "node:readline/promises";

export namespace ArgumentParser {
  export interface Command {
    option: (flags: string, description?: string) => Command;
  }

  export interface Prompt {
    select: (
      name: string,
    ) => (
      message: string,
    ) => <Choice extends string>(choices: Choice[]) => Promise<Choice>;
    boolean: (name: string) => (message: string) => Promise<boolean>;
    number: (name: string) => (message: string) => Promise<number>;
  }

  export const parse = async <T>(
    inquiry: (
      command: Command,
      prompt: Prompt,
      action: (closure: (options: Partial<T>) => Promise<T>) => Promise<T>,
    ) => Promise<T>,
  ): Promise<T> => {
    const command: Command = {
      option: (_flags: string, _description?: string): Command => command,
    };
    const action = (closure: (options: Partial<T>) => Promise<T>) =>
      closure(parseArguments() as Partial<T>);
    return inquiry(
      command,
      { select, boolean, number },
      action,
    );
  };

  const select =
    (_name: string) =>
    (message: string) =>
    async <Choice extends string>(choices: Choice[]): Promise<Choice> => {
      const answer: string = await ask(\`\${message} (\${choices.join("/")})\`);
      return (choices.find((choice) => choice === answer) ?? choices[0])!;
    };

  const boolean = (_name: string) => async (message: string) =>
    /^(true|t|yes|y|1)$/i.test(await ask(\`\${message} [y/N]\`));

  const number = (_name: string) => async (message: string) =>
    Number(await ask(message));

  const ask = async (message: string): Promise<string> => {
    const reader = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      return (await reader.question(\`\${message}: \`)).trim();
    } finally {
      reader.close();
    }
  };

  const parseArguments = (): Record<string, string | string[] | boolean> => {
    const output: Record<string, string | string[] | boolean> = {};
    const args: string[] = process.argv.slice(2);
    for (let i = 0; i < args.length; ++i) {
      const raw: string = args[i]!;
      if (raw.startsWith("--") === false) continue;

      const equal: number = raw.indexOf("=");
      const name: string = toCamelCase(
        raw.slice(2, equal === -1 ? undefined : equal),
      );
      if (equal !== -1) {
        assign(output, name, raw.slice(equal + 1));
        continue;
      }

      const values: string[] = [];
      while (i + 1 < args.length && args[i + 1]!.startsWith("--") === false)
        values.push(args[++i]!);
      assign(
        output,
        name,
        values.length === 0 ? true : values.length === 1 ? values[0]! : values,
      );
    }
    return output;
  };

  const assign = (
    output: Record<string, string | string[] | boolean>,
    name: string,
    value: string | string[] | boolean,
  ): void => {
    const current: string | string[] | boolean | undefined = output[name];
    if (current === undefined) output[name] = value;
    else
      output[name] = [
        ...(Array.isArray(current) ? current : [String(current)]),
        ...(Array.isArray(value) ? value : [String(value)]),
      ];
  };

  const toCamelCase = (str: string): string =>
    str.replace(/-([a-z])/g, (_matched, letter: string) =>
      letter.toUpperCase(),
    );
}
`;

const updateTsConfig = (content) => {
  content = content.replace(
    /^\s*\{\s*"transform":\s*"typescript-transform-paths"\s*\},\n/gm,
    "",
  );
  content = content.replace(
    /^\s*\{\s*"transform":\s*"typia\/lib\/transform"(?:,\s*"enabled":\s*false)?\s*\},?\n/gm,
    "",
  );
  content = content.replace(
    /^\s*\{\s*"transform":\s*"@nestia\/core\/lib\/transform"\s*\},?\n/gm,
    "",
  );
  content = content.replace(
    /^\s*\{\s*"transform":\s*"@nestia\/core\/native\/transform\.cjs"\s*\},?\n/gm,
    "",
  );
  content = content.replace(
    /^\s*\{\s*"transform":\s*"@nestia\/sdk\/lib\/transform"\s*\},\n/gm,
    "",
  );
  return content;
};

const bundle = async ({ mode, repository, revision, exceptions, transform }) => {
  const root = `${__dirname}/../..`;
  const assets = `${root}/assets`;
  const template = `${assets}/${mode}`;

  const clone = async () => {
    // CLONE REPOSITORY
    if (fs.existsSync(template))
      await fs.promises.rm(template, { recursive: true });
    else
      try {
        await fs.promises.mkdir(ASSETS);
      } catch {}

    cp.execSync(`git clone https://github.com/samchon/${repository} ${mode}`, {
      cwd: ASSETS,
    });
    // The template repositories are live projects; an unpinned clone lets any
    // upstream push break this build (samchon/nestia-start#632 did exactly
    // that), so every bundle checks out a reviewed revision.
    cp.execSync(`git checkout ${revision}`, {
      cwd: template,
      stdio: "pipe",
    });

    // REMOVE VULNERABLE FILES
    for (const location of exceptions ?? [])
      await fs.promises.rm(`${template}/${location}`, { recursive: true });
  };

  const iterate = (collection) => async (location) => {
    const directory = await fs.promises.readdir(location);
    for (const file of directory) {
      const absolute = location + "/" + file;
      const stats = await fs.promises.stat(absolute);
      if (stats.isDirectory()) await iterate(collection)(absolute);
      else {
        const content = await fs.promises.readFile(absolute, "utf-8");
        collection[
          (() => {
            const str = absolute.replace(template, "");
            return str[0] === "/" ? str.substring(1) : str;
          })()
        ] = content;
      }
    }
  };

  const archive = async (collection) => {
    const name = `${mode.toUpperCase()}_TEMPLATE`;
    const body = JSON.stringify(collection, null, 2);
    const content = `export const ${name}: Record<string, string> = ${body}`;

    try {
      await fs.promises.mkdir(`${ROOT}/src/bundles`);
    } catch {}
    await fs.promises.writeFile(
      `${ROOT}/src/bundles/${name}.ts`,
      content,
      "utf8",
    );
  };

  const collection = {};
  await clone();
  await iterate(collection)(template);
  if (transform)
    for (const [key, value] of Object.entries(collection))
      collection[key] = await writeTransformedAsset(
        template,
        key,
        transform(key, value),
      );
  await archive(collection);
};

const writeTransformedAsset = async (template, key, value) => {
  await fs.promises.writeFile(`${template}/${key}`, value, "utf8");
  return value;
};

const main = async () => {
  await bundle({
    mode: "nest",
    repository: "nestia-start",
    // nestia-start's master was restructured into a pnpm monorepo
    // (samchon/nestia-start#632), while the migrate programmers still emit
    // the single-package layout. Stay pinned to the last compatible commit
    // until NEST_TEMPLATE and the programmers adopt the monorepo structure.
    revision: "1057bccd13d75bbe49a73024a0273147999bf818",
    exceptions: [
      ".git",
      ".github/dependabot.yml",
      ".github/workflows/dependabot-automerge.yml",
      "src/api/functional",
      "src/controllers",
      "src/MyModule.ts",
      "src/providers",
      "test/features",
    ],
    transform: (key, value) => {
      if (key.endsWith("package.json")) {
        const parsed = JSON.parse(update(value));
        trimTemplateDependencies(parsed);
        return JSON.stringify(parsed, null, 2);
      }
      if (key === "test/helpers/ArgumentParser.ts") return ARGUMENT_PARSER;
      if (key.endsWith("tsconfig.json"))
        return updateTsConfig(value);
      return value;
    },
  });
  await bundle({
    mode: "sdk",
    repository: "nestia-sdk-template",
    revision: "8cfb771ea2bdc1692ce256863a0ada49990214a8",
    exceptions: [
      ".git",
      ".github/dependabot.yml",
      ".github/workflows/build.yml",
      ".github/workflows/dependabot-automerge.yml",
      "src/functional",
      "src/structures",
      "test/features",
    ],
    transform: (key, value) => {
      if (key.endsWith("package.json")) {
        const parsed = JSON.parse(
          update(value, { sdkAggregate: key === "package.json" }),
        );
        trimTemplateDependencies(parsed);
        return JSON.stringify(parsed, null, 2);
      }
      if (key === "test/utils/ArgumentParser.ts") return ARGUMENT_PARSER;
      if (key.endsWith("tsconfig.json"))
        return updateTsConfig(value);
      return value;
    },
  });
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
