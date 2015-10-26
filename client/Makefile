build_dir      = build
modules        = base groups backends
entry          = index

source_files   = $(modules:%=%.jsx) $(entry:%=%.jsx)

bundle_entry   = $(entry:%=$(build_dir)/%.js)
bundle_modules = $(modules:%=$(build_dir)/%.js)
bundle_output  = static/index.js

all: $(bundle_output)

$(bundle_output): $(bundle_modules) $(bundle_entry)
	webpack $(bundle_entry) $@

$(build_dir):
	mkdir -p $@

$(build_dir)/%.js: %.jsx $(build_dir)
	babel $< -d $(build_dir)

watch: all
	babel -w $(source_files) -d $(build_dir) &
	webpack -w $(bundle_entry) $(bundle_output)

clean:
	rm -rf $(bundle_output) $(bundle_modules) $(bundle_entry) $(build_dir)
