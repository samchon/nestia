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
		// The four named exception structures collected across decorators.
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
