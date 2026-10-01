package test

import (
	"strings"
	"testing"
)

// Verifies the SDK metadata pass over the swagger-example feature captures the
// rich JSDoc block, the named parameters, and the Promise-unwrapped success type
// the Swagger generator reads.
//
// The swagger-example BbsArticlesController carries a multi-tag JSDoc comment
// (@author/@param/@returns/@warning), @SwaggerExample decorators, and
// Promise<IBbsArticle> returns — a combination none of the leaner fixtures hit at
// once. It drives nestiaSDKMethodJSDoc / nestiaSDKParseJSDocTag /
// nestiaSDKParseParamTag, the parameter-name collection in visitNestiaSDKNode, and
// the Promise unwrap in nestiaSDKReflectTypeNode together, all through the
// exported EmitTransform with no disk emit.
//
//  1. Load the swagger-example controller and structure into a program.
//  2. Run EmitTransform and decode every injected OperationMetadata literal.
//  3. Assert the JSDoc tags, a named parameter, and the IBbsArticle success type
//     are all present.
//
// @evidence contracts/testing.md#behavioral-verification Metadata from the Swagger example controller must preserve author/warning/param/returns tags, the authored content description, input name and unwrapped article return.
// @evidence contracts/testing.md#independent-expectations The handwritten JSDoc and Promise<IBbsArticle> signature establish the expected descriptions and element type independently of generated metadata.
// @evidence contracts/testing.md#distinguishing-cases This covers populated multi-tag documentation, named body and Promise return; empty-tag and synthetic Promise cases distinguish missing text and wrapper leakage.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKSwaggerExampleMetadataInProcess(t *testing.T) {
	root, prog := loadFeatureProgram(t, "swagger-example", []string{
		"controllers/BbsArticlesController.ts",
		"api/structures/IBbsArticle.ts",
	})
	_ = root
	defer prog.Close()
	meta := strings.Join(collectEmittedMetadata(t, prog), "\n")
	for _, expected := range []string{
		// Multi-tag JSDoc survives into the metadata.
		`"name":"author"`,
		`"name":"warning"`,
		`"name":"param"`,
		`"name":"returns"`,
		// A named @param entry threads through nestiaSDKParseParamTag.
		`Content to store`,
		// The Promise<IBbsArticle> return unwraps to the IBbsArticle success type.
		`"name":"IBbsArticle"`,
		// The TypedBody parameter is named in the metadata.
		`"name":"input"`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("swagger-example metadata is missing %q\n%s", expected, meta)
		}
	}
}
