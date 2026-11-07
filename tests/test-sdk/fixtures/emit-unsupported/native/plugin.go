// Package unsupported is a real linked transform without an observation contract.
package unsupported

import (
	"errors"
	"os"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

func init() { driver.RegisterPlugin(transform{}) }

type transform struct{}

// ApplyProgram deliberately leaves its external read unreported. The descriptor
// must therefore keep the entire checked project on fresh compilation. Rejecting
// changed content makes dropping this hook or replaying a stale success visible.
func (transform) ApplyProgram(_ *driver.Program, context driver.PluginContext) error {
	file, _ := context.Entry.Config["external"].(string)
	contents, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	if string(contents) == "reject" {
		return errors.New("unsupported contributor rejected external input")
	}
	return nil
}
