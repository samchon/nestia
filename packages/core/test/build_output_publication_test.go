package test

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform/buildoutput"
)

// TestBuildOutputPublication verifies buffered bytes, requested manifests and
// reporting through the actual production output session without a compiler.
//
// The compiler-to-completion verdict remains an installed wrapper boundary.
// These literal artifacts isolate the publication policy, so no product JS
// emitter, native binary, Node consumer or backend is necessary for this owner.
//
//  1. Buffer two independently authored artifacts before checking the filesystem.
//  2. Cross accepted/rejected and emitting/analysis policy with quiet/verbose output.
//  3. Verify exact bytes, requested manifest order and success-only final summary.
//  4. Reject artifact and manifest writes, then prove a fresh session recovers.
//
// @evidence contracts/testing.md#behavioral-verification Actual buildoutput.New/Write/Finish must defer all authored bytes until accepted emission, discard failed or analysis buffers, preserve exact artifact text and requested manifest paths, and report initial/final summaries according to quiet policy. First IO error prevents later writes, manifests and success summaries; a fresh successful session recovers.
// @evidence contracts/testing.md#independent-expectations Authored JavaScript/declaration strings and explicit path order establish output bytes and manifest contents independently. Literal emit=false and emitted=2 protocol lines distinguish initial analysis reporting from successful publication.
// @evidence contracts/testing.md#distinguishing-cases Eight accepted/emission/quiet states include requested manifests in every row; missing files alone cannot pass a positive emitting control. Additional empty emission, concurrent callbacks, first/second artifact failure, manifest directory/write failure and fresh recovery isolate each publication boundary.
// @evidence contracts/testing.md#execution-ownership Go invokes the production output session directly with an owned artifact filesystem callback and temporary manifest paths. There is no compiler program, native artifact, product emission or installed consumer; real upstream diagnostic-to-verdict forwarding is separately owned by the installed wrapper batch.
func TestBuildOutputPublication(t *testing.T) {
	for _, emit := range []bool{false, true} {
		for _, accepted := range []bool{false, true} {
			for _, quiet := range []bool{false, true} {
				name := "analysis"
				if emit {
					name = "emit"
				}
				if accepted {
					name += "/accepted"
				} else {
					name += "/rejected"
				}
				if quiet {
					name += "/quiet"
				} else {
					name += "/verbose"
				}
				t.Run(name, func(t *testing.T) {
					root := t.TempDir()
					manifest := filepath.Join(root, "manifest", "outputs.json")
					paths := []string{filepath.Join(root, "out", "main.js"), filepath.Join(root, "out", "main.d.ts")}
					texts := []string{"exports.value = 7;\n", "export declare const value: number;\n"}
					var out bytes.Buffer
					calls := []string{}
					writer := func(path, text string) error {
						calls = append(calls, path)
						if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
							return err
						}
						return os.WriteFile(path, []byte(text), 0o644)
					}
					session := buildoutput.New(buildoutput.Options{TSConfig: "project.json", CWD: root, Manifest: manifest, Core: true, Emit: emit, Quiet: quiet}, &out, writer)
					for i := range paths {
						session.Write(paths[i], texts[i])
					}
					for _, path := range append(append([]string{}, paths...), manifest) {
						mustOutputAbsent(t, path)
					}
					if err := session.Finish(accepted); err != nil {
						t.Fatal(err)
					}
					if emit && accepted {
						if len(calls) != 2 || calls[0] != paths[0] || calls[1] != paths[1] {
							t.Fatalf("artifact order = %v, want %v", calls, paths)
						}
						for i, path := range paths {
							data, err := os.ReadFile(path)
							if err != nil || string(data) != texts[i] {
								t.Fatalf("artifact %s = %q, %v; want %q", path, data, err, texts[i])
							}
						}
						data, err := os.ReadFile(manifest)
						if err != nil {
							t.Fatal(err)
						}
						var listed []string
						if err := json.Unmarshal(data, &listed); err != nil {
							t.Fatal(err)
						}
						if len(listed) != 2 || listed[0] != paths[0] || listed[1] != paths[1] {
							t.Fatalf("manifest = %v, want %v", listed, paths)
						}
					} else {
						if len(calls) != 0 {
							t.Fatalf("nonpublication invoked writer: %v", calls)
						}
						for _, path := range append(append([]string{}, paths...), manifest) {
							mustOutputAbsent(t, path)
						}
					}
					expected := ""
					if !quiet {
						flag := "false"
						if emit {
							flag = "true"
						}
						expected = "// ttsc-nestia build: tsconfig=project.json cwd=" + root + " core=true sdk=false typia=false emit=" + flag + "\n"
						if emit && accepted {
							expected += "// ttsc-nestia build: emitted=2 files\n"
						}
					}
					if out.String() != expected {
						t.Fatalf("report = %q, want %q", out.String(), expected)
					}
				})
			}
		}
	}
	t.Run("empty-emitting-manifest", func(t *testing.T) {
		manifest := filepath.Join(t.TempDir(), "files.json")
		var out bytes.Buffer
		session := buildoutput.New(buildoutput.Options{Emit: true, Quiet: true, Manifest: manifest}, &out, func(string, string) error { t.Fatal("empty output invoked writer"); return nil })
		if err := session.Finish(true); err != nil {
			t.Fatal(err)
		}
		data, err := os.ReadFile(manifest)
		if err != nil || string(data) != "[]" {
			t.Fatalf("empty manifest = %q, %v", data, err)
		}
	})
	for _, at := range []int{1, 2} {
		t.Run("artifact-error-"+string(rune('0'+at)), func(t *testing.T) {
			root := t.TempDir()
			manifest := filepath.Join(root, "files.json")
			var out bytes.Buffer
			failure := errors.New("authored artifact IO failure")
			calls := 0
			session := buildoutput.New(buildoutput.Options{Emit: true, Manifest: manifest}, &out, func(string, string) error {
				calls++
				if calls == at {
					return failure
				}
				return nil
			})
			session.Write("one.js", "one")
			session.Write("two.d.ts", "two")
			session.Write("three.js", "three")
			err := session.Finish(true)
			if !errors.Is(err, failure) || err.Error() != "emit write failed: authored artifact IO failure" || calls != at {
				t.Fatalf("first failure: err=%v calls=%d", err, calls)
			}
			mustOutputAbsent(t, manifest)
			if strings.Contains(out.String(), "emitted=") {
				t.Fatalf("failed publication reported success: %s", out.String())
			}
			var recovered bytes.Buffer
			recovery := buildoutput.New(buildoutput.Options{Emit: true, Quiet: true, Manifest: manifest}, &recovered, func(string, string) error { return nil })
			recovery.Write("recovered.js", "recovered")
			if err := recovery.Finish(true); err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(manifest)
			if err != nil || string(data) != `["recovered.js"]` {
				t.Fatalf("recovery manifest = %q, %v", data, err)
			}
		})
	}
	for _, kind := range []string{"mkdir", "write"} {
		t.Run("manifest-error-"+kind, func(t *testing.T) {
			root := t.TempDir()
			blocked := filepath.Join(root, "blocked")
			manifest := filepath.Join(blocked, "files.json")
			if kind == "mkdir" {
				if err := os.WriteFile(blocked, []byte("file blocks directory"), 0o644); err != nil {
					t.Fatal(err)
				}
			} else {
				manifest = blocked
				if err := os.Mkdir(blocked, 0o755); err != nil {
					t.Fatal(err)
				}
			}
			var out bytes.Buffer
			calls := 0
			session := buildoutput.New(buildoutput.Options{Emit: true, Manifest: manifest}, &out, func(string, string) error { calls++; return nil })
			session.Write("one.js", "one")
			err := session.Finish(true)
			if err == nil || !strings.HasPrefix(err.Error(), "manifest "+kind+" failed: ") || calls != 1 {
				t.Fatalf("manifest failure: %v calls=%d", err, calls)
			}
			if strings.Contains(out.String(), "emitted=") {
				t.Fatalf("manifest failure reported success: %s", out.String())
			}
		})
	}
	t.Run("concurrent-artifacts", func(t *testing.T) {
		root := t.TempDir()
		manifest := filepath.Join(root, "files.json")
		var out bytes.Buffer
		session := buildoutput.New(buildoutput.Options{Emit: true, Quiet: true, Manifest: manifest}, &out, func(path, text string) error { return os.WriteFile(path, []byte(text), 0o644) })
		entries := []struct{ path, text string }{{filepath.Join(root, "one.js"), "one"}, {filepath.Join(root, "two.js"), "two"}, {filepath.Join(root, "three.d.ts"), "three"}}
		var workers sync.WaitGroup
		for _, entry := range entries {
			workers.Add(1)
			go func() { defer workers.Done(); session.Write(entry.path, entry.text) }()
		}
		workers.Wait()
		if err := session.Finish(true); err != nil {
			t.Fatal(err)
		}
		data, err := os.ReadFile(manifest)
		if err != nil {
			t.Fatal(err)
		}
		var listed []string
		if err := json.Unmarshal(data, &listed); err != nil {
			t.Fatal(err)
		}
		if len(listed) != 3 {
			t.Fatalf("concurrent manifest = %v", listed)
		}
		seen := map[string]int{}
		for _, path := range listed {
			seen[path]++
		}
		for _, entry := range entries {
			if seen[entry.path] != 1 {
				t.Fatalf("concurrent artifact %s count=%d", entry.path, seen[entry.path])
			}
			data, err := os.ReadFile(entry.path)
			if err != nil || string(data) != entry.text {
				t.Fatalf("concurrent bytes = %q, %v; want %q", data, err, entry.text)
			}
		}
	})

}

// mustOutputAbsent verifies the requested publication target has not been created.
func mustOutputAbsent(t *testing.T, path string) {
	t.Helper()
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("unexpected publication %s: %v", path, err)
	}
}
