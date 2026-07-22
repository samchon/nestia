package plugin

import (
	"encoding/json"
	"fmt"
	"strings"
)

const (
	CoreNativeTransform = "@nestia/core/native/transform.cjs"
	CoreTransform       = "@nestia/core/lib/transform"
	SDKNativeTransform  = "@nestia/sdk/native/transform.cjs"
	SDKTransform        = "@nestia/sdk/lib/transform"
	TypiaTransform      = "typia/lib/transform"
)

type Entry struct {
	Name      string
	Stage     string
	Transform string
	Config    map[string]any
}

type Plan struct {
	Core    bool
	SDK     bool
	Typia   bool
	Entries []Entry
}

func (p Plan) UsesNestia() bool {
	return p.Core || p.SDK
}

// Kind reports which plugin family an entry belongs to: "core", "sdk", "typia",
// or "" when it is none of them.
func (e Entry) Kind() string {
	return classify(e)
}

// BoolConfig reads a boolean option from an entry's resolved plugin config. The
// second result distinguishes an option explicitly set to false from one that is
// absent, which the tri-state options depend on.
func (e Entry) BoolConfig(key string) (bool, bool) {
	if e.Config == nil {
		return false, false
	}
	value, ok := e.Config[key].(bool)
	return value, ok
}

func ParsePlan(payload string) (Plan, error) {
	payload = strings.TrimSpace(payload)
	if payload == "" {
		return Plan{}, nil
	}

	var raws []struct {
		Name   string         `json:"name"`
		Stage  string         `json:"stage"`
		Config map[string]any `json:"config"`
	}
	if err := json.Unmarshal([]byte(payload), &raws); err != nil {
		return Plan{}, fmt.Errorf("parse plugins-json: %w", err)
	}

	plan := Plan{
		Entries: make([]Entry, 0, len(raws)),
	}
	for _, raw := range raws {
		stage := raw.Stage
		if stage == "" {
			stage = "transform"
		}
		transform := stringConfig(raw.Config, "transform")
		entry := Entry{
			Name:      raw.Name,
			Stage:     stage,
			Transform: transform,
			Config:    raw.Config,
		}
		plan.Entries = append(plan.Entries, entry)
		kind := classify(entry)
		plan.Core = plan.Core || kind == "core"
		plan.SDK = plan.SDK || kind == "sdk"
		plan.Typia = plan.Typia || kind == "typia"
	}
	return plan, nil
}

func classify(entry Entry) string {
	name := strings.TrimSpace(entry.Name)
	transform := strings.TrimSpace(entry.Transform)
	switch {
	case name == "@nestia/core" || transform == CoreTransform || transform == CoreNativeTransform:
		return "core"
	case name == "@nestia/sdk" || transform == SDKTransform || transform == SDKNativeTransform:
		return "sdk"
	case name == "typia" || transform == TypiaTransform:
		return "typia"
	default:
		return ""
	}
}

func stringConfig(config map[string]any, key string) string {
	if config == nil {
		return ""
	}
	value, ok := config[key]
	if !ok {
		return ""
	}
	text, ok := value.(string)
	if !ok {
		return ""
	}
	return text
}
