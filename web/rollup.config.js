import {terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

function createGlobalPlugins(release) {
    return [
        replace({
            preventAssignment: true,
            values: {
                "process.env.NODE_ENV": JSON.stringify(release ? "production" : "development")
            }
        })
    ];
}

export default [
    {
        input: "./web/dist/module/webaudio/index.js",
        output: {
            // support core api for emscripten implementation
            file: "./web/dist/emscripten/auph.js",
            format: "iife",
            name: "auph",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        },
        plugins: createGlobalPlugins(true)
    },
    {
        input: "./web/dist/module/index.js",
        output: {
            file: "./web/dist/browser/auph.js",
            format: "iife",
            name: "auph",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        },
        plugins: createGlobalPlugins(true)
    },
    {
        input: "./web/dist/module/index.js",
        output: {
            file: "./web/dist/browser/auph.debug.js",
            format: "iife",
            name: "auph",
            compact: true,
            sourcemap: true
        },
        plugins: createGlobalPlugins(false)
    },
    {
        input: "./web/dist/module/index.js",
        output: {
            file: "./web/dist/cjs/index.js",
            format: "commonjs",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        }
        // do not replace for NodeJS, depends on NODE_ENV
    }
];