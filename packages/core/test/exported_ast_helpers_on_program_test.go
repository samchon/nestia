package test

import (
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestExportedAstHelpersOnProgram verifies the AST helpers the @nestia/sdk
// plugin imports from this module — IsNestiaCoreCall, NestiaCoreExpressionSegments,
// NestiaCoreMethodReturnType, NodeName, NodeText — operate against a real loaded
// program and recognize a @nestia/core decorator call on a controller method.
//
// These are exported consumer seams: the SDK module walks a program's AST and
// calls them to decide which methods are nestia routes and what they return. The
// live in-repo transform no longer calls them (the AST-emit path replaced the
// old collector), so without an external driver they read 0%. Loading a real
// controller program and walking to its decorator call exercises the same
// signature-resolution branches the SDK relies on.
//
//  1. Load the body feature program and grab TypedBodyController.
//  2. Walk to the class, its methods, and the @TypedRoute call expression.
//  3. Assert IsNestiaCoreCall is true, the segments end with the decorator name,
//     NestiaCoreMethodReturnType resolves a type, and Node helpers read names.
func TestExportedAstHelpersOnProgram(t *testing.T) {
	cwd := featureRootForCore(t, "body")
	prog, diags, err := driver.LoadProgram(cwd, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
	if err != nil {
		t.Fatalf("LoadProgram failed: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("LoadProgram produced %d config diagnostics", len(diags))
	}
	defer prog.Close()

	target := prog.SourceFile(filepath.ToSlash(filepath.Join(cwd, "src/controllers/TypedBodyController.ts")))
	if target == nil {
		t.Fatal("TypedBodyController.ts not in program")
	}

	var (
		sawCoreCall bool
		sawSegments bool
		sawReturn   bool
		sawMethod   bool
	)
	var walk func(node *shimast.Node)
	walk = func(node *shimast.Node) {
		if node == nil {
			return
		}
		switch node.Kind {
		case shimast.KindMethodDeclaration:
			sawMethod = true
			if transform.NodeName(node) == "" {
				t.Fatalf("method declaration should have a name; NodeText=%q", transform.NodeText(node))
			}
			if typ := transform.NestiaCoreMethodReturnType(prog, node); typ != nil {
				sawReturn = true
			}
		case shimast.KindCallExpression:
			call := node.AsCallExpression()
			if call != nil {
				if transform.IsNestiaCoreCall(prog, node) {
					sawCoreCall = true
				}
				segs := transform.NestiaCoreExpressionSegments(call.Expression)
				if len(segs) > 0 && transform.NestiaCoreExpressionSegments(call.Expression) != nil {
					sawSegments = true
				}
			}
		}
		node.ForEachChild(func(child *shimast.Node) bool {
			walk(child)
			return false
		})
	}
	walk(target.AsNode())

	if !sawMethod {
		t.Fatal("no method declaration visited")
	}
	if !sawCoreCall {
		t.Fatal("IsNestiaCoreCall never returned true for a @nestia/core decorator")
	}
	if !sawSegments {
		t.Fatal("NestiaCoreExpressionSegments never produced segments")
	}
	if !sawReturn {
		t.Fatal("NestiaCoreMethodReturnType never resolved a method return type")
	}
}
