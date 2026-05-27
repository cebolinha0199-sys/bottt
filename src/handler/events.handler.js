const { readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");

module.exports = (client) => {
    const loadEvents = (dir) => {
        const files = readdirSync(dir);
        for (const file of files) {
            const filePath = join(dir, file);
            const stats = statSync(filePath);

            if (stats.isDirectory()) {
                loadEvents(filePath);
            };

            if (file.endsWith(".js")) {
                const event = require(filePath);
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                };
            };
        };
    };
    const eventsPath = join(__dirname, "../events");
    loadEvents(eventsPath);
};