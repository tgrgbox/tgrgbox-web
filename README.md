# tgrgbox-web
Web UI for tgrgbox streaming stack

# Use:
This uses node-config for its configuration files.  Use the templates in examples/ as a guide to configure the service.

# dev notes
Install dependencies with:
npm install

Set up environment variables (TGRGBOX_API_KEY, TGRGBOX_DISCORD_CLIENT_ID, and TGRGBOX_DISCORD_CLIENT_SECRET)

run the app with:
DEBUG=tgrgbox:* DEBUG_DEPTH=3 npm run startdev
(run for real with npm start)

check for updates with
npx npm-check-updates

# Generating test streams:
You can generate a test stream with ffmpeg:
```
ffmpeg -r 30 -f lavfi -i testsrc -vf scale=1280:960 -vcodec libx264 -profile:v baseline -pix_fmt yuv420p -f flv 'rtmp_url'
```
where the `rtmp_url` is `rtmp url`/`streamkey` from your stream keys.
