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
