package test

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// projectTransformEnvelope is the JSON envelope the project-mode `transform`
// subcommand publishes on stdout, declared here from the ttsc protocol's wire
// shape instead of reusing the producer's own Go struct. A renamed field or a
// dropped struct tag would keep a producer-typed decode green while the real
// consumer — `@ttsc/unplugin`, which reads this JSON — saw nothing.
type projectTransformEnvelope struct {
	Diagnostics []map[string]any        `json:"diagnostics"`
	TypeScript  map[string]string       `json:"typescript"`
	Graph       *projectTransformGraph  `json:"graph"`
}

// projectTransformGraph mirrors ttsc's `ITtscCompilerTransformation.IReferenceGraph`.
type projectTransformGraph struct {
	Edges      map[string][]string `json:"edges"`
	Globals    []string            `json:"globals"`
	Configs    []string            `json:"configs"`
	Candidates map[string][]string `json:"candidates"`
}

// runProjectTransformEnvelope drives the project-mode transform over a
// tests/test-sdk feature with the feature's own cwd and tsconfig — project mode
// keys every file relative to cwd and skips the ones that escape it, so a cwd
// outside the feature would silently produce an empty envelope — and returns the
// decoded stdout envelope.
//
// It fails the test on a nonzero exit or on stdout that is not the envelope, so
// a caller's assertions stay about the envelope's content.
func runProjectTransformEnvelope(t *testing.T, feature string) projectTransformEnvelope {
	t.Helper()
	cwd := featureRootForCore(t, feature)
	out := &bytes.Buffer{}
	errOut := &bytes.Buffer{}
	code := transform.RunWithOutput([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--plugins-json", coreNativePlugins("validate", "assert"),
	}, out, errOut)
	if code != 0 {
		t.Fatalf("project-mode transform of %q exited %d\n%s", feature, code, errOut.String())
	}
	envelope := projectTransformEnvelope{}
	if err := json.Unmarshal(out.Bytes(), &envelope); err != nil {
		t.Fatalf("project-mode transform of %q did not publish a JSON envelope: %v\n%s", feature, err, out.String())
	}
	return envelope
}

// mustListContain asserts a graph list carries needle, reporting the whole list
// on failure so a keying regression is readable without a second run.
func mustListContain(t *testing.T, label string, list []string, needle string) {
	t.Helper()
	for _, entry := range list {
		if entry == needle {
			return
		}
	}
	t.Fatalf("%s does not carry %q\n%v", label, needle, list)
}

// mustListOmit is mustListContain's negative counterpart.
func mustListOmit(t *testing.T, label string, list []string, needle string) {
	t.Helper()
	for _, entry := range list {
		if entry == needle {
			t.Fatalf("%s must not carry %q\n%v", label, needle, list)
		}
	}
}

// mustOmitBundledScheme asserts no entry names a compiler-embedded library
// file. Those change only with the toolchain, so a consumer that registered one
// as a filesystem input would watch a path that does not exist.
func mustOmitBundledScheme(t *testing.T, label string, list []string) {
	t.Helper()
	for _, entry := range list {
		if strings.HasPrefix(entry, "bundled:///") {
			t.Fatalf("%s carries the virtual library path %q", label, entry)
		}
	}
}

// keysOf lists a map's keys for a failure message.
func keysOf(source map[string]string) []string {
	keys := make([]string, 0, len(source))
	for key := range source {
		keys = append(keys, key)
	}
	return keys
}
