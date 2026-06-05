package test

import "testing"

// TestTransformBodyValidateInjectsDecorators verifies the in-process
// transform.Run `transform --file` path drives the full core + typia node
// transform and writes the rewritten TypeScript carrying the injected
// @core.TypedRoute / @core.TypedBody validator arguments to the --out file.
//
// This exercises the engine seam end-to-end without spawning a subprocess:
// runTransform loads a real program, builds the typia / core / contributor
// transforms, and prints the target file. A regression in argument injection
// or the node-path printer would drop the generated validator arguments, so the
// presence of those literals pins the whole pipeline.
//
//  1. Point the body feature's own tsconfig at TypedBodyController.
//  2. Call transform.Run with a @nestia/core validate/assert plugin and --out.
//  3. Assert the injected decorator arguments appear in the emitted source.
func TestTransformBodyValidateInjectsDecorators(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validate", "assert")
	mustContainAll(t, out,
		"@core.TypedRoute.Post({",
		"@core.TypedBody({",
		"_validateReport",
	)
}
