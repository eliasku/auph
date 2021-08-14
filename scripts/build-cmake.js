const path = require("path");
const {spawnSync} = require("child_process");

const buildTypes = ["Release"];

for (const buildType of buildTypes) {
    console.info("Generate", buildType);
    const args = [];
    if (process.env.USE_CCACHE) {
        args.push("-DCMAKE_C_COMPILER_LAUNCHER=ccache", "-DCMAKE_CXX_COMPILER_LAUNCHER=ccache");
    }
    const result = spawnSync("cmake", [
        "-S", ".",
        "-B", `build/${buildType.toLowerCase()}`,
        "-G", "Ninja",
        `-DCMAKE_BUILD_TYPE=${buildType}`,
        ...args
    ], {
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        process.exit(result.status);
    }
}

// build
for (const buildType of buildTypes) {
    console.info("Build", buildType);
    const result = spawnSync("cmake", [
        "--build", `build/${buildType.toLowerCase()}`
    ], {
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        process.exit(result.status);
    }
}

// run test
// for (const buildType of buildTypes) {
//     console.info("Test", buildType);
//     const result = spawnSync("ninja", ["test"], {
//         stdio: 'inherit',
//         cwd: path.resolve(process.cwd(), "build", buildType.toLowerCase()),
//         env: Object.assign({}, process.env, {CTEST_OUTPUT_ON_FAILURE: "TRUE"})
//     });
//     if (result.status !== 0) {
//         process.exit(result.status);
//     }
// }

//fs.rmSync('build', {recursive: true});