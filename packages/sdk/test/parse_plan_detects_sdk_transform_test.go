package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/plugin"
)

// Verifies an SDK-only descriptor activates the contributor without core.
//
// The shared host distinguishes descriptor classification from core activation;
// the SDK family still counts as a nestia plan when core is not named.
//
//  1. Parse an SDK-only authored plugin payload.
//  2. Require SDK and UsesNestia, while forbidding Core activation.
//
// @evidence contracts/testing.md#behavioral-verification ParsePlan on the SDK-only descriptor must set SDK and UsesNestia while leaving Core false.
// @evidence contracts/testing.md#independent-expectations The public SDK descriptor denotes the SDK contributor independently of core activation; UsesNestia includes either package.
// @evidence contracts/testing.md#distinguishing-cases Three flags distinguish contributor recognition from accidental core recognition. Joint activation and core-only/empty plan cases supply adjacent forms.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this direct ParsePlan unit; it passes an authored JSON string and reads the returned flags, with no program, filesystem fixture, product compiler or host. Core plan units own malformed, ordered, empty and recovery inputs.
func TestParsePlanDetectsSDKTransform(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"name":"@nestia/sdk","config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.SDK {
		t.Fatal("expected @nestia/sdk transform to be detected")
	}
	if plan.Core {
		t.Fatal("did not expect @nestia/core transform")
	}
	if !plan.UsesNestia() {
		t.Fatal("expected SDK transform to count as a Nestia transform")
	}
}
