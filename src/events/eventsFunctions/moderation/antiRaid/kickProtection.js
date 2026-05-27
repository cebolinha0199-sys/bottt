const { AuditLogEvent, EmbedBuilder } = require('discord.js');

// Cache com TTL (Time To Live) para armazenar informações de kicks
class KickCache {
    constructor(ttl = 60000) { // 60 segundos padrão
        this.cache = new Map();
        this.ttl = ttl;
    }

    get(guildId, userId) {
        const guildCache = this.cache.get(guildId);
        if (!guildCache) return null;
        
        const userData = guildCache.get(userId);
        if (!userData) return null;

        if (Date.now() - userData.timestamp > this.ttl) {
            guildCache.delete(userId);
            return null;
        }

        return userData;
    }

    set(guildId, userId, data) {
        if (!this.cache.has(guildId)) {
            this.cache.set(guildId, new Map());
        }
        const guildCache = this.cache.get(guildId);
        guildCache.set(userId, {
            ...data,
            timestamp: Date.now()
        });
    }

    increment(guildId, userId) {
        const userData = this.get(guildId, userId) || { count: 0 };
        this.set(guildId, userId, {
            count: userData.count + 1
        });
        return userData.count + 1;
    }

    clear(guildId, userId) {
        const guildCache = this.cache.get(guildId);
        if (guildCache) {
            guildCache.delete(userId);
        }
    }
}

const kickCache = new KickCache();

async function handleMemberRemove(member, client, guildConfig) {
    try {
        console.log(`[KickProtection] Processando remoção do membro: ${member.user.tag}`);

        // Verificar se é um banimento
        try {
            await member.guild.bans.fetch(member.user.id);
            console.log(`[KickProtection] Membro ${member.user.tag} foi banido, ignorando`);
            return;
        } catch {
            // Não é um banimento, continuar processamento
        }

        // Buscar logs com retry
        const kickLog = await fetchKickAuditLog(member);
        if (!kickLog) {
            console.log('[KickProtection] Nenhum log de kick encontrado');
            return;
        }

        const executor = kickLog.executor;
        if (shouldIgnoreExecutor(executor, client, member.guild)) return;

        // Incrementar contagem de kicks
        const kickCount = kickCache.increment(member.guild.id, executor.id);
        console.log(`[KickProtection] Kicks do executor ${executor.tag}: ${kickCount}`);

        if (kickCount >= 3) {
            await handleExcessiveKicks(member.guild, executor, guildConfig);
            kickCache.clear(member.guild.id, executor.id);
        }

    } catch (error) {
        console.error('[KickProtection] Erro:', error);
    }
}

async function fetchKickAuditLog(member) {
    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        const auditLogs = await member.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberKick,
            limit: 5
        });

        const log = auditLogs.entries.find(entry => 
            entry.target.id === member.user.id &&
            Date.now() - entry.createdTimestamp < 5000
        );

        if (log) return log;
    }
    return null;
}

function shouldIgnoreExecutor(executor, client, guild) {
    return executor.id === client.user.id || 
           executor.id === guild.ownerId ||
           executor.bot;
}

async function handleExcessiveKicks(guild, executor, guildConfig) {
    try {
        await executeAction(guild, executor, guildConfig.antiRaid.kickProtection.action);
        await sendSecurityAlert(guild, executor, guildConfig);
    } catch (error) {
        console.error('[KickProtection] Erro ao lidar com kicks excessivos:', error);
    }
}

async function executeAction(guild, user, action) {
    try {
        const member = await guild.members.fetch(user.id);
        console.log(`[KickProtection] Executando ação ${action} contra ${user.tag}`);

        switch (action) {
            case 'removePermissions':
                await handleRemovePermissions(member);
                break;
            case 'ban':
                await guild.members.ban(user.id, { 
                    reason: 'Sistema Anti-Raid: Expulsões em massa',
                    deleteMessageSeconds: 86400 // 24 horas
                });
                break;
            case 'kick':
                await member.kick('Sistema Anti-Raid: Expulsões em massa');
                break;
            case 'removeRoles':
                await member.roles.set([]);
                break;
            default:
                console.warn(`[KickProtection] Ação desconhecida: ${action}`);
        }
    } catch (error) {
        console.error(`[KickProtection] Erro ao executar ação ${action}:`, error);
    }
}

async function handleRemovePermissions(member) {
    const dangerousPermissions = ['ADMINISTRATOR', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_GUILD'];
    const adminRoles = member.roles.cache.filter(role =>
        dangerousPermissions.some(perm => role.permissions.has(perm))
    );
    if (adminRoles.size > 0) {
        await member.roles.remove(adminRoles);
    }
}

async function sendSecurityAlert(guild, executor, guildConfig) {
    if (!guildConfig.logs?.enabled || !guildConfig.logs.securityChannel) return;

    const logChannel = guild.channels.cache.get(guildConfig.logs.securityChannel);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🚨 Alerta de Segurança')
        .setColor('#FF0000')
        .setDescription(`Detectadas expulsões em massa por ${executor.tag}`)
        .addFields(
            { name: '👤 Executor', value: `${executor.tag} (${executor.id})`, inline: true },
            { name: '⚡ Ação Tomada', value: getActionName(guildConfig.antiRaid.kickProtection.action), inline: true },
            { name: '⏰ Timestamp', value: new Date().toISOString(), inline: true }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });
}

function getActionName(actionCode) {
    const actions = {
        'removePermissions': 'Remover Permissões Administrativas',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário',
        'removeRoles': 'Remover Todos os Cargos'
    };

    return actions[actionCode] || 'Desconhecida';
}

module.exports = { 
    handleMemberRemove
};