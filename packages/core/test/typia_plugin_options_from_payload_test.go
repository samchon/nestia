package test

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTypiaPluginOptionsFromPayload verifies typia's transform options are taken
// from the resolved --plugins-json payload rather than the text of one tsconfig.
//
// The reader used to open the entry tsconfig and regex-match `"numeric": true`.
// That file is only the entry of an `extends` chain, so an option declared in a
// base was invisible and the project silently got a weaker validator than it
// configured. From this binary's side the extends case looks exactly like this
// test: the option is present in the payload ttsc resolved, and absent from the
// text of the tsconfig the run is pointed at. The negative twin covers the other
// half of the same cause — a text scan also matched occurrences that were never
// part of the effective plugin configuration.
//
//  1. Transform a bare `typia.assert<T>()` fixture with a typia entry carrying
//     `numeric: true`, an option that appears nowhere in the tsconfig text.
//  2. Assert the emitted validator carries the NaN guard that option produces.
//  3. Transform the same fixture with the option absent and assert the guard is
//     gone, so the positive case cannot pass for an unrelated reason.
//
// @evidence contracts/testing.md#behavioral-verification The same numeric fixture must emit a Number.isNaN guard with numeric true and omit it without that option, detecting lost manifest payload or unconditional guard generation.
// @evidence contracts/testing.md#independent-expectations The supported typia numeric option rejects NaN; the default numeric predicate permits it. The fixture and one changed option establish expectations independently of the dispatcher.
// @evidence contracts/testing.md#distinguishing-cases The positive and negative builds share the same source but isolate output/configuration directories; changing only numeric distinguishes option propagation from incidental source behavior.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTypiaPluginOptionsFromPayload(t *testing.T) {
	const guard = "Number.isNaN"
	run := func(typiaConfig string) string {
		t.Helper()
		temp := t.TempDir()
		featureRoot := featureRootForCore(t, "app")
		fixture := featureSource(t, "app", "test/transform_numeric_option_fixture.ts")
		tsconfig := writeExtendingTsconfig(t, temp, featureRoot, "", []string{fixture})
		outPath := filepath.Join(temp, "out.ts")
		code := transform.Run([]string{
			"transform",
			"--cwd", temp,
			"--tsconfig", tsconfig,
			"--file", fixture,
			"--out", outPath,
			"--plugins-json",
			`[{"name":"typia","stage":"transform","config":{"transform":"typia/lib/transform"` + typiaConfig + `}}]`,
		})
		if code != 0 {
			t.Fatalf("transform.Run exited %d", code)
		}
		return mustReadFile(t, outPath)
	}

	with := run(`,"numeric":true`)
	if !strings.Contains(with, guard) {
		t.Fatalf("numeric option from the plugin payload produced no %s guard\n%s", guard, with)
	}

	without := run("")
	if strings.Contains(without, guard) {
		t.Fatalf("%s guard appeared without the numeric option, so the positive case proves nothing\n%s", guard, without)
	}
}
