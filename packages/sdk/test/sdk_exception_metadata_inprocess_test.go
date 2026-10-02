package test

import (
	"strings"
	"testing"
)

// Verifies the in-process SDK metadata pass injects typed-exception metadata for
// both a synthetic TypeGuardError response and a union exception type, exercising
// the TypeGuardError schema-pipe shortcut and the union-order restoration the
// checker-driven metadata pass would otherwise leave un-pinned.
//
// nestiaSDKExceptionResponses walks each method decorator: a
// @TypedException<TypeGuardError>() routes through
// nestiaSDKTypeGuardErrorSchemaPipe (and its hand-built BaseSchema / atomic /
// constant / object-reference helpers) instead of the typia metadata factory,
// because typia cannot reflect the platform error class. A union exception
// type drives nestiaSDKRestoreUnionOrder -> nestiaSDKUnionTypeNames /
// nestiaSDKUnionRank, which reorder the collected objects to match source
// declaration order. This drives the whole exception controller through the
// exported EmitTransform IN-PROCESS (LoadProgram with no ForceEmit/outDir), so
// nothing is written to disk and coverage is attributed to the SDK package.
//
//  1. Load ExceptionController plus its structures into a program.
//  2. Run EmitTransform and decode every injected OperationMetadata literal.
//  3. Assert the TypeGuardError synthetic schema, the named exceptions, and the
//     union exception members are all present.
//
// @evidence contracts/testing.md#behavioral-verification Collected exception metadata must retain the synthetic typia TypeGuardError schema fields, authored exception names, union members and throws text.
// @evidence contracts/testing.md#independent-expectations The handwritten decorators, union declarations and JSDoc establish these exception identities and descriptions; typia guard errors require their documented method/expected schema fields.
// @evidence contracts/testing.md#distinguishing-cases This covers synthetic and named exceptions, union constituents and documentation preservation; local same-name TypeGuardError provenance is exercised by the SDK generated-Swagger fixture. Substring assertions do not validate every exception association.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKExceptionMetadataInProcess(t *testing.T) {
	root, prog := loadFeatureProgram(t, "exception", []string{
		"controllers/ExceptionController.ts",
		"api/structures/IBbsArticle.ts",
		"api/structures/IExceptional.ts",
		"api/structures/IInternalServerError.ts",
		"api/structures/INotFound.ts",
		"api/structures/IUnprocessibleEntity.ts",
	})
	_ = root
	defer prog.Close()
	meta := strings.Join(collectEmittedMetadata(t, prog), "\n")
	for _, expected := range []string{
		// TypeGuardError synthetic schema cluster (nestiaSDKTypeGuardErrorSchemaPipe);
		// property keys ride as string-constant schema values.
		`"name":"TypeGuardErrorany"`,
		`"value":"method"`,
		`"value":"expected"`,
		// The named exception structures collected across decorators.
		`"name":"BadRequestException"`,
		`"name":"INotFound"`,
		`"name":"IUnprocessibleEntity"`,
		`"name":"IInternalServerError"`,
		// The union exception members (IExceptional.*) and union return members,
		// which only appear once the union-order pass walks the union type node.
		`IExceptional.Something`,
		`IExceptional.Nothing`,
		`IExceptional.Everything`,
		// The @throws / @throw JSDoc tags survive into the metadata.
		`"name":"throws"`,
		`"text":"400 invalid request"`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("exception metadata is missing %q\n%s", expected, meta)
		}
	}
}
