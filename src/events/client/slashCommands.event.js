const { MessageFlags } = require("discord.js");
const { JsonDatabase, } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                interaction.channel.send({ content: `Nenhum comando correspondente a **${interaction.commandName}** foi encontrado.` }).then(() => {
                    setTimeout((msg) => {
                        msg.delete().catch(error => { })
                    }, 5000);
                }).catch(error => { })
                return;
            }


            await command.execute(interaction, client);

        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
                return;
            }
            try {
                await command.autocomplete(interaction);
            } catch (err) {
                console.error(err);
                return;
            }
        }
    },
}