package main

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

func main() {
	os.Exit(runSafe(os.Args[1:]))
}

// runSafe wraps run() in a panic recovery envelope so that any unexpected
// panic surfaces as a parseable transform-diagnostic line on stderr instead
// of a raw Go stack trace that ttsc's compiler-diagnostic regex cannot read.
// The full stack is preserved behind NESTIA_NATIVE_DEBUG_STACK for triage.
func runSafe(args []string) (code int) {
	defer func() {
		if exp := recover(); exp != nil {
			diag := typiaTransformDiagnostic{
				Code:    "nestia.internal.panic",
				Message: fmt.Sprintf("ttsc-nestia panicked: %v", exp),
			}
			writeTypiaTransformDiagnostics(stderr, []typiaTransformDiagnostic{diag}, "")
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
