package transform

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// checkServeRequest is one analysis watch cycle: the filesystem transitions
// since the previous cycle. Project, plugin and compiler options are fixed by
// the command line the host was started with.
type checkServeRequest struct {
	Invalidate bool     `json:"invalidate,omitempty"`
	Changed    []string `json:"changed,omitempty"`
	External   []string `json:"external,omitempty"`
}

// checkServeTelemetry reports how the resident Program served the cycle.
type checkServeTelemetry struct {
	PID            int  `json:"pid"`
	ProgramLoads   int  `json:"programLoads"`
	ProgramUpdates int  `json:"programUpdates"`
	Reused         bool `json:"reused"`
}

// checkServeResponse is one cycle's answer in ttsc's resident check protocol.
type checkServeResponse struct {
	Status    int                 `json:"status"`
	Stdout    string              `json:"stdout"`
	Stderr    string              `json:"stderr"`
	Telemetry checkServeTelemetry `json:"telemetry"`

	// ProgramFiles names the checked Program's files as the compiler names
	// them, default libraries under `bundled:///libs/`, so ttsc takes the
	// project's membership from it instead of listing the project again.
	ProgramFiles []string `json:"programFiles,omitempty"`

	// TypeScriptDiagnosticsReported acknowledges that Stderr holds the loaded
	// Program's complete TypeScript diagnostic batch, failing or not. Absent
	// when the cycle failed before a Program was reported.
	TypeScriptDiagnosticsReported bool `json:"typeScriptDiagnosticsReported,omitempty"`
}

// checkServeState owns at most one resident Program and its reload policy.
//
// A Program stays resident only while answering a cycle cannot change its
// ASTs. typia's and core's transforms build their output through the emit
// context and leave the parsed sources intact, so they run on the resident
// Program every cycle. Two things do not:
//
//   - A linked ProgramPlugin, such as the @nestia/sdk plugin a nestia v11
//     plugin list still names, rewrites the parsed sources before the
//     transforms run. A Program with any linked ProgramPlugin is loaded fresh
//     for every cycle and answered exactly as one-shot `check` answers it. A
//     driver.CheckingProgramPlugin does not lift this here: its CheckProgram
//     skips the mutation the transforms would otherwise see after it.
//   - A contributor transform, such as the @nestia/sdk OperationMetadata pass
//     under NESTIA_SDK_TRANSFORM=1, prepends its decorator and import to the
//     source lists it is handed. A cycle that ran one drops the Program, so
//     the next cycle loads a fresh one.
type checkServeState struct {
	cwd      string
	tsconfig string
	outDir   string
	plan     plugin.Plan
	quiet    bool
	profile  bool
	session  *driver.Session
	loads    int
	updates  int
}

// runCheckServe is the resident analysis check for `ttsc --noEmit --watch`
// (samchon/ttsc#1864). It accepts check's arguments, reads one JSON request per
// line from stdin and writes one JSON response per request to stdout until
// stdin reaches EOF. Each response answers what a cold `check` of the same
// files answers, with the same status, stdout and stderr. Exit status 2
// reports a startup, read or response-write failure; check failures travel in
// each response.
func runCheckServe(args []string) int {
	fs, flags := newBuildFlags("check-serve")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if *flags.emit || *flags.manifest != "" || *flags.observations != "" || *flags.provenance != "" {
		fmt.Fprintln(stderr, "ttsc-nestia check-serve: --emit, --manifest and the private result paths need an emitting build")
		return 2
	}
	plan, err := plugin.ParsePlan(*flags.plugins)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia check-serve: %v\n", err)
		return 2
	}
	cwd, ok := resolveCWD("ttsc-nestia check-serve", *flags.cwd)
	if !ok {
		return 2
	}
	// Session keys Program paths against an absolute project directory.
	if cwd, err = filepath.Abs(cwd); err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia check-serve: cwd: %v\n", err)
		return 2
	}
	state := &checkServeState{
		cwd:      cwd,
		tsconfig: *flags.tsconfig,
		outDir:   *flags.outDir,
		plan:     plan,
		quiet:    *flags.quiet && !*flags.verbose,
		profile:  os.Getenv("TTSC_NESTIA_PROFILE") != "",
	}
	defer state.close()
	protocol, failures := stdout, stderr
	encoder := json.NewEncoder(protocol)
	reader := bufio.NewReader(stdin)
	for {
		raw, readErr := reader.ReadString('\n')
		if line := strings.TrimSpace(raw); line != "" {
			if err := encoder.Encode(state.handle(line)); err != nil {
				fmt.Fprintf(failures, "ttsc-nestia check-serve: write error: %v\n", err)
				return 2
			}
		}
		if readErr != nil {
			if readErr != io.EOF {
				fmt.Fprintf(failures, "ttsc-nestia check-serve: read error: %v\n", readErr)
				return 2
			}
			return 0
		}
	}
}

func (s *checkServeState) close() {
	if s.session != nil {
		_ = s.session.Close()
		s.session = nil
	}
}

