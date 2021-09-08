const {build} = require("cmake-build");

build({
    buildType: "Release",
    ninja: true
}).catch(_ => process.exit(-1));