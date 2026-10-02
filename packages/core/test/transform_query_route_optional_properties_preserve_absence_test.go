package test

import (
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformQueryRouteOptionalPropertiesPreserveAbsence verifies absence
// branches in the actual urlencoded response serializer, independently of its validator.
//
// Optional values must not become literal undefined query fields or be iterated
// as arrays. A nullable array's null marker differs from an absent property and
// from an empty array; validation alone cannot supply those serializer decisions.
//
//  1. Transform required, optional and nullable response properties in five supported modes.
//  2. Bind the serializer's append and forEach calls to enclosing AST branches.
//  3. Require absence/null guards while retaining required scalar/list emission.
//
// @evidence contracts/testing.md#behavioral-verification Optional scalar appends and optional or nullable array iterations must be dominated by the corresponding absence branches in the actual URLSearchParams writer. Required scalar and array calls remain present in each enabled mode.
// @evidence contracts/testing.md#independent-expectations Authored optional properties permit undefined, which represents omission; null is a distinct urlencoded marker, and an empty array supplies no repeated values. The expectations are not obtained from the writer's metadata predicates.
// @evidence contracts/testing.md#distinguishing-cases Required scalar/list siblings prevent unconditional writer removal from passing. Optional scalar/list and nullable-list receivers have separately bound guards across all five supported modes. An optional nullable list requires both exclusions; a nullable scalar must retain its null marker append instead of adopting the array-only exclusion.
// @evidence contracts/testing.md#execution-ownership Existing RunWithOutput transforms authored source in-process and the existing parser checks branch dominance. This is an owning emission unit, not generated callback execution or the shared HTTP boundary; no product build, native host or Node process is started.
func TestTransformQueryRouteOptionalPropertiesPreserveAbsence(t *testing.T) {
	root := t.TempDir()
	writeCoreDeclarationPackage(t, root, `export declare namespace TypedQuery { function Get(path?: string): MethodDecorator; }`)
	writeFile(t, filepath.Join(root, "main.ts"), `import { TypedQuery } from "@nestia/core";
interface Output { required: string; requiredList: string[]; optional?: string; optionalList?: string[]; nullableList: string[] | null; optionalNullableList?: string[] | null; nullableScalar: string | null; }
export class Controller { @TypedQuery.Get() method(): Output { return { required: "yes", requiredList: [], nullableList: null, nullableScalar: null }; } }`)
	writeFile(t, filepath.Join(root, "tsconfig.json"), `{"compilerOptions":{"target":"ES2022","module":"commonjs","strict":true,"experimentalDecorators":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`)
	for _, mode := range []string{"assert", "is", "validate", "stringify", "validate.log"} {
		t.Run(mode, func(t *testing.T) {
			out, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins("assert", mode)})
			if code != 0 {
				t.Fatalf("transform exit %d: %s", code, diagnostics)
			}
			parsed := parseOptionalProtocolOutput(root, out)
			seen := map[string]int{}
			var visit func(*shimast.Node, []optionalProtocolBranch)
			visit = func(node *shimast.Node, branches []optionalProtocolBranch) {
				if node.Kind == shimast.KindIfStatement {
					statement := node.AsIfStatement()
					visit(statement.Expression, branches)
					visit(statement.ThenStatement, appendOptionalProtocolBranch(branches, statement.Expression, true))
					if statement.ElseStatement != nil {
						visit(statement.ElseStatement, appendOptionalProtocolBranch(branches, statement.Expression, false))
					}
					return
				}
				if node.Kind == shimast.KindCallExpression {
					call := node.AsCallExpression()
					name := strings.Join(transform.NestiaCoreExpressionSegments(call.Expression), ".")
					for _, field := range []string{"requiredList", "optionalList", "nullableList", "optionalNullableList"} {
						if name == "input."+field+".forEach" {
							seen[field]++
							if (field == "optionalList" || field == "optionalNullableList") && !optionalProtocolDominates(branches, field, "undefined") {
								t.Errorf("%s iteration has no dominating undefined exclusion", field)
							}
							if (field == "nullableList" || field == "optionalNullableList") && !optionalProtocolDominates(branches, field, "null") {
								t.Errorf("%s iteration has no dominating null exclusion", field)
							}
						}
					}
					if name == "output.append" && call.Arguments != nil && len(call.Arguments.Nodes) == 2 {
						key := strings.Trim(transform.NodeText(call.Arguments.Nodes[0]), `"'`)
						value := compactOptionalProtocol(transform.NodeText(call.Arguments.Nodes[1]))
						if key == "required" && value == "input.required" {
							seen[key]++
						}
						if key == "nullableScalar" && value == "input.nullableScalar" {
							seen[key]++
							if optionalProtocolDominates(branches, key, "null") {
								t.Error("nullable scalar append incorrectly excludes its null marker")
							}
						}
						if key == "optional" && value == "input.optional" {
							seen[key]++
							if !optionalProtocolDominates(branches, key, "undefined") {
								t.Error("optional scalar append has no dominating undefined exclusion")
							}
						}
					}
				}
				node.ForEachChild(func(child *shimast.Node) bool { visit(child, branches); return false })
			}
			visit(parsed.AsNode(), nil)
			for _, field := range []string{"required", "requiredList", "optional", "optionalList", "nullableList", "optionalNullableList", "nullableScalar"} {
				if seen[field] != 1 {
					t.Errorf("%s writer calls = %d, want one", field, seen[field])
				}
			}
		})
	}
	t.Run("invalid-assert-log", func(t *testing.T) {
		_, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins("assert", "assert.log")})
		if code != 3 || !strings.Contains(diagnostics, `invalid "stringify" option "assert.log"`) {
			t.Fatalf("unsupported stringify option exit/diagnostic = %d/%s", code, diagnostics)
		}
	})
}

type optionalProtocolBranch struct {
	expression *shimast.Node
	then       bool
}

// appendOptionalProtocolBranch preserves sibling branch state independently.
func appendOptionalProtocolBranch(previous []optionalProtocolBranch, expression *shimast.Node, then bool) []optionalProtocolBranch {
	next := append([]optionalProtocolBranch{}, previous...)
	return append(next, optionalProtocolBranch{expression, then})
}

// optionalProtocolDominates checks comparisons on this receiver along the
// actual enclosing branch path, not guards elsewhere in the emitted validator.
func optionalProtocolDominates(branches []optionalProtocolBranch, field, absent string) bool {
	for _, branch := range branches {
		if branch.expression.Kind != shimast.KindBinaryExpression {
			continue
		}
		binary := branch.expression.AsBinaryExpression()
		left, right := compactOptionalProtocol(transform.NodeText(binary.Left)), compactOptionalProtocol(transform.NodeText(binary.Right))
		if !(left == "input."+field && right == absent || right == "input."+field && left == absent) {
			continue
		}
		operator := binary.OperatorToken.Kind
		if branch.then && operator == shimast.KindExclamationEqualsEqualsToken || !branch.then && operator == shimast.KindEqualsEqualsEqualsToken {
			return true
		}
	}
	return false
}
