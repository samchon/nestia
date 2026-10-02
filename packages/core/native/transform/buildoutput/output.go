// Package buildoutput owns a build's buffered artifact publication and reporting.
package buildoutput

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
)

// Options fixes the command's reporting and publication policy for one build.
//
// @evidence contracts/common.md#principled-implementation Emit reflects the original compiler configuration, while Quiet and Manifest retain the requested output protocol; the three plugin flags and project paths describe the actual build summary.
// @evidence contracts/common.md#clear-and-simple-design One value separates immutable command policy from buffered artifacts and the filesystem writer.
// @evidence contracts/common.md#prohibited-implementation-shortcuts These values come from resolved command inputs and compiler options, without fixture or caller-name decisions.
// @evidence contracts/common.md#meaningful-documentation The declaration identifies the lifetime and meaning of publication policy.
// @evidence contracts/performance.md#efficient-algorithms This fixed policy record performs no traversal or computation; session construction copies its scalar fields and string references once.
// @evidence contracts/performance.md#reuse-equivalent-work One immutable resolved policy is shared by callbacks of the same build; a new build receives its own policy instead of a cached compiler configuration.
// @evidence contracts/performance.md#bound-retention-and-release-resources The record holds flags and path strings only, with no handles or independently growing collection; its lifetime belongs to one output session.
// @evidence contracts/portability.md#os-neutral-implementation Paths remain caller-provided opaque strings until the manifest filesystem owner interprets them through native filepath operations; the policy introduces no separator or platform-name assumptions.
type Options struct {
	// TSConfig is the requested project path shown in the initial summary.
	TSConfig string

	// CWD is the resolved working directory shown in the initial summary.
	CWD string

	// Manifest is the explicitly requested output-list path; empty disables it.
	Manifest string

	// Core, SDK and Typia are the resolved composing-plugin flags.
	Core, SDK, Typia bool

	// Emit is the original compiler policy, before any private analysis traversal.
	Emit bool

	// Quiet suppresses both initial and successful-publication summaries.
	Quiet bool
}

// Publisher buffers compiler artifacts until the caller reports successful completion.
// Its write callback is the build's artifact filesystem boundary; manifest output
// uses native filesystem operations. Finish follows completed producer callbacks
// and terminates the session, releasing all buffered strings even on failure.
//
// @evidence contracts/common.md#principled-implementation Compiler callbacks append under a mutex only for an emitting configuration. The completion verdict gates all artifact and requested-manifest writes; artifacts precede the manifest, and any filesystem failure stops publication and the success summary.
// @evidence contracts/common.md#clear-and-simple-design One command-scoped session owns the immutable policy, concurrent buffer and output dependencies; no compiler, transform or project loader is retained.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies the existing production artifact writer, not a replaced foreign method. Completion comes from actual compiler and transform diagnostics; this layer does not invent their verdict.
// @evidence contracts/common.md#meaningful-documentation The declaration states writer ownership, producer completion, session termination and failure release behavior.
// @evidence contracts/performance.md#efficient-algorithms Buffering and publication each visit every emitted artifact once; manifest encoding costs the sum of path lengths.
// @evidence contracts/performance.md#reuse-equivalent-work Immutable build policy is shared by all concurrent compiler callbacks of this session only, and a manifest uses the same ordered artifact paths.
// @evidence contracts/performance.md#bound-retention-and-release-resources Only one build's output strings are retained until Finish, which detaches the entire buffer before any filesystem call. No package state or file handle survives completion.
// @evidence contracts/portability.md#os-neutral-implementation Artifact paths are delegated unchanged to the production writer, and the manifest uses native filesystem operations in Finish. Session state and mutex semantics do not depend on a host operating system.
type Publisher struct {
	options   Options
	stdout    io.Writer
	writeFile func(string, string) error
	mutex     sync.Mutex
	pending   []artifact
}

type artifact struct{ fileName, text string }

// New begins one output session and writes its initial summary when requested.
//
// @evidence contracts/common.md#principled-implementation The initial summary reports the original Emit policy before transforms run, so a verbose analysis-only build reports emit=false even when its private transformer traversal emits into a discarded buffer.
// @evidence contracts/common.md#clear-and-simple-design Construction stores policy and actual output boundaries, then writes one conditional summary.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The actual command supplies paths, plugin flags and writers; no expected diagnostic or artifact is fabricated.
// @evidence contracts/common.md#meaningful-documentation The comment distinguishes the initial summary from successful publication reporting.
// @evidence contracts/performance.md#efficient-algorithms Construction allocates one fixed session and formats at most one summary, costing the reported path lengths rather than loading or scanning a compiler project.
// @evidence contracts/performance.md#reuse-equivalent-work The same options and writer references serve all callbacks in this one build, with no cross-build cache or compiler identity reuse.
// @evidence contracts/performance.md#bound-retention-and-release-resources The command owns the returned session; construction creates no file or process handles, and the command's terminal Finish releases buffered outputs.
// @evidence contracts/portability.md#os-neutral-implementation The initial report prints caller-provided paths as text and does not join, normalize or infer an operating system from them.
func New(options Options, stdout io.Writer, writeFile func(string, string) error) *Publisher {
	p := &Publisher{options: options, stdout: stdout, writeFile: writeFile}
	if !options.Quiet {
		fmt.Fprintf(stdout, "// ttsc-nestia build: tsconfig=%s cwd=%s core=%v sdk=%v typia=%v emit=%v\n", options.TSConfig, options.CWD, options.Core, options.SDK, options.Typia, options.Emit)
	}
	return p
}

