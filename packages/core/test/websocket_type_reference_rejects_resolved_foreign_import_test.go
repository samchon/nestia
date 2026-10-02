package test

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestWebSocketTypeReferenceRejectsResolvedForeignImport verifies a resolved
// foreign import type is rejected while the genuine tgrid import is accepted.
//
// An unresolved import also produces an acceptor diagnostic. Requiring the
// foreign interface's actual declaration prevents a missing fixture dependency
// from substituting for the same-name, same-arity ownership counterexample.
//
//  1. Load the original foreign and genuine import-type controllers together.
//  2. Require both acceptor types to resolve to non-any declared types.
//  3. Require only the tgrid declaration to produce an acceptor reference.
//
// @evidence contracts/testing.md#behavioral-verification The checker must resolve the foreign import to its authored LocalAcceptor declaration before NestiaCoreWebSocketTypeReference rejects it; the actual tgrid import in the adjacent controller must produce a WebSocketAcceptor reference and declaration owner.
// @evidence contracts/testing.md#independent-expectations The foreign fixture declares a three-parameter WebSocketAcceptor interface in LocalAcceptor.ts, while the genuine import names the installed tgrid declaration. Identical type name and arity do not establish tgrid ownership.
// @evidence contracts/testing.md#distinguishing-cases Resolved foreign and genuine import types share the acceptor name; non-any and explicit source-declaration assertions reject a missing-module substitute for the negative. The diagnostic-message case owns the corresponding route rejection, and other WebSocket units own aliases and missing inputs.
// @evidence contracts/testing.md#execution-ownership The core Go module discovers this Test and loads one authored checker program in-process, closing it after both direct reference calls. There is no product compilation, native host, installed consumer preparation or backend execution.
func TestWebSocketTypeReferenceRejectsResolvedForeignImport(t *testing.T) {
	positive := featureRootForCore(t, "websocket-type-alias")
	negative := featureRootForCore(t, "websocket-error-invalid-acceptor-import")
	files := []string{
		filepath.Join(positive, "src/controllers/AliasSocketController.ts"),
		filepath.Join(negative, "src/controllers/CalculateController.ts"),
	}
	root := t.TempDir()
	config, err := json.Marshal(map[string]any{
		"extends": filepath.ToSlash(filepath.Join(positive, "tsconfig.json")),
		"files":   files,
		"include": []string{},
	})
	if err != nil {
		t.Fatal(err)
	}
	writeFile(t, filepath.Join(root, "tsconfig.json"), string(config))
	prog, diagnostics, err := driver.LoadProgram(root, "tsconfig.json", driver.LoadProgramOptions{ForceNoEmit: true})
	if err != nil {
		t.Fatal(err)
	}
	defer prog.Close()
	if len(diagnostics) != 0 {
		t.Fatalf("configuration diagnostics: %v", diagnostics)
	}
	for index, path := range files {
		accepted := index == 0
		method := "connect"
		if accepted {
			method = "imported"
		}
		file := prog.SourceFile(filepath.ToSlash(path))
		if file == nil {
			t.Fatalf("controller not loaded: %s", path)
		}
		found := false
		var walk func(*shimast.Node)
		walk = func(node *shimast.Node) {
			if node.Kind == shimast.KindMethodDeclaration && transform.NodeName(node) == method {
				parameters := node.AsMethodDeclaration().Parameters
				if parameters == nil || len(parameters.Nodes) == 0 {
					t.Fatalf("%s has no acceptor parameter", method)
				}
				typeNode := parameters.Nodes[0].AsParameterDeclaration().Type
				if typeNode == nil || typeNode.Kind != shimast.KindImportType {
					t.Fatalf("%s acceptor is not the authored import type", method)
				}
				typ := prog.Checker.GetTypeFromTypeNode(typeNode)
				if typ == nil || typ.Flags()&shimchecker.TypeFlagsAny != 0 || typ.Symbol() == nil || len(typ.Symbol().Declarations) == 0 {
					t.Fatalf("%s acceptor did not resolve to a declared non-any type", method)
				}
				declaration := shimast.GetSourceFileOfNode(typ.Symbol().Declarations[0])
				if declaration == nil || typ.Symbol().Name != "WebSocketAcceptor" {
					t.Fatalf("%s did not resolve the authored acceptor declaration", method)
				}
				owner := transform.SourceFilePackageName(prog, declaration)
				if accepted && owner != "tgrid" {
					t.Fatalf("genuine acceptor owner = %q", owner)
				}
				if !accepted && (owner == "tgrid" || !strings.HasSuffix(filepath.ToSlash(declaration.FileName()), "/src/structures/LocalAcceptor.ts")) {
					t.Fatalf("foreign acceptor resolved to an unrelated declaration: %s, owner %q", declaration.FileName(), owner)
				}
				chain, name := transform.NestiaCoreWebSocketTypeReference(prog, typeNode)
				if accepted && (len(chain) == 0 || name != "WebSocketAcceptor") {
					t.Fatalf("genuine import lost its reference: %d %q", len(chain), name)
				}
				if !accepted && (chain != nil || name != "") {
					t.Fatalf("resolved foreign import became an acceptor: %d %q", len(chain), name)
				}
				found = true
			}
			node.ForEachChild(func(child *shimast.Node) bool { walk(child); return false })
		}
		walk(file.AsNode())
		if !found {
			t.Fatalf("%s method not visited", method)
		}
	}
}
