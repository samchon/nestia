package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestAstNodeNameTextNil verifies the exported NodeName / NodeText accessors
// degrade to empty strings on a nil node instead of panicking.
//
// Both helpers are called by contributors against arbitrary AST nodes that may
// be nil (an unnamed method, a parameter without a name). The nil guard is the
// first branch of each function; without it the SDK metadata pass would panic
// mid-emit. A direct nil call is the cheapest way to pin that guard, and the
// non-nil text paths are already covered transitively by the transform suites.
//
//  1. Call NodeName(nil) and assert it returns "".
//  2. Call NodeText(nil) and assert it returns "".
//
// @evidence contracts/testing.md#behavioral-verification Direct NodeName(nil) and NodeText(nil) calls must return empty strings; dereferencing a missing node fails this case rather than interrupting an SDK emit later.
// @evidence contracts/testing.md#independent-expectations A missing node owns neither a name nor a source span, so the documented empty result is fixed independently of compiler output.
// @evidence contracts/testing.md#distinguishing-cases Both accessor nil guards are asserted; real named and source-bearing nodes belong to TestExportedAstHelpersOnProgram.
// @evidence contracts/testing.md#execution-ownership Go discovers this Test function in the external core test module; it invokes the two exported accessors directly without loading a program or spawning a host.
func TestAstNodeNameTextNil(t *testing.T) {
	if name := transform.NodeName(nil); name != "" {
		t.Fatalf("NodeName(nil) should be empty, got %q", name)
	}
	if text := transform.NodeText(nil); text != "" {
		t.Fatalf("NodeText(nil) should be empty, got %q", text)
	}
}
