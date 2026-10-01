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

// Entry is one plugin of the ordered list that ttsc hands to the host: its name, stage, the `transform` specifier of its configuration, and the whole configuration.
//
// @evidence contracts/common.md#principled-implementation The fields are the parts of the payload that classification and option reading need, with the transform specifier lifted out of the configuration map once so every later comparison reads a string.
// @evidence contracts/common.md#clear-and-simple-design A plain record with no behavior; the two methods answer questions about it.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It carries the payload as given, and no plugin name or option is special-cased here.
// @evidence contracts/common.md#meaningful-documentation The comment names the fields and where the value comes from.
type Entry struct {
	Name      string
	Stage     string
	Transform string
	Config    map[string]any
}

// Plan is the parsed plugin list: the entries in order and one flag for each plugin family present.
//
// @evidence contracts/common.md#principled-implementation The three flags are computed once by `ParsePlan` from the classification of every entry, so the callers ask a boolean instead of rescanning the list.
// @evidence contracts/common.md#clear-and-simple-design A record of three flags and the ordered entries, with one derived accessor.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It holds parsed data only, and the flags follow from the entries.
// @evidence contracts/common.md#meaningful-documentation The comment states what each part of the plan means.
type Plan struct {
	Core    bool
	SDK     bool
	Typia   bool
	Entries []Entry
}

// UsesNestia reports whether the plan contains a `@nestia/core` or a `@nestia/sdk` entry, that is, whether any nestia rewrite is wanted.
//
// @evidence contracts/common.md#principled-implementation The result is the disjunction of the two family flags, which is exactly the condition under which the nestia passes run.
// @evidence contracts/common.md#clear-and-simple-design A one-line accessor over two fields, so the condition has one definition.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the flags and nothing else.
// @evidence contracts/common.md#meaningful-documentation The comment states the condition.
func (p Plan) UsesNestia() bool {
	return p.Core || p.SDK
}

// Kind reports which plugin family an entry belongs to: "core", "sdk", "typia",
// or "" when it is none of them.
//
// @evidence contracts/common.md#principled-implementation The family is decided by the entry name or by the `transform` specifier compared with the known published specifiers, so an entry written under either spelling of the plugin is recognized, and any other entry is not a family member.
// @evidence contracts/common.md#clear-and-simple-design A one-line method over the private classifier, so one function owns the naming rules.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The names are the published package specifiers, which are contract constants, and no consumer or path is special-cased.
// @evidence contracts/common.md#meaningful-documentation The comment lists the four possible results.
func (e Entry) Kind() string {
	return classify(e)
}

// BoolConfig reads a boolean option from an entry's resolved plugin config. The
// second result distinguishes an option explicitly set to false from one that is
// absent, which the tri-state options depend on.
//
// @evidence contracts/common.md#principled-implementation A boolean read from the configuration returns its value and a presence flag, so an option explicitly set to false is distinct from an absent one, which the tri-state options need; a non-boolean value reads as absent.
// @evidence contracts/common.md#clear-and-simple-design One map lookup and one type assertion.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It reads only the configuration of the entry it is called on.
// @evidence contracts/common.md#meaningful-documentation The comment states why the second result exists.
func (e Entry) BoolConfig(key string) (bool, bool) {
	if e.Config == nil {
		return false, false
	}
	value, ok := e.Config[key].(bool)
	return value, ok
}

// ParsePlan parses the ordered plugin payload that ttsc passes as `--plugins-json`.
//
// An empty payload is an empty plan. A payload that is not a JSON list of plugins is an error naming the flag. An entry without a stage is a `transform` stage entry.
//
// @evidence contracts/common.md#principled-implementation The payload is decoded with the standard JSON decoder, each entry keeps its order, its stage defaults to `transform`, its transform specifier is read from the configuration, and the family flags are the disjunction over the entries.
// @evidence contracts/common.md#clear-and-simple-design One function that decodes, normalizes, and classifies; the string reading and the classification are private helpers.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The defaults are the ttsc protocol's, and the function trusts the payload only as far as decoding it.
// @evidence contracts/common.md#meaningful-documentation The comment states the accepted payloads, the error, and the stage default.
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
