package test

import (
	"strings"
	"testing"
)

// Verifies the reflect-type fallbacks in sdk_transform.go: a `typeof` return
// annotation (KindTypeQuery) and a `Promise<T>` return both name the operation's
// success type correctly in the injected OperationMetadata.
//
// nestiaSDKReflectTypeNode returns ok=false for KindTypeQuery, so nestiaSDKReflectType
// must fall through to its nestiaSDKTypeNodeText / checker name-resolution arm
// (lines 1091-1101) — the branch that stays dark whenever every controller
// returns a plain type reference. A `Promise<T>` return drives the Promise unwrap
// arm of nestiaSDKReflectTypeNode (it recurses into the single type argument). No
// tests/test-sdk controller writes either annotation, so a synthetic controller
// is the only in-process driver; it runs through the exported EmitTransform with
// no disk emit.
//
//  1. Author a controller with a `typeof`-typed method and a `Promise<IPoint>`
//     method.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert the typeof success type and the unwrapped Promise element both
//     surface in the metadata.
func TestSyntheticReflectTypeQueryAndPromiseUnwrap(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IPoint {
  x: number;
  y: number;
}

const sample = { value: 1 };

export class SyntheticController {
  @core.TypedRoute.Get("typeof")
  public typeofValue(): typeof sample {
    return sample;
  }

  @core.TypedRoute.Get("promise")
  public async promised(): Promise<IPoint> {
    return { x: 0, y: 0 };
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	// The Promise<IPoint> return unwraps to IPoint, so the success type name is
	// the element type, not "Promise".
	if !strings.Contains(meta, `"name":"IPoint"`) {
		t.Fatalf("Promise<IPoint> return should unwrap to IPoint\n%s", meta)
	}
	if strings.Contains(meta, `"name":"Promise"`) {
		t.Fatalf("Promise wrapper leaked into success metadata\n%s", meta)
	}
	// The typeof method's success type resolves through the checker fallback to the
	// inferred object shape, so its property name surfaces in the metadata.
	if !strings.Contains(meta, `"value"`) {
		t.Fatalf("typeof return metadata is missing the inferred property\n%s", meta)
	}
}
