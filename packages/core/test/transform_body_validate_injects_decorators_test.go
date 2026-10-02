package test

import "testing"

// TestTransformBodyValidateInjectsDecorators verifies the in-process
// transform.Run `transform --file` path drives the full core + typia node
// transform and writes the rewritten TypeScript carrying the injected
// @core.TypedRoute / @core.TypedBody validator arguments to the --out file.
//
// This checks transformation input and output in the Go test process:
// runTransform loads the authored program, composes the typia / core /
// contributor transforms, and prints the target file. The assertions inspect
// rewritten TypeScript for argument injection and printer regressions; they do
// not execute generated JavaScript, an installed CLI, or a consumer runtime.
//
//  1. Point the body feature's own tsconfig at TypedBodyController.
//  2. Call transform.Run with a @nestia/core validate/assert plugin and --out.
//  3. Assert the injected decorator arguments appear in the emitted source.
//
// @evidence contracts/testing.md#behavioral-verification The body fixture transform must inject both the TypedRoute.Post and TypedBody object arguments and a validate-report helper; untouched decorators cannot satisfy these assertions.
// @evidence contracts/testing.md#independent-expectations The body validate mode requires a report validator and response transformation. The handwritten controller supplies the route and body independently of the generated argument text.
// @evidence contracts/testing.md#distinguishing-cases This pins injection and report-helper presence for validate. Other mode tests pin discriminator choices and the runtime batch checks valid, malformed, equality, clone and prune values.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformBodyValidateInjectsDecorators(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validate", "assert")
	mustDecorateAll(t, out, `@core\.TypedRoute\.[A-Za-z]+`, "assert")
	mustDecorateAll(t, out, `@core\.TypedBody`, "validate")
	mustContainAll(t, out, "_validateReport")
}
