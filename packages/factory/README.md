# `@nestia/factory`

Printer-compatible TypeScript AST node factory for Nestia code generators.

`@nestia/factory` builds the subset of AST node objects that the TypeScript
printer can turn back into source text for `@nestia/sdk` and `@nestia/migrate`
code generation. It is not a semantic compiler API clone, transformer host, or
type-checker bridge; its public shape mirrors the `ts.factory` methods those
generators call.

```ts
import { TypeScriptFactory } from "@nestia/factory";

const identifier = TypeScriptFactory.createIdentifier("value");
```

```ts
import nts, { TypeScriptFactory, TypeScriptPrinter } from "@nestia/factory";

const script = TypeScriptPrinter.write({
  statements: [
    nts.factory.createExpressionStatement(
      TypeScriptFactory.createIdentifier("value"),
    ),
  ],
});
```
