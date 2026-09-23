package test

import (
	"bytes"
	"encoding/json"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"testing"
)

const typiaNativeModulePath = "github.com/samchon/typia/packages/typia/native"

// TestTypiaGoPinMatchesNpmTypia verifies that every Go module linking typia's
// native source resolves the same typia version, and that the source it
// resolves is the source of the typia the npm workspace installs.
//
// ttsc builds the plugin through the Go module graph, so the binary links the
// typia the `go.mod` files pin, never `node_modules/typia/native`. The npm
// dependency and the Go pin therefore move independently, and when only the npm
// side moved (#1638) every nestia project compiled with typia 14's transform
// against typia 15's runtime: `typia.llm.evaluation<T>()` threw "no transform
// has been configured" and every other typia 15 fix was silently missing. The
// four pins must agree with each other too, or the test modules exercise a
// typia the shipped plugin does not link.
//
// Each module is checked on both the pin it declares and the version it
// resolves. Resolution alone cannot see a lagging declaration: `sdk/native`
// requires `core/native`, so minimal version selection resolves core's newer
// pin there and hides a stale one in sdk's own go.mod until core moves again.
//
//  1. Read the typia requirement each of the four Go modules declares through
//     `go mod edit -json`, and assert all four declare the same version.
//  2. Resolve the typia module each of them builds with through
//     `go list -m -json`, and assert it is that declared version with no
//     replace directive redirecting it.
//  3. Assert the pinned source tree equals the npm-installed typia `native`
//     directory of both @nestia/core and @nestia/sdk, file by file, ignoring
//     `LICENSE` (absent from the Go module zip) and `_test.go` files.
func TestTypiaGoPinMatchesNpmTypia(t *testing.T) {
	root := repoRootForCore(t)
	modules := []string{
		"packages/core/native",
		"packages/core/test",
		"packages/sdk/native",
		"packages/sdk/test",
	}
	pinned := ""
	for _, module := range modules {
		cwd := filepath.Join(root, module)
		declared := declaredTypiaVersion(t, cwd)
		if pinned == "" {
			pinned = declared
		} else if declared != pinned {
			t.Fatalf("%s/go.mod pins typia %s, but %s/go.mod pins %s", module, declared, modules[0], pinned)
		}
		if resolved := resolveTypiaModule(t, cwd); resolved.key() != pinned {
			t.Fatalf("%s pins typia %s but builds with %s", module, pinned, resolved.key())
		}
	}
	source := typiaSourceDirectory(t, filepath.Join(root, modules[0]), pinned)
	for _, pkg := range []string{"core", "sdk"} {
		installed := filepath.Join(root, "packages", pkg, "node_modules", "typia", "native")
		if _, err := os.Stat(installed); err != nil {
			t.Fatalf("@nestia/%s has no installed typia native source: %v", pkg, err)
		}
		if differences := diffTypiaSources(t, source, installed); len(differences) != 0 {
			t.Fatalf(
				"Go-pinned typia %s differs from the typia @nestia/%s installs from npm (%s):\n  %s\nMove the %s pin in every go.mod/go.sum to the commit the npm typia was published from.",
				pinned, pkg, installed, strings.Join(differences, "\n  "), typiaNativeModulePath,
			)
		}
	}
}

type typiaModule struct {
	Path    string
	Version string
	Dir     string
	Replace *typiaModule
}

// key names the source a module resolves to: the replacement when one exists.
func (module typiaModule) key() string {
	if module.Replace != nil {
		if module.Replace.Version != "" {
			return module.Replace.Version
		}
		return "replace " + module.Replace.Dir
	}
	return module.Version
}

// typiaSourceDirectory returns the module-cache directory of the pinned typia,
// downloading it when the cache does not hold it yet.
func typiaSourceDirectory(t *testing.T, cwd, version string) string {
	t.Helper()
	var downloaded typiaModule
	decodeGoJSON(t, cwd, &downloaded, "mod", "download", "-json", typiaNativeModulePath+"@"+version)
	if downloaded.Dir == "" {
		t.Fatalf("go mod download returned no directory for %s@%s", typiaNativeModulePath, version)
	}
	return downloaded.Dir
}

// declaredTypiaVersion reads the typia requirement from the module's own go.mod,
// before minimal version selection or any replace directive applies.
func declaredTypiaVersion(t *testing.T, cwd string) string {
	t.Helper()
	var file struct {
		Require []typiaModule
	}
	decodeGoJSON(t, cwd, &file, "mod", "edit", "-json")
	for _, requirement := range file.Require {
		if requirement.Path == typiaNativeModulePath {
			return requirement.Version
		}
	}
	t.Fatalf("%s/go.mod does not require %s", cwd, typiaNativeModulePath)
	return ""
}

func resolveTypiaModule(t *testing.T, cwd string) typiaModule {
	t.Helper()
	var module typiaModule
	decodeGoJSON(t, cwd, &module, "list", "-m", "-json", typiaNativeModulePath)
	if module.Version == "" && module.Replace == nil {
		t.Fatalf("%s does not require %s", cwd, typiaNativeModulePath)
	}
	return module
}

func decodeGoJSON(t *testing.T, cwd string, output any, args ...string) {
	t.Helper()
	command := exec.Command("go", args...)
	command.Dir = cwd
	var stderr bytes.Buffer
	command.Stderr = &stderr
	stdout, err := command.Output()
	if err != nil {
		t.Fatalf("go %s in %s failed: %v\n%s", strings.Join(args, " "), cwd, err, stderr.String())
	}
	if err := json.Unmarshal(stdout, output); err != nil {
		t.Fatalf("go %s in %s printed invalid JSON: %v\n%s", strings.Join(args, " "), cwd, err, stdout)
	}
}

// diffTypiaSources lists every file present on one side only or differing in
// content, as slash-separated paths relative to the two roots.
func diffTypiaSources(t *testing.T, left, right string) []string {
	t.Helper()
	leftFiles := listTypiaSourceFiles(t, left)
	rightFiles := listTypiaSourceFiles(t, right)
	differences := []string{}
	for file := range leftFiles {
		if rightFiles[file] == false {
			differences = append(differences, "only in the Go module: "+file)
			continue
		}
		leftData := mustReadBytes(t, filepath.Join(left, filepath.FromSlash(file)))
		rightData := mustReadBytes(t, filepath.Join(right, filepath.FromSlash(file)))
		if bytes.Equal(leftData, rightData) == false {
			differences = append(differences, "differs: "+file)
		}
	}
	for file := range rightFiles {
		if leftFiles[file] == false {
			differences = append(differences, "only in npm: "+file)
		}
	}
	sort.Strings(differences)
	return differences
}

func listTypiaSourceFiles(t *testing.T, root string) map[string]bool {
	t.Helper()
	files := map[string]bool{}
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return nil
		}
		relative, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		relative = filepath.ToSlash(relative)
		if relative == "LICENSE" || strings.HasSuffix(relative, "_test.go") {
			return nil
		}
		files[relative] = true
		return nil
	})
	if err != nil {
		t.Fatalf("walk %s: %v", root, err)
	}
	return files
}

func mustReadBytes(t *testing.T, path string) []byte {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return data
}
