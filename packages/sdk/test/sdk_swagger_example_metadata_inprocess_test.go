package test

import "testing"

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
//  3. Compare create's exact documentation and parameter association with the
//     undocumented update, then require each operation's own DTO identities.
//
// @evidence contracts/testing.md#behavioral-verification Each decoded operation retains its own parameter and return types. Create carries the exact authored description and five JSDoc tags, and only its input parameter receives Content to store; update carries null descriptions and no tags.
// @evidence contracts/testing.md#independent-expectations The unchanged handwritten create/update signatures and comment specify the literal DTO names, documentation and parameter association. TypeScript JSDocTagInfo distinguishes parameterName, space and text parts; no expected value comes from the native reader.
// @evidence contracts/testing.md#distinguishing-cases The documented single-parameter create contrasts the undocumented two-parameter update. A request tag with no matching parameter remains a tag without inventing a parameter, and Promise return types unwrap independently on both operations; sibling text cannot satisfy a missing field.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKSwaggerExampleMetadataInProcess(t *testing.T) {
	_, prog := loadFeatureProgram(t, "swagger-example", []string{
		"controllers/BbsArticlesController.ts",
		"api/structures/IBbsArticle.ts",
	})
	defer prog.Close()
	literals := collectEmittedMetadata(t, prog)
	if len(literals) != 2 {
		t.Fatalf("expected create and update operations, got %d", len(literals))
	}
	create := decodeSyntheticMetadata(t, literals[0])
	update := decodeSyntheticMetadata(t, literals[1])
	if description := syntheticField(t, create, "description"); description != "Create an article." {
		t.Fatalf("create description = %v", description)
	}
	const tags = `[{"name":"author","text":[{"kind":"text","text":"Samchon"}]},{"name":"param","text":[{"kind":"parameterName","text":"request"},{"kind":"space","text":" "},{"kind":"text","text":"Request object from express. Must be disappeared in SDK"}]},{"name":"param","text":[{"kind":"parameterName","text":"input"},{"kind":"space","text":" "},{"kind":"text","text":"Content to store"}]},{"name":"returns","text":[{"kind":"text","text":"Newly archived article"}]},{"name":"warning","text":[{"kind":"text","text":"This is an fake API"}]}]`
	if actual := canonicalJSON(t, syntheticField(t, create, "jsDocTags")); actual != tags {
		t.Fatalf("create tags = %s, want %s", actual, tags)
	}
	if description := syntheticField(t, update, "description"); description != nil {
		t.Fatalf("undocumented update inherited description: %v", description)
	}
	if actual := canonicalJSON(t, syntheticField(t, update, "jsDocTags")); actual != `[]` {
		t.Fatalf("undocumented update inherited tags: %s", actual)
	}
	for index, operation := range []map[string]any{create, update} {
		parameters := syntheticField(t, operation, "parameters").([]any)
		wantCount := index + 1
		if len(parameters) != wantCount {
			t.Fatalf("operation%d parameters = %d, want %d", index, len(parameters), wantCount)
		}
		input := parameters[len(parameters)-1]
		if name := syntheticField(t, input, "name"); name != "input" {
			t.Fatalf("operation%d body parameter = %v", index, name)
		}
		wantType := "IBbsArticle.ICreate"
		var wantDescription any = "Content to store"
		if index == 1 {
			wantType, wantDescription = "IBbsArticle.IUpdate", nil
			if name := syntheticField(t, parameters[0], "name"); name != "id" {
				t.Fatalf("update first parameter = %v, want id", name)
			}
			if description := syntheticField(t, parameters[0], "description"); description != nil {
				t.Fatalf("update id inherited description: %v", description)
			}
		}
		if name := syntheticField(t, syntheticField(t, input, "type"), "name"); name != wantType {
			t.Fatalf("operation%d input type = %v, want %s", index, name, wantType)
		}
		if description := syntheticField(t, input, "description"); description != wantDescription {
			t.Fatalf("operation%d input description = %v, want %v", index, description, wantDescription)
		}
		if name := syntheticField(t, syntheticField(t, syntheticField(t, operation, "success"), "type"), "name"); name != "IBbsArticle" {
			t.Fatalf("operation%d unwrapped return = %v, want IBbsArticle", index, name)
		}
	}
}
