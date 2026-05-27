const { Message } = require('discord.js');

/**
 * Cache para rastrear menções feitas por usuários
 * Estrutura: { userId: { mentions: [timestamp, ...], lastWarned: timestamp } }
 */
const userMentionCache = new Map();

/**
 * Verifica se uma mensagem contém spam de menções
 * @param {Message} message - Mensagem do Discord
 * @param {Object} guildConfig - Configuração do servidor
 */
async function checkMessage(message, guildConfig) {
    try {
        const configType = 'mentionFilter'; // Tipo de configuração para menções
        const { author, guild, channel, mentions } = message;
        const config = guildConfig.autoMod[configType]; // configType será 'spamDetection', 'linkFilter' ou 'mentionFilter'


        const { member } = message;
        

        // Verificar se o membro tem cargo isento
        if (member && config.whitelistedRoles?.some(roleId => member.roles.cache.has(roleId))) {
            return;
        }

     // conte quantas menções tem no message.content <@ ou <@& ou <@! ou <@&! ou <@&!>
        const mentionRegex = /<@!?(\d+)>|<@&!?(\d+)>/g;
        const mentionMatches = message.content.match(mentionRegex);
        const mentionCount = mentionMatches ? mentionMatches.length : 0;

        const uniqueMentions = mentionCount

        if (uniqueMentions === 0) {
            return;
        }

        if (uniqueMentions > config.threshold) {
            await message.delete();
            await executeAction(message, config.action, config.duration);
            return;
        }

        // Gerenciar cache de menções do usuário
        if (!userMentionCache.has(author.id)) {
            userMentionCache.set(author.id, {
                mentions: [],
                lastWarned: 0
            });
        }

        const userData = userMentionCache.get(author.id);
        const now = Date.now();
        for (let i = 0; i < uniqueMentions; i++) {
            userData.mentions.push(now);
        }

        // Limpar menções antigas
        userData.mentions = userData.mentions.filter(
            timestamp => now - timestamp < config.timeThreshold * 1000
        );


        // Verificar frequência de menções
        if (userData.mentions.length >= config.mentionThreshold) {
            if (now - userData.lastWarned < 10000) return;

            userData.lastWarned = now;
            await executeAction(message, config.action, config.duration);

            // Logging
            if (guildConfig.logs?.enabled && guildConfig.logs.moderationChannel) {
                const logChannel = guild.channels.cache.get(guildConfig.logs.moderationChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `📢 **SPAM DE MENÇÕES** 📢\nUsuário: ${author.tag} (${author.id})\nCanal: ${channel}\nAção: ${getActionName(config.action)}`
                    });
                }
            }

            userData.mentions = [];
        }

        userMentionCache.set(author.id, userData);

    } catch (error) {
    }
}

async function executeAction(message, action, duration) {
    try {
        const { author, guild, channel } = message;


        switch (action) {
            case 'timeout':
                const member = await guild.members.fetch(author.id);
                await member.timeout(duration * 60 * 1000, 'Auto-Moderação: Spam de menções');
                await channel.send({
                    content: `<@${author.id}>, você foi silenciado por ${duration} minutos por spam de menções.`,
                    allowedMentions: { users: [author.id] }
                });
                break;

            case 'warn':
                await channel.send({
                    content: `<@${author.id}>, **AVISO**: Por favor, evite mencionar muitas pessoas/cargos.`,
                    allowedMentions: { users: [author.id] }
                });
                break;

            case 'ban':
                await guild.members.ban(author.id, { reason: 'Auto-Moderação: Spam excessivo de menções' });
                break;

            case 'kick':
                const memberToKick = await guild.members.fetch(author.id);
                await memberToKick.kick('Auto-Moderação: Spam de menções');
                break;
        }
    } catch (error) {
    }
}

function getActionName(actionCode) {
    const actions = {
        'timeout': 'Timeout (Castigo)',
        'warn': 'Avisar Usuário',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário'
    };
    
    return actions[actionCode] || 'Desconhecida';
}

module.exports = { checkMessage, executeAction, getActionName };
