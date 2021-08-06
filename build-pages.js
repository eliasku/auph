const fs = require("fs");
const path = require('path');

try {
    fs.mkdirSync("pages");
}
catch{}

copyFolderRecursiveSync("packages/tester/assets", "pages");
copyFolderRecursiveSync("packages/tester/dist", "pages");
fs.copyFileSync("packages/tester/index.html", "pages/index.html");

fs.copyFileSync("packages/webaudio/dist/browser/auph.js", "pages/auph.js");
fs.copyFileSync("packages/webaudio/dist/browser/auph.js.map", "pages/auph.js.map");
fs.copyFileSync("packages/webaudio/dist/types/index.d.ts", "pages/auph.d.ts");

function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    // Check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // Copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}