const { exec } = require('child_process');
const env = require("./env");
const glob = require("glob");
const Exif = require("simple-exiftool");
const path = require('path');
const EventEmitter = require('events');
const cpFile = require('cp-file');

const Queue = new EventEmitter();

async function buildList(err, meta) {

    let list = meta.map(meta => {

        let model;

        // Not sure what else to pull from the EXIF data to 
        // determine if it's a DJI -- would be nice to have
        // incase you were pull footage for multple drones.
        if (meta.FileName.includes("DJI_")) {
            model = 'DJI';
            // Guess it would be better if we'd let you tag folders later
        }

        if (meta.Model) {
            model = meta.Model;
        }

        // It's going to blow up if we we aren't DJI or don't have meta.Model
        // but that's ok for now, we'll just need to log it and send a bug report
        
        // TODO: Bug report

        const safeDate = meta.CreateDate.split(" ")[0].split(":").join("-");

        const args = [
            env.import_to,
            safeDate,
            model,
            meta.FileType,
            meta.FileName
        ];

        const toDest = path.join(...args);

        return { toDest, fromDest: meta.SourceFile }
    });

    Queue.emit("finished", list);
}

function scanDrives() {
    // Swap out for something that works with normal windows usage
    exec('df -h | grep : | awk "{ print $1 }"', (error, stdout, stderr) => {
        stdout.split("\n")
            .map(d => d.split(":")[0])
            .filter(d => d && !env.ignore.includes(d))
            .map(importDrive);
    });

    return Queue;
}

function importDrive(driveLetter) {
    // TODO: Test compatability with MacOS
    glob("**/*.+(JPG|MP4)", { cwd: `${driveLetter}:/` }, (err, files) => {
        if (!err) {
            if (files.length > 0)
                Exif(files.map(file => `${driveLetter}:/${file}`), buildList)
        }
    });
}

Queue.start = file => cpFile(file.fromDest, file.toDest, { overwrite: false }).on('progress', console.log);

const importer = scanDrives();
importer.on('finished', files => files.forEach(importer.start));