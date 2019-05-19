# Auto organize your camera/drone SD card

Tired of manually copying your footage to your hard drive? Me too. I'm setting this script up to run when the computer detects a new drive letter it'll scan for images/videos and import those to whatever particular path you one (networked drive, attached external hd, etc).

It also scans EXIF data so it'll organize folders like `D:/BACKUPS/2019-12-12/Canon EOS 80D/JPEG` vs `D:/BACKUPS/2019-12-12/DJI Spark/MP4`

## Requirements

1) Exiftool (Windows: `choco install exiftool` | Mac: `sudo brew install exiftool`)
2) Node/NPM
3) PM2 (Optional: So it can monitor for new drives and automatically start)

## Installation

```bash
git clone [github-url] import
cd import && npm install
pm2 start
```

## Improvements

Going forward this would be awesome to wrap up in a electron app so you could configure and monitor the process.