package test

import (
	"encoding/json"
	"sort"
	"strings"
	"testing"
)

// Verifies async aliases reflect their awaited response type.
//
// The generated client adds its own Promise around response metadata. Retaining
// a library Promise alias there would promise an async wrapper as the HTTP body.
//
//  1. Analyze direct, chained, defaulted, nested, compound and readonly Promise aliases.
//  2. Compare awaited payload trees with the ordinary user-wrapper alias.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must reflect the actual IPoint, Array<IPoint> and conditional payloads for direct/chained/defaulted/nested/compound/global/readonly library Promise aliases while retaining Opaque<IPoint> for the nonthenable user-wrapper alias. Payload imports must not leak the removed wrapper alias.
// @evidence contracts/testing.md#independent-expectations TypeScript alias substitution does not change library Promise awaiting; the HTTP response is IPoint. The authored Foreign.Promise contains value and no then method, so its alias remains an ordinary response object. With strictNullChecks and exactOptionalPropertyTypes disabled for optional writes, the optional tuple member accepts undefined; printer whitespace is immaterial to type syntax.
// @evidence contracts/testing.md#distinguishing-cases Direct, chained, defaulted, nested, array-compound, conditional and global-qualified aliases contrast a nonthenable same-spelled wrapper alias; complete type trees distinguish generic substitution and recursive awaiting and readonly syntax from indiscriminate alias expansion or name-based Promise unwrapping. Imported and Observable aliases have separate controls.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this native Test and calls EmitTransform against one authored checker program. Its temporary input and program are released without installed consumers, product compilation or hosts.
func TestSyntheticAsyncAliasReturnType(t *testing.T) {
	const controller = `import core from "@nestia/core";
export interface IPoint { x: number; }
export type Async<T> = Promise<T>;
export type Chained<T> = Async<T>;
export type Default<T = IPoint> = Async<T>;
export type Nested<T> = Promise<Promise<T>>;
export type Compound<T> = Promise<T[]>;
export type Conditional<T> = Promise<T extends string ? IPoint : T[]>;
export type Global<T> = globalThis.Promise<T>;
export type ReadonlyPayload<T> = Promise<readonly T[]>;
export type TuplePayload<T> = Promise<readonly [T, T?]>;
export namespace Foreign { export interface Promise<T> { value: T; } }
export type Opaque<T> = Foreign.Promise<T>;
export class SyntheticController {
  @core.TypedRoute.Get("direct")
  public direct(): Async<IPoint> { return null!; }
  @core.TypedRoute.Get("chained")
  public chained(): Chained<IPoint> { return null!; }
  @core.TypedRoute.Get("opaque")
  public opaque(): Opaque<IPoint> { return null!; }
  @core.TypedRoute.Get("default")
  public defaulted(): Default { return null!; }
  @core.TypedRoute.Get("nested")
  public nested(): Nested<IPoint> { return null!; }
  @core.TypedRoute.Get("compound")
  public compound(): Compound<IPoint> { return null!; }
  @core.TypedRoute.Get("conditional-string")
  public conditionalString(): Conditional<string> { return null!; }
  @core.TypedRoute.Get("conditional-object")
  public conditionalObject(): Conditional<IPoint> { return null!; }
  @core.TypedRoute.Get("global")
  public global(): Global<IPoint> { return null!; }
  @core.TypedRoute.Get("readonly")
  public readonlyPayload(): ReadonlyPayload<IPoint> { return null!; }
  @core.TypedRoute.Get("tuple")
  public tuplePayload(): TuplePayload<IPoint> { return null!; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	expected := []string{
		`{"name":"IPoint"}`,
		`{"name":"IPoint"}`,
		`{"name":"Opaque","typeArguments":[{"name":"IPoint"}]}`,
		`{"name":"IPoint"}`,
		`{"name":"IPoint"}`,
		`{"name":"Array","typeArguments":[{"name":"IPoint"}]}`,
		`{"name":"IPoint"}`,
		`{"name":"Array","typeArguments":[{"name":"IPoint"}]}`,
		`{"name":"IPoint"}`,
		`{"name":"readonly IPoint[]"}`,
		`{"name":"readonly[IPoint,(IPoint|undefined)?]"}`,
	}
	if len(literals) != len(expected) {
		t.Fatalf("expected %d operations, got %d", len(expected), len(literals))
	}
	for index, tree := range expected {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		actualType := syntheticField(t, success, "type").(map[string]any)
		var expectedType map[string]any
		if err := json.Unmarshal([]byte(tree), &expectedType); err != nil {
			t.Fatal(err)
		}
		// Formatting is not part of the reflected type's semantic contract.
		actualType["name"] = strings.Join(strings.Fields(actualType["name"].(string)), "")
		expectedType["name"] = strings.Join(strings.Fields(expectedType["name"].(string)), "")
		if actual := canonicalJSON(t, actualType); actual != canonicalJSON(t, expectedType) {
			t.Errorf("operation %d response type = %s, want %s", index, actual, tree)
		}
		imports := syntheticField(t, success, "imports").([]any)
		wanted := `["IPoint"]`
		if index == 2 {
			wanted = `["IPoint","Opaque"]`
		}
		bindings := []string{}
		for _, entry := range imports {
			file := syntheticField(t, entry, "file").(string)
			if !strings.HasSuffix(file, "/src/controllers/SyntheticController.ts") {
				t.Errorf("operation %d payload declaration file = %s", index, file)
			}
			for _, binding := range syntheticField(t, entry, "elements").([]any) {
				bindings = append(bindings, binding.(string))
			}
		}
		sort.Strings(bindings)
		if canonicalJSON(t, bindings) != wanted {
			t.Errorf("operation %d payload imports = %v, want %s", index, imports, wanted)
		}
	}
}
