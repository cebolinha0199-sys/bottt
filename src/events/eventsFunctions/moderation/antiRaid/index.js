const { Events } = require('discord.js');
const { loadConfig } = require('../config/loadConfig');
const channelProtection = require('./channelProtection');
const roleProtection = require('./roleProtection');
const banProtection = require('./banProtection');
const kickProtection = require('./kickProtection');

/**
 * Inicializa o sistema Anti-Raid
 * @param {Client} client - Cliente do Discord.js
 */
function init(client) {
    // Registrar eventos para proteção de canais
    client.on(Events.ChannelDelete, async (channel) => {
        const guildConfig = await loadConfig(channel.guild.id);
        if (guildConfig.antiRaid?.enabled && guildConfig.antiRaid.channelProtection?.enabled) {
            channelProtection.handleChannelDelete(channel, client, guildConfig);
        }
    });

    // Registrar eventos para proteção de cargos
    client.on(Events.RoleDelete, async (role) => {
        const guildConfig = await loadConfig(role.guild.id);
        if (guildConfig.antiRaid?.enabled && guildConfig.antiRaid.roleProtection?.enabled) {
            roleProtection.handleRoleDelete(role, client, guildConfig);
        }
    });

    // Registrar eventos para proteção contra banimentos
    client.on(Events.GuildBanAdd, async (ban) => {
        const guildConfig = await loadConfig(ban.guild.id);
        if (guildConfig.antiRaid?.enabled && guildConfig.antiRaid.banProtection?.enabled) {
            banProtection.handleBan(ban, client, guildConfig);
        }
    });

    // Registrar eventos para proteção contra expulsões
    client.on(Events.GuildMemberRemove, async (member) => {
        const guildConfig = await loadConfig(member.guild.id);
        if (guildConfig.antiRaid?.enabled && guildConfig.antiRaid.kickProtection?.enabled) {
            kickProtection.handleMemberRemove(member, client, guildConfig);
        }
    });

    //console.log('Sistema Anti-Raid inicializado com sucesso!');
}

module.exports = { init };