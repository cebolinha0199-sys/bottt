const { EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');

async function logChannelCreate(channel, config) {
    try {
        const auditLogs = await channel.guild.fetchAuditLogs({
            type: AuditLogEvent.ChannelCreate,
            limit: 1
        });

        const log = auditLogs.entries.first();
        const executor = log?.executor;

        const embed = new EmbedBuilder()
            .setTitle('📝 Canal Criado')
            .setColor('#00FF00')
            .setTimestamp()
            .addFields(
                { name: '📋 Nome', value: channel.name, inline: true },
                { name: '📁 Tipo', value: getChannelType(channel.type), inline: true },
                { name: '🛠️ Criado por', value: executor ? `${executor.tag} (${executor.id})` : 'Desconhecido', inline: true },
                { name: '🔧 Configurações', value: getChannelConfig(channel) }
            )
            .setFooter({ text: `ID do Canal: ${channel.id}` });

        if (channel.parent) {
            embed.addFields({ name: '📂 Categoria', value: channel.parent.name, inline: true });
        }

        const logChannel = channel.guild.channels.cache.get(config.logs.serverChannel);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Erro ao registrar criação de canal:', error);
    }
}

async function logChannelDelete(channel, config) {
    try {
        const auditLogs = await channel.guild.fetchAuditLogs({
            type: AuditLogEvent.ChannelDelete,
            limit: 1
        });

        const log = auditLogs.entries.first();
        const executor = log?.executor;

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Canal Excluído')
            .setColor('#FF0000')
            .setTimestamp()
            .addFields(
                { name: '📋 Nome', value: channel.name, inline: true },
                { name: '📁 Tipo', value: getChannelType(channel.type), inline: true },
                { name: '🛠️ Excluído por', value: executor ? `${executor.tag} (${executor.id})` : 'Desconhecido', inline: true }
            )
            .setFooter({ text: `ID do Canal: ${channel.id}` });

        if (channel.parent) {
            embed.addFields({ name: '📂 Categoria', value: channel.parent.name, inline: true });
        }

        const logChannel = channel.guild.channels.cache.get(config.logs.serverChannel);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Erro ao registrar exclusão de canal:', error);
    }
}

// Funções auxiliares
function getChannelType(type) {
    const types = {
        [ChannelType.GuildText]: 'Texto',
        [ChannelType.GuildVoice]: 'Voz',
        [ChannelType.GuildCategory]: 'Categoria',
        [ChannelType.GuildNews]: 'Anúncios',
        [ChannelType.GuildStageVoice]: 'Palco',
        [ChannelType.GuildForum]: 'Fórum'
    };
    return types[type] || 'Desconhecido';
}

function getChannelConfig(channel) {
    const configs = [];

    if (channel.type === ChannelType.GuildText) {
        configs.push(`Modo lento: ${channel.rateLimitPerUser || 'Desativado'}`);
        configs.push(`NSFW: ${channel.nsfw ? 'Sim' : 'Não'}`);
    }

    if (channel.type === ChannelType.GuildVoice) {
        configs.push(`Limite de usuários: ${channel.userLimit || 'Ilimitado'}`);
        configs.push(`Bitrate: ${channel.bitrate / 1000}kbps`);
    }

    return configs.length > 0 ? configs.join('\n') : 'Configurações padrão';
}

module.exports = {
    logChannelCreate,
    logChannelDelete
};