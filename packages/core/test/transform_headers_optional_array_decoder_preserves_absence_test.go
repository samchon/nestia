package test

import (
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcore "github.com/microsoft/typescript-go/shim/core"
	shimparser "github.com/microsoft/typescript-go/shim/parser"
	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformHeadersOptionalArrayDecoderPreservesAbsence verifies that the
// shared header decoder preserves an omitted optional list without dereferencing it.
//
// An optional validator verdict cannot protect decoding that runs before it.
// The independent input contract distinguishes omission, empty and populated
// lists; the deletion decision must safely inspect the decoded optional list.
//
//  1. Transform authored required and optional header lists in all three families.
//  2. Bind the optional deletion condition in the parsed emitted AST.
//  3. Require a safe length access and contrast the required list decoder.
//
// @evidence contracts/testing.md#behavioral-verification Each actual header-family output must retain its optional validator and safely inspect the optional decoded list before deleting empty values; required lists remain independently decoded.
// @evidence contracts/testing.md#independent-expectations The authored optional field permits absence, while the published HTTP header contract omits absent and empty lists and retains populated lists. Reading an absent receiver's length is incompatible with that contract regardless of validator selection.
// @evidence contracts/testing.md#distinguishing-cases Assert, is and validate share the decoder but have separate validator protocols. An optional x-list contrasts required x-required and optional scalar x-title, so a guard on another property cannot satisfy this list's condition.
// @evidence contracts/testing.md#execution-ownership The canonical core Go runner invokes the source transform in-process and parses its output. Authored TypeScript is checker preparation; no native binary, Node callback, installation or HTTP host is executed.
func TestTransformHeadersOptionalArrayDecoderPreservesAbsence(t *testing.T) {
	root := t.TempDir()
	writeCoreDeclarationPackage(t, root, `export declare function TypedHeaders(): ParameterDecorator;`)
	writeFile(t, filepath.Join(root, "main.ts"), `import { TypedHeaders } from "@nestia/core";
interface Headers { "x-list"?: string[]; "x-required": string[]; "x-title"?: string; }
export class Controller { method(@TypedHeaders() headers: Headers): void {} }`)
	writeFile(t, filepath.Join(root, "tsconfig.json"), `{"compilerOptions":{"target":"ES2022","module":"commonjs","strict":true,"experimentalDecorators":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`)
	for _, mode := range []string{"assert", "is", "validate"} {
		t.Run(mode, func(t *testing.T) {
			out, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins(mode, "assert")})
			if code != 0 {
				t.Fatalf("transform exit %d: %s", code, diagnostics)
			}
			parsed := parseOptionalProtocolOutput(root, out)
			optionalLengths, unsafeLengths, requiredReads := 0, 0, 0
			walkOptionalProtocol(parsed.AsNode(), func(node *shimast.Node) {
				if node.Kind != shimast.KindPropertyAccessExpression {
					return
				}
				text := compactOptionalProtocol(transform.NodeText(node))
				if text == `output["x-list"].length` || text == `output["x-list"]?.length` {
					optionalLengths++
					if node.Flags&shimast.NodeFlagsOptionalChain == 0 {
						unsafeLengths++
					}
				}
				if strings.Contains(text, `input["x-required"]`) {
					requiredReads++
				}
			})
			if optionalLengths != 1 || unsafeLengths != 0 {
				t.Errorf("optional decoder length accesses = %d, unsafe = %d; absent list must not be dereferenced", optionalLengths, unsafeLengths)
			}
			if requiredReads == 0 {
				t.Error("required-list decoder control was not emitted")
			}
			mustDecorateAll(t, out, `@TypedHeaders`, mode)
		})
	}
}

// parseOptionalProtocolOutput uses an absolute authored output name so the
// parser owns source text without another checker or transform program.
func parseOptionalProtocolOutput(root, out string) *shimast.SourceFile {
	return shimparser.ParseSourceFile(shimast.SourceFileParseOptions{FileName: filepath.ToSlash(filepath.Join(root, "emitted.ts"))}, out, shimcore.ScriptKindTS)
}

// walkOptionalProtocol visits the actual parsed nodes rather than searching
// unrelated generated source for a matching guard fragment.
func walkOptionalProtocol(node *shimast.Node, inspect func(*shimast.Node)) {
	inspect(node)
	node.ForEachChild(func(child *shimast.Node) bool { walkOptionalProtocol(child, inspect); return false })
}

// compactOptionalProtocol removes printer whitespace from one bound AST node.
func compactOptionalProtocol(text string) string {
	return strings.Join(strings.Fields(text), "")
}
