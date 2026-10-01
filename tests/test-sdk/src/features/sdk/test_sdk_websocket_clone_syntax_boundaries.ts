import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies WebSocket cloning follows TypeScript declaration and import syntax.
 *
 * Semicolon insertion, comments and template literal types determine syntax
 * boundaries; scanning for the next semicolon can copy unrelated declarations.
 *
 * 1. Write a no-semicolon provider and a sibling type imported under an alias.
 * 2. Clone the provider through the SDK programmer into a temporary output.
 * 3. Assert its exact declaration, real dependency and absent commented import.
 *
 * @evidence contracts/testing.md#behavioral-verification The built programmer writes Provider and Shared files; exact authored declaration text and a rewritten real import distinguish declaration over-capture and commented-import matches.
 * @evidence contracts/testing.md#independent-expectations Expected declaration and import strings come from authored valid TypeScript syntax and the structures layout, rather than programmer output.
 * @evidence contracts/testing.md#distinguishing-cases The no-semicolon alias contains a template semicolon and uses an aliased dependency; a following declaration and a commented import with a string-literal name must not be copied. A semicolon-terminated singleton alias, TSX, legacy parameter decorators with auto accessors and an angle assertion, and standard decorators after export/default are controls; JSX remains filename-specific and unrelated runtime declarations stay absent.
 * @evidence contracts/testing.md#execution-ownership Unit: this discoverable export directly calls the built private programmer on inert source files and removes its unique temporary directory in finally; no compiler or host starts.
 */
export const test_sdk_websocket_clone_syntax_boundaries =
  async (): Promise<void> => {
    const { SdkWebSocketCloneProgrammer } = require(
      path.resolve(
        process.cwd(),
        "../../packages/sdk/lib/generates/internal/SdkWebSocketCloneProgrammer",
      ),
    ) as {
      SdkWebSocketCloneProgrammer: {
        write: (app: object) => Promise<Set<string>>;
      };
    };
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-clone-syntax-"));
    try {
      const provider = [
        "export type Provider = {",
        "  value: `semi;${string}`",
        "  shared: Local",
        '  note: "Ghost"',
        "}",
      ].join("\n");
      const source = path.join(root, "Provider.ts");
      fs.writeFileSync(
        source,
        [
          '// import type { Ghost } from "./not-real";',
          'import type { Shared as Local } from "./Shared"',
          provider,
          "export interface Following { unrelated: string; }",
          "export type Control = string;",
        ].join("\n"),
      );
      fs.writeFileSync(
        path.join(root, "Shared.ts"),
        "export interface Shared { text: string }",
      );
      const tsx = path.join(root, "TsxProvider.tsx");
      fs.writeFileSync(
        tsx,
        "const component = <div />;\nexport interface TsxProvider { text: string }",
      );
      const decorated = path.join(root, "DecoratedProvider.ts");
      fs.writeFileSync(
        decorated,
        "declare const decorator: ClassDecorator;\ndeclare const parameter: ParameterDecorator;\n@decorator class Controller { accessor value = 1; constructor(@parameter input: string) {} }\nconst value = <number>1;\nexport interface DecoratedProvider { text: string }",
      );
      const standard = path.join(root, "StandardProvider.ts");
      fs.writeFileSync(
        standard,
        "declare function decorator<T extends Function>(value: T, context: ClassDecoratorContext): T;\nexport @decorator class Controller { accessor value = 1; }\nexport default @decorator class DefaultController {}\nexport interface StandardProvider { text: string }",
      );
      const output = path.join(root, "output");
      await SdkWebSocketCloneProgrammer.write({
        project: { config: { output } },
        routes: [
          {
            protocol: "websocket",
            imports: [{ file: source, elements: ["Provider", "Control"] }],
          },
        ],
      });
      await SdkWebSocketCloneProgrammer.write({
        project: { config: { output: path.join(root, "syntax-controls") } },
        routes: [
          {
            protocol: "websocket",
            imports: [
              { file: tsx, elements: ["TsxProvider"] },
              { file: decorated, elements: ["DecoratedProvider"] },
              { file: standard, elements: ["StandardProvider"] },
            ],
          },
        ],
      });
      for (const name of [
        "TsxProvider",
        "DecoratedProvider",
        "StandardProvider",
      ])
        TestValidator.equals(
          `${name} syntax control`,
          fs.readFileSync(
            path.join(root, "syntax-controls/structures", `${name}.ts`),
            "utf8",
          ),
          `export interface ${name} { text: string }\n`,
        );
      TestValidator.equals(
        "provider declaration boundary",
        fs.readFileSync(path.join(output, "structures/Provider.ts"), "utf8"),
        'import type { Shared as Local } from "./Shared";\n\n' +
          provider +
          "\n",
      );
      TestValidator.equals(
        "dependency declaration",
        fs.readFileSync(path.join(output, "structures/Shared.ts"), "utf8"),
        "export interface Shared { text: string }\n",
      );
      TestValidator.equals(
        "semicolon control",
        fs.readFileSync(path.join(output, "structures/Control.ts"), "utf8"),
        "export type Control = string;\n",
      );
      TestValidator.equals(
        "only reached declarations",
        fs.readdirSync(path.join(output, "structures")).sort(),
        ["Control.ts", "Provider.ts", "Shared.ts"],
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
