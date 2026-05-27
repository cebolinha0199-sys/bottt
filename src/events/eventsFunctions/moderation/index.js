const { Events } = require('discord.js');
const antiRaid = require('./antiRaid');
const autoMod = require('./autoMod');
const logs = require('./logs');
const altDetection = require('./altDetection');
const { mainPanel } = require('./ui/mainPanel');
const { loadConfig } = require('./config/loadConfig');
const { saveConfig } = require('./config/saveConfig');

/**
 * Inicializa o sistema de moderação
 * @param {Client} client - Cliente do Discord.js
 */
function initModeration(client) {
    // Carregar configurações para todos os servidores
    client.moderationConfigs = new Map();

    // Registrar eventos
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.customId === 'configModeracao') {
            await mainPanel(interaction, client);
        }

        if (interaction.customId === 'mod_altdetect_age') {
            let dias = interaction.values[0]
            let guildConfig = await loadConfig(interaction.guild.id);
            guildConfig.altDetection.minAccountAge = dias;
            await interaction.reply({ content: `Idade mínima de conta alternada para ${dias} dias`, components: [] , ephemeral: true});
            await saveConfig(interaction.guild.id, guildConfig);

            return;
        }

        if (interaction.customId === 'mod_altdetect_action') {
            let action = interaction.values[0]
            let guildConfig = await loadConfig(interaction.guild.id);
            guildConfig.altDetection.action = action;
            await interaction.reply({ content: `Ação alternada para ${action}`, components: [] , ephemeral: true});
            await saveConfig(interaction.guild.id, guildConfig);

            return;
        }

        // Lidar com interações de subpainéis
        if (interaction.customId?.startsWith('mod_')) {
            const guildConfig = await loadConfig(interaction.guild.id);

            // Encaminhar para os manipuladores de UI apropriados
            if (interaction.customId.startsWith('mod_antiraid_')) {
                require('./ui/antiRaidPanel').handleInteraction(interaction, client, guildConfig);
            } else if (interaction.customId.startsWith('mod_automod_')) {
                require('./ui/autoModPanel').handleInteraction(interaction, client, guildConfig);
            } else if (interaction.customId.startsWith('mod_logs_')) {
                require('./ui/logsPanel').handleInteraction(interaction, client, guildConfig);
            } else if (interaction.customId.startsWith('mod_altdetect_')) {
                require('./ui/altDetectionPanel').handleInteraction(interaction, client, guildConfig);
            }
        }
    });

    // Inicializar subsistemas
    antiRaid.init(client);
    autoMod.init(client);
    logs.init(client);
    altDetection.init(client);

    //console.log('Sistema de moderação inicializado com sucesso!');
}

module.exports = { initModeration };