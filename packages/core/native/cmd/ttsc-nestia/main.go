package main

import (
	"fmt"
	"io"
	"os"
)

var (
	stdout io.Writer = os.Stdout
	stderr io.Writer = os.Stderr
)

func main() {
	os.Exit(run(os.Args[1:]))
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
