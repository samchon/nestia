package test

import (
	"bytes"
	"encoding/json"
	"io"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// checkServeStep is one resident cycle: a filesystem edit made before the
// request is read, then the request line ttsc would send for it.
type checkServeStep struct {
	Before  func()
	Request string
}

// checkServeReply is ttsc's resident check response, declared from the
// protocol rather than from the host's own struct. The acknowledgment is a
// pointer so an omitted field stays distinguishable from false.
type checkServeReply struct {
	Status    int    `json:"status"`
	Stdout    string `json:"stdout"`
	Stderr    string `json:"stderr"`
	Telemetry struct {
		PID            int  `json:"pid"`
		ProgramLoads   int  `json:"programLoads"`
		ProgramUpdates int  `json:"programUpdates"`
		Reused         bool `json:"reused"`
	} `json:"telemetry"`
	ProgramFiles                  []string `json:"programFiles"`
	TypeScriptDiagnosticsReported *bool    `json:"typeScriptDiagnosticsReported"`
}

// scriptedRequests feeds one step per Read. The host's line reader asks for
// more input only after it has answered the previous line, so each edit lands
// between two cycles, as a watcher's save does.
type scriptedRequests struct {
	steps []checkServeStep
	next  int
}

func (s *scriptedRequests) Read(p []byte) (int, error) {
	if s.next >= len(s.steps) {
		return 0, io.EOF
	}
	step := s.steps[s.next]
	s.next++
	if step.Before != nil {
		step.Before()
	}
	return copy(p, step.Request+"\n"), nil
}

// runCheckServeSession runs one in-process check-serve session over the steps
// and returns its replies, failing unless the session ends cleanly with one
// reply per step.
func runCheckServeSession(t *testing.T, args []string, steps []checkServeStep) []checkServeReply {
	t.Helper()
	var out, errOut bytes.Buffer
	code := transform.RunWithIO(append([]string{"check-serve"}, args...), &scriptedRequests{steps: steps}, &out, &errOut)
	if code != 0 {
		t.Fatalf("check-serve exited %d\nstderr=%s", code, errOut.String())
	}
	decoder := json.NewDecoder(&out)
	replies := []checkServeReply{}
	for decoder.More() {
		var reply checkServeReply
		if err := decoder.Decode(&reply); err != nil {
			t.Fatalf("check-serve wrote a malformed reply: %v\n%s", err, out.String())
		}
		replies = append(replies, reply)
	}
	if len(replies) != len(steps) {
		t.Fatalf("check-serve answered %d of %d requests\n%s", len(replies), len(steps), out.String())
	}
	return replies
}

// mustReplyTelemetry asserts one reply's residency counters.
func mustReplyTelemetry(t *testing.T, index int, reply checkServeReply, loads, updates int, reused bool) {
	t.Helper()
	got := reply.Telemetry
	if got.ProgramLoads != loads || got.ProgramUpdates != updates || got.Reused != reused {
		t.Fatalf("reply %d telemetry loads=%d updates=%d reused=%v, want loads=%d updates=%d reused=%v\nstderr=%s",
			index, got.ProgramLoads, got.ProgramUpdates, got.Reused, loads, updates, reused, reply.Stderr)
	}
}

// mustListProgram asserts a reply lists the file and an embedded default
// library under its bundled name.
func mustListProgram(t *testing.T, index int, reply checkServeReply, file string) {
	t.Helper()
	member, library := false, false
	for _, name := range reply.ProgramFiles {
		if strings.HasPrefix(name, "bundled:///libs/") {
			library = true
		} else if filepath.Clean(name) == filepath.Clean(file) {
			member = true
		}
	}
	if !member || !library {
		t.Fatalf("reply %d programFiles lacks %s or a bundled library: %v", index, file, reply.ProgramFiles)
	}
}
