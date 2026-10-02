package test

import (
	"path/filepath"
	"runtime/debug"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcore "github.com/microsoft/typescript-go/shim/core"
	shimparser "github.com/microsoft/typescript-go/shim/parser"
	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestAstNodeNameTextNil verifies the exported NodeName / NodeText accessors
// retain parsed names and text while rejecting missing or invalid source spans.
//
// Both helpers are called by contributors against arbitrary AST nodes that may
// be nil or synthetic. A synthetic node exists but need not have a source file,
// so the node nil guard alone cannot establish the documented empty result.
// Parsed and deliberately invalid spans distinguish safe source access from
// treating every node as absent without preparing a compiler program.
//
//  1. Require empty results for missing nodes and exact text for a parsed name.
//  2. Require empty text for an unattached synthetic node and invalid spans.
//
// @evidence contracts/testing.md#behavioral-verification Direct NodeName and NodeText preserve missing-node empty results, a parsed declaration's name and exact source slice, and empty results for a synthetic node or negative, oversized and empty spans without panic.
// @evidence contracts/testing.md#independent-expectations Authored source spells the value identifier literally. An unattached node has no source file and invalid ranges cannot identify a valid source slice, so the documented empty boundary is independent of compiler output.
// @evidence contracts/testing.md#distinguishing-cases Nil, parsed valid, synthesized unattached and three invalid-span cases distinguish source absence from ordinary source-bearing nodes. Unexpected panic fails its isolated subcase while the remaining boundaries execute.
// @evidence contracts/testing.md#execution-ownership Go discovers this Test in the external core module. Existing factory/parser APIs author input nodes directly; no program, compiler emission, product binary, installation or child process is prepared.
func TestAstNodeNameTextNil(t *testing.T) {
	if name := transform.NodeName(nil); name != "" {
		t.Fatalf("NodeName(nil) should be empty, got %q", name)
	}
	if text := transform.NodeText(nil); text != "" {
		t.Fatalf("NodeText(nil) should be empty, got %q", text)
	}
	source := "const value = 7;"
	parsed := shimparser.ParseSourceFile(shimast.SourceFileParseOptions{FileName: filepath.ToSlash(filepath.Join(t.TempDir(), "source.ts"))}, source, shimcore.ScriptKindTS)
	shimast.SetParentInChildren(parsed.AsNode())
	var identifier, declaration *shimast.Node
	var visit func(*shimast.Node)
	visit = func(node *shimast.Node) {
		if node.Kind == shimast.KindIdentifier && node.Text() == "value" {
			identifier = node
		}
		if node.Kind == shimast.KindVariableDeclaration {
			declaration = node
		}
		node.ForEachChild(func(child *shimast.Node) bool { visit(child); return false })
	}
	visit(parsed.AsNode())
	if identifier == nil || declaration == nil {
		t.Fatal("authored variable/name was not parsed")
	}
	if name := transform.NodeName(declaration); name != "value" {
		t.Fatalf("parsed name = %q, want value", name)
	}
	factory := shimast.NewNodeFactory(shimast.NodeFactoryHooks{})
	for _, item := range []struct {
		name string
		node *shimast.Node
		text string
	}{
		{"parsed-valid", identifier, "value"},
		{"synthetic-unattached", factory.NewIdentifier("value"), ""},
	} {
		t.Run(item.name, func(t *testing.T) {
			defer func() {
				if failure := recover(); failure != nil {
					t.Errorf("NodeText unexpectedly panicked: %v\n%s", failure, debug.Stack())
				}
			}()
			if text := transform.NodeText(item.node); text != item.text {
				t.Fatalf("text = %q, want %q", text, item.text)
			}
		})
	}
	for _, item := range []struct {
		name     string
		pos, end int
	}{
		{"negative", -1, 3},
		{"oversized", 0, len(source) + 1},
		{"empty", 3, 3},
	} {
		t.Run(item.name, func(t *testing.T) {
			node := factory.NewIdentifier("value")
			node.Parent = parsed.AsNode()
			node.Loc = shimcore.NewTextRange(item.pos, item.end)
			if text := transform.NodeText(node); text != "" {
				t.Fatalf("invalid span produced %q", text)
			}
		})
	}
}
