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
func TestAstNodeNameTextNil(t *testing.T) {
	if name := transform.NodeName(nil); name != "" {
		t.Fatalf("NodeName(nil) should be empty, got %q", name)
	}
	if text := transform.NodeText(nil); text != "" {
		t.Fatalf("NodeText(nil) should be empty, got %q", text)
	}
}
