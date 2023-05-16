const express = require('express');
const promBundle = require("express-prom-bundle");
const app = express();
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    promClient: {
        collectDefaultMetrics: {}
    }

});
const {Counter} = require("prom-client");

const fs = require("fs");
const puppeteer = require('puppeteer');
const moment = require('moment');
const configHelper = require('./config-helper');

const CHROMIUM_BINARY = process.env.CHROMIUM_BINARY;
const SCREENSHOTS_FOLDER = 'screenshots/';

let browser;
const config = JSON.parse(fs.readFileSync('./config.json'));
const buildArchiveFileName = (id) => `${SCREENSHOTS_FOLDER}${id}-archive.jpg`;
const buildFileName = (id) => `${SCREENSHOTS_FOLDER}${id}.jpg`;

const METRIC_GET_DASHBOARD_COUNT = new Counter({
    name: 'get_dashboard_count',
    help: 'Get dashboard counter',
    labelNames: ['type', 'id']
});

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
    await page.goto(url, {
        waitUntil: 'networkidle0'
    });
    await page.waitForSelector('.app', {
        visible: true,
    });

    if (!fs.existsSync(SCREENSHOTS_FOLDER)) {
        fs.mkdirSync(SCREENSHOTS_FOLDER);
    }

    const filename = buildFileName(id);
    return page.screenshot({type: 'jpeg', path: filename})
        .then(_ => page.close());
}

const archiveScreenshot = (id) => {
    if (fs.existsSync(buildFileName(id))) {
        fs.copyFileSync(buildFileName(id), buildArchiveFileName(id))
    }
}

app.get('/dashboard/:id', function (req, res) {

    const id = req.params['id'];
    METRIC_GET_DASHBOARD_COUNT.labels({type: 'total', id: id}).inc();

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
        METRIC_GET_DASHBOARD_COUNT.labels({type: 'success', id: id}).inc();
    }).catch(e => {
        console.error(e);
        res.sendStatus(500);
        METRIC_GET_DASHBOARD_COUNT.labels({type: 'error', id: id}).inc();
        res.end();
    });
});

app.use("/screenshots", express.static(SCREENSHOTS_FOLDER));
app.use(metricsMiddleware);

launchBrowser().then(() => {
    app.listen(8081, function () {
        console.log('Server started');
    });
});
