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

        // // console.log(meta);
        // process.exit();
        // return;
        let date, model;

        // DJI = CreateDate
        // 80D = DateTimeOriginal
        if(meta.FileName.includes("DJI_")){
            date = 'CreateDate';
            model = 'DJI';
        }

        if(meta.FileName.includes("CANON")){
            date = 'DateTimeOriginal';
            model = meta.Model;
        }

        const safeDate = meta[date].split(" ")[0].split(":").join("-");

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
    exec('df -h | grep : | awk "{ print $1 }"', (error, stdout, stderr) => {
        stdout.split("\n")
            .map(d => d.split(":")[0])
            .filter(d => d && !env.ignore.includes(d))
            .map(importDrive);
    });

    return Queue;
}

function importDrive(driveLetter) {
    glob("**/*.+(JPG|MP4)", { cwd: `${driveLetter}:/` }, (err, files) => {
        if (!err) {
            Exif(files.map(file => `${driveLetter}:/${file}`), buildList)
        }
    });
}

Queue.start = file => cpFile(file.fromDest,file.toDest,{overwrite:false}).on('progress',console.log);

const importer = scanDrives();
importer.on('finished', files => files.forEach(importer.start));