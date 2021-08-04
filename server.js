const express = require('express');
const app = express();
const fs = require("fs");
const puppeteer = require('puppeteer');

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

    return page.screenshot({type: 'png', path: buildFileName(id)});
}

const archiveScreenshot = (id) => {
    if (fs.existsSync(buildFileName(id))) {
        fs.copyFileSync(buildFileName(id), buildArchiveFileName(id))
    }
}

const getScreen = (dashboardConfig) => {
    let foundScreen;
    const now = new Date();
    const time = now.getHours() * 100 + now.getMinutes();

    console.log('looking for screen starting right before', time);

    dashboardConfig.screens
        .sort((a, b) => a.from > b.from)
        .forEach(screen => {
            if (screen.from < time) {
                foundScreen = screen;
            }
        });

    console.log(foundScreen);
    return foundScreen;
}

app.get('/dashboard/:id', function (req, res) {

    const id = req.params['id'];
    const dashboardConfig = config[id];
    const screen = getScreen(dashboardConfig);

    // calculate sleep time
    let timeToSleep = screen.sleep;
    if (!timeToSleep) {
        const now = new Date();
        const time = now.getHours() * 100 + now.getMinutes();
        timeToSleep = 2400 - time + screen.sleepUntil;
    }

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
app.use("/", express.static('app'));

launchBrowser().then(() => {
    app.listen(8081, function () {
        console.log('Server started');
    });
});
