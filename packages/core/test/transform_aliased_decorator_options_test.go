package test

import (
	"path/filepath"
	"strings"
	"testing"
)

// TestTransformAliasedDecoratorOptions verifies aliased decorators retain
// their own configured validation and serialization protocols.
//
// Renaming an import does not change its resolved declaration. Each decorator
// must receive its own argument; a response discriminator cannot stand in for
// a missing body or query validator.
//
//  1. Author one real core declaration package and a four-decorator controller.
//  2. Transform with validate mode and assert serialization enabled.
//  3. Repeat with assert validation and require the report flag to be absent.
//
// @evidence contracts/testing.md#behavioral-verification The source operation injects the configured body/query descriptors, an assert route descriptor and a parameter caster through renamed imports. Only validate mode supplies the true report flag; assert mode must omit it.
// @evidence contracts/testing.md#independent-expectations Resolved core declarations establish decorator ownership; literal validate/assert options independently establish their public protocols and parameter-report policy. Expected values are not computed from emitted helpers.
// @evidence contracts/testing.md#distinguishing-cases Aliased body, query, path and response calls each have their own positive assertion with otherwise identical assert/validate controls. DirectCoreImportDeclaringPackage owns same-spelling foreign declaration and re-export controls. Disabled entry filtering belongs to the public ttsc wrapper and is not claimed by this Go operation.
// @evidence contracts/testing.md#execution-ownership Go discovers this matching Test and invokes the source operation in-process. Authored declarations and DTOs are language inputs; no native binary, Node process, JavaScript consumer, installation or application is prepared.
func TestTransformAliasedDecoratorOptions(t *testing.T) {
	root := t.TempDir()
	writeCoreDeclarationPackage(t, root, `export declare function TypedBody(): ParameterDecorator;
export declare function TypedQuery(): ParameterDecorator;
export declare function TypedParam(name: string): ParameterDecorator;
export declare namespace TypedRoute { function Post(path?: string): MethodDecorator; }`)
	writeFile(t, filepath.Join(root, "main.ts"), `import { TypedBody as Body, TypedQuery as Query, TypedParam as Param, TypedRoute as Route } from "@nestia/core";
interface IArticle { title: string; count: number; }
interface ISearch { keyword: string; }
export class Controller {
  @Route.Post(":id")
  public store(@Param("id") id: string, @Query() query: ISearch, @Body() input: IArticle): IArticle { return input; }
}`)
	writeFile(t, filepath.Join(root, "tsconfig.json"), `{"compilerOptions":{"target":"ES2022","module":"commonjs","strict":true,"experimentalDecorators":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`)
	for _, mode := range []string{"validate", "assert"} {
		plugins := coreNativePlugins(mode, "assert")
		out, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", plugins})
		if code != 0 {
			t.Fatalf("source transform mode=%s exited %d: %s", mode, code, diagnostics)
		}
		mustDecorateAll(t, out, `@Body`, mode)
		mustDecorateAll(t, out, `@Query`, mode)
		mustDecorateAll(t, out, `@Route\.Post`, "assert")
		mustSpansContain(t, out, `@Param`, `@Param("id", (input: string)`)
		spans := decoratorSpans(out, `@Param`)
		if len(spans) != 1 || strings.Contains(spans[0], `}, true)`) != (mode == "validate") {
			t.Fatalf("aliased parameter report flag disagrees with %s: %s", mode, out)
		}
	}
}
