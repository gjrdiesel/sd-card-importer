const { exec } = require('child_process');
const env = require("./env");
const glob = require("glob");

const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

const fs = require('fs');
const path = require('path');

const EventEmitter = require('events');
const Queue = new EventEmitter();
Queue.count = 0;
Queue.files = [];

Queue.on('add', details => {
    Queue.count += 1;
    Queue.files.push(details);

    console.log(`${Queue.count} / ${Queue.length} )`, details);

    if (Queue.count == Queue.length) {
        Queue.emit('finished');
    }
});

Queue.on('error', console.error);

async function buildPath(meta) {
    const toDest = path.join(
        env.import_to,
        meta.safeDate,
        meta.cameraModelName,
        meta.fileType,
        path.basename(meta.pathToFile)
    );
    Queue.emit("add", { toDest, fromDest: meta.pathToFile });
}

const getFilePart = location => new Promise((resolve, reject) => {
    const chunks = [];
    fs.createReadStream(location, {
        encoding: null,
        start: 0,
        end: 2048 * 1024,
    })
        .on('data', chunk => { chunks.push(chunk); })
        .on('end', () => { resolve(Buffer.concat(chunks)); })
        .on('error', reject);
});

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
            Queue.length = files.length;
            files.map(file => inspectFile(`${driveLetter}:/${file}`))
        }
    });
}

async function inspectFile(file) {
    const filePart = await getFilePart(file);
    console.log(file);
    // exif.metadata(filePart, function (err, metadata) {
    //     if (err) {
    //         console.log(err);
    //         throw err;
    //     }
    //     else {
    //         metadata.pathToFile = file;
    //         metadata.safeDate = metadata.modifyDate.split(" ")[0].split(":").join("-");
    //         buildPath(metadata);
    //     }
    // });
}

scanDrives()
    .on('finished', files => console.log(files));