// handle answers one request line. A panic drops the resident Program and is
// reported as Run reports it for a one-shot command.
func (s *checkServeState) handle(line string) (response checkServeResponse) {
	response = checkServeResponse{Status: 2}
	defer func() {
		if recovered := recover(); recovered != nil {
			s.close()
			var text bytes.Buffer
			WriteTypiaTransformDiagnostics(&text, []Diagnostic{{
				Code:    "nestia.internal.panic",
				Message: fmt.Sprintf("ttsc-nestia panicked: %v", recovered),
			}}, "")
			response = checkServeResponse{Status: 3, Stderr: text.String()}
		}
		response.Telemetry.PID = os.Getpid()
		response.Telemetry.ProgramLoads = s.loads
		response.Telemetry.ProgramUpdates = s.updates
	}()
	var req checkServeRequest
	if err := json.Unmarshal([]byte(line), &req); err != nil {
		response.Stderr = fmt.Sprintf("ttsc-nestia check-serve: invalid request: %v\n", err)
		return response
	}
	return s.check(s.apply(req))
}

// apply moves the resident Program to the request's filesystem state, or drops
// it when only a fresh load can: an invalidation, a path that is neither a
// Program member nor a declared external input, or a change that cannot be
// read. It reports whether the Program kept its graph through every change.
func (s *checkServeState) apply(req checkServeRequest) bool {
	if req.Invalidate {
		s.close()
		return false
	}
	if s.session == nil {
		return false
	}
	external := map[string]struct{}{}
	for _, location := range req.External {
		if resolved, err := filepath.Abs(location); err == nil {
			external[filepath.Clean(resolved)] = struct{}{}
		}
	}
	reused := true
	for _, location := range req.Changed {
		resolved, err := filepath.Abs(location)
		if err != nil {
			s.close()
			return false
		}
		resolved = filepath.Clean(resolved)
		// Contains, unlike Program.SourceFile, dispatches no linked hook.
		if !s.session.Contains(resolved) {
			if _, declared := external[resolved]; declared {
				continue
			}
			s.close()
			return false
		}
		content, err := os.ReadFile(resolved)
		if err != nil {
			s.close()
			return false
		}
		if s.session.Apply(resolved, string(content)) {
			s.updates++
		} else {
			// UpdateProgram reconstructed the Program: a real load, not a reuse.
			s.loads++
			reused = false
		}
	}
	return reused
}

// check answers the current Program as one-shot `check` does, loading it first
// when no resident Program survived apply. Package output is captured for the
// cycle so the answer travels in the response rather than on the protocol
// stream.
func (s *checkServeState) check(reused bool) (response checkServeResponse) {
	var out, errOut bytes.Buffer
	previousOut, previousErr := stdout, stderr
	stdout, stderr = &out, &errOut
	defer func() {
		stdout, stderr = previousOut, previousErr
		response.Stdout = out.String()
		response.Stderr = errOut.String()
	}()

	var prog *driver.Program
	linkedPlugins := func() error { return nil }
	if s.session == nil {
		overlay := driver.NewOverlayFS(driver.DefaultFS())
		loaded, diags, err := driver.LoadProgram(s.cwd, s.tsconfig, driver.LoadProgramOptions{
			ForceNoEmit:        true,
			OutDir:             s.outDir,
			SemanticConfigPath: os.Getenv(driver.SemanticConfigPathEnv),
			FS:                 overlay,
		})
		if err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia build: %v\n", err)
			if loaded != nil {
				loaded.Close()
			}
			return checkServeResponse{Status: 2}
		}
		if len(diags) > 0 || loaded == nil {
			driver.WritePrettyDiagnostics(stderr, diags, s.cwd)
			if loaded != nil {
				loaded.Close()
			}
			return checkServeResponse{Status: 2}
		}
		s.loads++
		reused = false
		prog = loaded
		if prog.HasLinkedProgramPlugins() {
			// Answered as one-shot check answers it, then discarded.
			defer prog.Close()
			linkedPlugins = prog.ApplyLinkedPlugins
		} else {
			s.session = driver.NewSessionFromProgram(s.cwd, overlay, prog)
			linkedPlugins = prog.CheckLinkedPlugins
		}
	} else {
		prog = s.session.Program()
		// With no linked ProgramPlugin this reports only registration failures,
		// without the latch ApplyLinkedPlugins keeps across generations.
		linkedPlugins = prog.CheckLinkedPlugins
	}

	response = checkServeResponse{
		ProgramFiles:                  programFileNames(prog),
		TypeScriptDiagnosticsReported: true,
	}
	response.Telemetry.Reused = reused
	if diags := prog.Diagnostics(); len(diags) > 0 {
		driver.WritePrettyDiagnostics(stderr, diags, s.cwd)
		response.Status = 2
		return response
	}
	status, contributed := analyzeProgram(prog, analysisOptions{
		TSConfig: s.tsconfig, CWD: s.cwd, Plan: s.plan, Quiet: s.quiet, Profile: s.profile,
	}, linkedPlugins)
	response.Status = status
	if contributed {
		// The contributor rewrote this Program's source ASTs in place.
		s.close()
	}
	return response
}

// programFileNames lists a Program's files as the compiler names them.
func programFileNames(prog *driver.Program) []string {
	if prog == nil || prog.TSProgram == nil {
		return nil
	}
	files := prog.TSProgram.SourceFiles()
	names := make([]string, 0, len(files))
	for _, file := range files {
		if file != nil {
			names = append(names, string(file.FileName()))
		}
	}
	return names
}
