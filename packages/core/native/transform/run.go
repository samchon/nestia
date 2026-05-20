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
// This is the `@nestia/core` plugin entry point — it performs the typia
// and `@nestia/core` decorator transforms only. The `@nestia/sdk` metadata
// transform lives in its own plugin (`packages/sdk/native`).
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
