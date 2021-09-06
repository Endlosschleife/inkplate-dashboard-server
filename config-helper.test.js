const configHelper = require('./config-helper');

describe('Sample Test', () => {

    it('should find screen after 9:00 ', () => {
        jest.useFakeTimers('modern')
            .setSystemTime(new Date('2021-10-10T09:00:00').getTime());
        const dashboardConfig = {
            "screens": [
                {
                    "url": "http://screen-day",
                    "from": "08:00",
                    "sleep": 30
                }, {
                    "url": "http://screen-night",
                    "from": "22:15",
                    "sleepUntil": "08:00"
                }
            ]
        };
        const screen = configHelper.getScreen(dashboardConfig);
        expect(screen).toBe(dashboardConfig.screens[0]);
    });

    it('should find screen after 23:00 ', () => {
        jest.useFakeTimers('modern')
            .setSystemTime(new Date('2021-10-10T23:00:00').getTime());
        const dashboardConfig = {
            "screens": [
                {
                    "url": "http://screen-day",
                    "from": "08:00",
                    "sleep": 30
                }, {
                    "url": "http://screen-night",
                    "from": "22:15",
                    "sleepUntil": "08:00"
                }
            ]
        };
        const screen = configHelper.getScreen(dashboardConfig);
        expect(screen).toBe(dashboardConfig.screens[1]);
    });

});