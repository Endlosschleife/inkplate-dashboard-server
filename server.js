const express = require('express');
const app = express();
const fs = require("fs");
const puppeteer = require('puppeteer');
const moment = require('moment');
const configHelper = require('./config-helper');

const CHROMIUM_BINARY = process.env.CHROMIUM_BINARY;
const SCREENSHOTS_FOLDER = 'screenshots/';

let browser;
const config = JSON.parse(fs.readFileSync('./config.json'));
const buildArchiveFileName = (id) => `${SCREENSHOTS_FOLDER}${id}-archive.png`;
const buildFileName = (id) => `${SCREENSHOTS_FOLDER}${id}.png`;

const launchBrowser = () => {
    return puppeteer.launch({
        executablePath: CHROMIUM_BINARY,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
        headless: true,
    }).then(b => browser = b);
}

const takeScreenshot = async (id, url, width, height) => {
    const page = await browser.newPage();
    await page.setViewport({width, height});
    await page.goto(url);
    await page.waitForSelector('.app', {
        visible: true,
    });

    if (!fs.existsSync(SCREENSHOTS_FOLDER)) {
        fs.mkdirSync(SCREENSHOTS_FOLDER);
    }

    return page.screenshot({type: 'png', path: buildFileName(id)})
        .then(_ => page.close());
}

const archiveScreenshot = (id) => {
    if (fs.existsSync(buildFileName(id))) {
        fs.copyFileSync(buildFileName(id), buildArchiveFileName(id))
    }
}

app.get('/dashboard/:id', function (req, res) {

    const id = req.params['id'];
    const dashboardConfig = config[id];
    const screen = configHelper.getScreen(dashboardConfig);

    // calculate sleep time
    let timeToSleep = screen.sleep;
    if (!timeToSleep) {
        const a = moment();
        const b = moment(screen.sleepUntil, 'HHmm');
        const diff = b.diff(a, 'minutes');
        timeToSleep = diff < 0 ? 1440 + diff : diff;
    }

    console.log(`Screen ${id} will sleep for ${timeToSleep} minutes.`);

    archiveScreenshot(id);
    takeScreenshot(id, screen.url, dashboardConfig.width, dashboardConfig.height).then(screenshotBuffer => {
        res.json({
            timeToSleep,
            imageUrl: buildFileName(id),
            archivedImageUrl: buildArchiveFileName(id),
        });
    }).catch(e => {
        console.error(e);
        res.sendStatus(500);
        res.end();
    });
});

app.use("/screenshots", express.static(SCREENSHOTS_FOLDER));

launchBrowser().then(() => {
    app.listen(8081, function () {
        console.log('Server started');
    });
});
