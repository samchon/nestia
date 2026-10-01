// This test producer compiles independent SDK projects in one native process.
// Each dispatch loads and closes its own driver program and metadata collection;
// sharing a process must never combine unrelated DTO naming scopes.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/samchon/nestia/packages/core/native/transform"
	_ "github.com/samchon/nestia/packages/sdk/native/sdk"
)

// Project identifies one independently checked and emitted authored program.
//
// @evidence contracts/common.md#principled-implementation Caller-resolved cwd/config/output and the actual plugin plan fully identify one native dispatch; no type-name or fixture-name override is represented.
// @evidence contracts/common.md#clear-and-simple-design Five JSON fields describe the compilation request and diagnostic identity without owning filesystem or process resources.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries authored program inputs; it cannot substitute a snapshot or merge another member's metadata context.
// @evidence contracts/common.md#meaningful-documentation The comment identifies independent program checking and emission, while JSON names mirror the JavaScript plan writer.
// @evidence contracts/portability.md#os-neutral-implementation Paths are caller-resolved native strings in JSON, not shell fragments or slash-based package membership tests; the dispatcher interprets them through its filesystem abstraction.
// @evidence contracts/performance.md#efficient-algorithms The record has five fields and adds no traversal or lookup algorithm; decoding cost grows with the path/configuration bytes supplied for that project.
// @evidence contracts/performance.md#reuse-equivalent-work Project identities retain independent config/output/plugin inputs rather than deduplicating requests by equal tsconfig text; the owning RunProjects operation shares only compiled native dispatch.
// @evidence contracts/performance.md#bound-retention-and-release-resources Each record holds its input strings and plugin JSON without handles. The decoded list lives for this one producer invocation and grows with its explicit plan; per-project driver lifetime belongs to RunProjects.
type Project struct {
	Name    string          `json:"name"`
	CWD     string          `json:"cwd"`
	Config  string          `json:"config"`
	OutDir  string          `json:"outDir"`
	Plugins json.RawMessage `json:"plugins"`
}

// main owns the test producer's process status and requires an explicit plan.
//
// It validates one argument and exits with RunProjects' actual result; the
// exported operation owns the implementation acknowledgments for this entry.
func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "SDK native producer requires one project-plan path")
		os.Exit(2)
	}
	os.Exit(RunProjects(os.Args[1]))
}

// RunProjects emits every project while retaining independent failure names.
//
// @evidence contracts/common.md#principled-implementation Each project is a separate real native build invocation with its own config, output and plugin options, preserving program-scoped schema names; failure is retained while later independent projects continue.
// @evidence contracts/common.md#clear-and-simple-design One decoded project list and one sequential dispatch loop own compilation and diagnostics; the JavaScript harness owns configurations, package preparation and output removal.
// @evidence contracts/common.md#prohibited-implementation-shortcuts Core and SDK register through ordinary Go imports and the dispatcher performs actual checking/emit. No source graph is combined, no compiler result is fabricated and no installed module loader is changed.
// @evidence contracts/common.md#meaningful-documentation The comment states continuation and status ownership; per-project timing exposes preparation cost without treating it as a performance guarantee.
// @evidence contracts/portability.md#os-neutral-implementation JSON carries caller-resolved native filesystem paths and dispatch receives an argument array; this process composes no shell or platform-specific deletion command.
// @evidence contracts/performance.md#efficient-algorithms One necessary program check and emit runs per project; orchestration is linear in plan size and buffers only one project's diagnostics at a time.
// @evidence contracts/performance.md#reuse-equivalent-work The compiled native executable and registered transforms are shared across projects; each independent config/source graph retains its own driver program and metadata collection because equal tsconfigs alone do not establish schema-name equivalence.
// @evidence contracts/performance.md#bound-retention-and-release-resources The dispatcher closes its driver program after each build and local output buffers are released before the next iteration. The caller removes owned output trees after all consuming Node processes finish.
func RunProjects(plan string) int {
	data, err := os.ReadFile(plan)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 2
	}
	var projects []Project
	if err := json.Unmarshal(data, &projects); err != nil || len(projects) == 0 {
		fmt.Fprintf(os.Stderr, "SDK native producer requires a nonempty valid plan: %v\n", err)
		return 2
	}
	failed := false
	for _, item := range projects {
		if item.Name == "" || item.CWD == "" || item.Config == "" || item.OutDir == "" || len(item.Plugins) == 0 {
			fmt.Fprintln(os.Stderr, "SDK native producer received an incomplete project")
			failed = true
			continue
		}
		started := time.Now()
		var stdout, stderr bytes.Buffer
		code := transform.RunWithOutput([]string{
			"build", "--cwd", item.CWD, "--tsconfig", item.Config,
			"--emit", "--outDir", item.OutDir, "--plugins-json", string(item.Plugins),
		}, &stdout, &stderr)
		fmt.Printf("Native SDK project %s: %s\n", item.Name, time.Since(started))
		if code != 0 {
			failed = true
			fmt.Fprintf(os.Stderr, "Native SDK project %s failed (%d)\n%s\n%s\n", item.Name, code, &stdout, &stderr)
		}
	}
	if failed {
		return 1
	}
	return 0
}
