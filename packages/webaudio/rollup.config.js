import {terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

const plugins = [
    replace({
        preventAssignment: true,
        values: {
            "process.env.NODE_ENV": JSON.stringify("production"),
            "process.env.DEBUG": "true"
        }
    })
];

export default [
    {
        input: "dist/module/sa.js",
        output: {
            file: "dist/browser/auph.js",
            format: "iife",
            name: "Auph",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        },
        plugins
    },
    {
        input: "dist/module/index.js",
        output: {
            file: "dist/browser/_auph.js",
            format: "iife",
            name: "auph",
            compact: true,
            plugins: [terser()],
            sourcemap: true
        },
        plugins
    },
];