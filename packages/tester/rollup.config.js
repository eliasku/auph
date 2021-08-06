import {nodeResolve} from "@rollup/plugin-node-resolve";

export default {
    input: "index.js",
    output: [
        {
            file: "dist/index.js",
            format: "iife",
            compact: true,
            sourcemap: true
        }
    ],
    plugins:[
        nodeResolve()
    ]
};