import {terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

const plugins = [
    replace({
        preventAssignment: true,
        values: {
            "process.env.NODE_ENV": JSON.stringify("production")
        }
    })
];

export default [
    {
        input: "./web/dist/module/webaudio/index.js",
        output: {
            file: "./web/dist/browser/auph-webaudio.js",
            format: "iife",
            name: "auwa",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        },
        plugins
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
        plugins
    },
    {
        input: "./web/dist/module/index.js",
        output: {
            file: "./web/dist/cjs/index.js",
            format: "commonjs",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        },
        plugins
    }
];