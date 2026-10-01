package transform

import (
	"fmt"
	"io"
	"os"
	"runtime/debug"
)

var (
	stdout io.Writer = os.Stdout
	stderr io.Writer = os.Stderr
)

// Run wraps run() in a panic recovery envelope so that any unexpected
// panic surfaces as a one-line transform-diagnostic on stderr instead of
// a multi-line raw Go stack trace. The diagnostic uses the same `<file> -
// error TS(code): message` shape as every other nestia / typia diagnostic;
// ttsc reads it via `error.stderr` (`RuntimeCompiler.compile` at
// `ConfigAnalyzer.ts:170-174`) rather than its structured-diagnostic regex,
// which is a pre-existing protocol shared by all `nestia.*` codes. The
// full stack is preserved behind NESTIA_NATIVE_DEBUG_STACK for triage.
//
// This is the `@nestia/core` plugin entry point. It performs typia and core
// decorator rewrites, then runs any statically linked contributor rewrite
// collectors such as the SDK metadata pass when the caller explicitly enables
// them.
//
// @evidence contracts/common.md#principled-implementation The command runs inside a `recover`, so an unexpected panic becomes one diagnostic line with the same shape as every other diagnostic and exit code 3 instead of a raw Go stack, and the stack is printed only when `NESTIA_NATIVE_DEBUG_STACK` is set.
// @evidence contracts/common.md#clear-and-simple-design One deferred handler around the private dispatcher.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The recovery reports the failure; it does not retry or hide it, and the exit code stays non-zero.
// @evidence contracts/common.md#meaningful-documentation The comment explains the recovery envelope, the diagnostic shape, and the debug variable.
func Run(args []string) (code int) {
	defer func() {
		if exp := recover(); exp != nil {
			diag := Diagnostic{
				Code:    "nestia.internal.panic",
				Message: fmt.Sprintf("ttsc-nestia panicked: %v", exp),
			}
			WriteTypiaTransformDiagnostics(stderr, []Diagnostic{diag}, "")
			if os.Getenv("NESTIA_NATIVE_DEBUG_STACK") != "" {
				fmt.Fprintln(stderr, string(debug.Stack()))
			}
			code = 3
		}
	}()
	return run(args)
}

// RunWithOutput is Run with the host's stdout and stderr writers redirected for
// the duration of the call, then restored.
//
// The project-mode `transform` subcommand publishes its whole result — the
// transformed sources, the diagnostics, and the reference graph — as one JSON
// envelope on stdout, and unlike the single-file path it has no `--out` seam. An
// exit code is therefore the only thing an external test module can observe
// about it, which is not enough to pin what the envelope carries. This makes the
// envelope itself observable without giving the CLI a flag ttsc never passes.
//
// Restoring inside the call keeps the redirect scoped: a nil writer is ignored,
// so a caller can redirect one stream and leave the other on the process. The
// writers are package state, so concurrent calls would interleave; the host runs
// one command per process and Go tests in one package run sequentially unless
// they opt into t.Parallel.
//
// @evidence contracts/common.md#principled-implementation The two package writers are replaced for the duration of one call and restored by a `defer`, so a caller can observe the JSON envelope of the project-mode transform, which an exit code alone cannot show; a nil writer leaves its stream unchanged.
// @evidence contracts/common.md#clear-and-simple-design One function that swaps the writers, calls `Run`, and restores them.
// @evidence contracts/common.md#prohibited-implementation-shortcuts This is a test seam kept as an exported function because the external test module cannot reach the private writers; it changes no behavior of the command, but it mutates package state and is therefore not safe for concurrent calls, as its comment says, and it is used only by the Go test modules.
// @evidence contracts/common.md#meaningful-documentation The comment explains why the seam exists, its restore behavior, and the concurrency limit.
func RunWithOutput(args []string, out io.Writer, errOut io.Writer) int {
	previousOut, previousErr := stdout, stderr
	defer func() {
		stdout, stderr = previousOut, previousErr
	}()
	if out != nil {
		stdout = out
	}
	if errOut != nil {
		stderr = errOut
	}
	return Run(args)
}

func run(args []string) int {
	if len(args) == 0 {
		return runHelp(nil)
	}
	command := args[0]
	rest := args[1:]
	switch command {
	case "build":
		return runBuild(rest)
	case "check":
		return runCheck(rest)
	case "transform":
		return runTransform(rest)
	case "version":
		fmt.Fprintln(stdout, "ttsc-nestia 0.1.0")
		return 0
	case "help", "-h", "--help":
		return runHelp(rest)
	default:
		fmt.Fprintf(stderr, "ttsc-nestia: unknown command %q\n", command)
		return 2
	}
}

func runHelp(args []string) int {
	_ = args
	fmt.Fprintln(stdout, "usage: ttsc-nestia <build|check|transform|version>")
	return 0
}