// Write buffers a completed artifact without publishing bytes; analysis-only output is discarded.
//
// @evidence contracts/common.md#principled-implementation Original non-emitting policy discards callback output. An emitting session serializes each filename/text pair under its mutex so parallel declaration callbacks cannot lose or misassociate artifacts.
// @evidence contracts/common.md#clear-and-simple-design One policy check and one protected append implement the compiler callback boundary.
// @evidence contracts/common.md#prohibited-implementation-shortcuts Every buffered filename and byte string comes from the actual compiler callback; this operation invokes no filesystem or compiler surrogate.
// @evidence contracts/common.md#meaningful-documentation The comment states deferred publication and the analysis-only discard rule.
// @evidence contracts/performance.md#efficient-algorithms Each callback performs one policy check and amortized constant-time append under a mutex; it retains the compiler strings without reparsing or copying their contents.
// @evidence contracts/performance.md#reuse-equivalent-work Callbacks share only the immutable session policy and its protected buffer. No artifact is inferred from or substituted for another callback's bytes.
// @evidence contracts/performance.md#bound-retention-and-release-resources Each filename/text pair remains scoped to this build until Finish detaches the complete buffer, including rejected and analysis-only completion paths.
// @evidence contracts/portability.md#os-neutral-implementation The callback preserves compiler-provided filename text and performs no path interpretation, filesystem call or platform-dependent concurrency branch.
func (p *Publisher) Write(fileName, text string) {
	if !p.options.Emit {
		return
	}
	p.mutex.Lock()
	defer p.mutex.Unlock()
	p.pending = append(p.pending, artifact{fileName: fileName, text: text})
}

// Finish commits successful emitting output in artifact/manifest/summary order.
// A rejected or analysis-only build writes no artifacts or manifest. The buffer
// is released on every path; a filesystem failure can leave preceding artifacts
// and is returned to the command for its nonzero diagnostic protocol.
//
// @evidence contracts/common.md#principled-implementation The actual completion verdict and Emit policy jointly gate publication. Each callback artifact is written unchanged; the explicitly requested manifest contains exactly those paths, and the success summary appears only after all writes succeed. Earlier writes are not claimed to be transactional on an IO failure.
// @evidence contracts/common.md#clear-and-simple-design One terminal operation detaches the session buffer, applies two guards and executes ordered artifact, manifest and summary stages with immediate error returns.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The operation does not invoke a compiler or infer success from output presence. Its callback is the caller-owned filesystem boundary, and manifest creation uses standard native IO.
// @evidence contracts/common.md#meaningful-documentation The comment states artifact ordering, no-output states, buffer release and the partial-write limit on IO failure.
// @evidence contracts/portability.md#os-neutral-implementation The requested manifest uses filepath.Dir and native os.MkdirAll/os.WriteFile. Artifact paths are passed unchanged to the production writer; no platform-name predicate or path separator assumption is introduced.
// @evidence contracts/performance.md#efficient-algorithms Completion traverses each retained artifact once and encodes the ordered path list once, costing artifact count plus emitted bytes and manifest path lengths; it starts no compiler or product host.
// @evidence contracts/performance.md#reuse-equivalent-work The manifest derives from the exact successfully written ordered artifacts of this session, and no output list or success verdict is cached across builds.
// @evidence contracts/performance.md#bound-retention-and-release-resources The session buffer is detached before either guard or any filesystem write; local output references are released at return even on the first IO error, and native write operations close their own handles.
func (p *Publisher) Finish(succeeded bool) error {
	p.mutex.Lock()
	pending := p.pending
	p.pending = nil
	p.mutex.Unlock()
	if !succeeded || !p.options.Emit {
		return nil
	}
	emitted := make([]string, 0, len(pending))
	for _, output := range pending {
		if err := p.writeFile(output.fileName, output.text); err != nil {
			return fmt.Errorf("emit write failed: %w", err)
		}
		emitted = append(emitted, output.fileName)
	}
	if p.options.Manifest != "" {
		data, err := json.Marshal(emitted)
		if err != nil {
			return fmt.Errorf("manifest marshal failed: %w", err)
		}
		if err := os.MkdirAll(filepath.Dir(p.options.Manifest), 0o755); err != nil {
			return fmt.Errorf("manifest mkdir failed: %w", err)
		}
		if err := os.WriteFile(p.options.Manifest, data, 0o644); err != nil {
			return fmt.Errorf("manifest write failed: %w", err)
		}
	}
	if !p.options.Quiet {
		fmt.Fprintf(p.stdout, "// ttsc-nestia build: emitted=%d files\n", len(emitted))
	}
	return nil
}
