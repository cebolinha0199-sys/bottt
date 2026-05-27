const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require("fs");
const config = require("../../token.json");

module.exports = (client) => {
    client.handleCommands = async (path) => {
        client.commandArray = [];
        const commandFolders = fs.readdirSync(path);
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../slashCommands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            };
        };
    };

    client.on("ready", async (r) => {
        try {
            const rest = new REST({
                version: `9`
            }).setToken(config.token);
            await rest.put(
                Routes.applicationCommands(client.user.id), {
                body: client.commandArray
            });
        } catch (err) {
            console.log(err);
        };
    });
};