const getScreen = (dashboardConfig) => {
    let foundScreen;
    const now = new Date();
    const time = now.toTimeString().substr(0,5);

    console.log('looking for screen starting right before', time);

    dashboardConfig.screens
        .sort((a, b) => a.from.localeCompare(b.from))
        .forEach(screen => {
            if (screen.from <= time) {
                foundScreen = screen;
            }
        });

    console.log(foundScreen);
    return foundScreen;
}

module.exports = {
    getScreen
}