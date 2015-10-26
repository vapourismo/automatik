modules = base backends groups index

build_dir = build
input_files = $(modules:%=%.jsx)
transpiled_files = $(modules:%=$(build_dir)/%.js)

bundle_output = static/index.js

all: $(bundle_output)

clean:
	rm -rf $(bundle_output)
	rm -rf $(transpiled_files) $(build_dir)

$(build_dir):
	mkdir -p $@

$(bundle_output): $(transpiled_files)
	webpack $(transpiled_files) $@

$(build_dir)/%.js: %.jsx $(build_dir)
	babel $< -o $@
