const {build} = require("cmake-build");

build().catch(_ => process.exit(1));