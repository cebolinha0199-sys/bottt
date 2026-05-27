const { AuditLogEvent } = require('discord.js');

const banCache = new Map();

async function handleBan(ban, client, guildConfig) {
    try {
        const auditLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd
        });

        const banLog = auditLogs.entries.first();

        if (!banLog || (Date.now() - banLog.createdTimestamp > 5000)) return;

        const executor = banLog.executor;

        if (executor.id === client.user.id || executor.id === ban.guild.ownerId) return;

        if (!banCache.has(ban.guild.id)) {
            banCache.set(ban.guild.id, new Map());
        }

        const guildCache = banCache.get(ban.guild.id);

        if (!guildCache.has(executor.id)) {
            guildCache.set(executor.id, {
                count: 1,
                timestamp: Date.now()
            });
        } else {
            const userData = guildCache.get(executor.id);

            if (Date.now() - userData.timestamp > 60000) {
                userData.count = 1;
                userData.timestamp = Date.now();
            } else {
                userData.count++;
                userData.timestamp = Date.now();
            }

            guildCache.set(executor.id, userData);
        }

        const userData = guildCache.get(executor.id);
        if (userData.count >= 3) {
            await executeAction(ban.guild, executor, guildConfig.antiRaid.banProtection.action);

            if (guildConfig.logs?.enabled && guildConfig.logs.securityChannel) {
                const logChannel = ban.guild.channels.cache.get(guildConfig.logs.securityChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `⚠️ **ALERTA DE SEGURANÇA** ⚠️\nDetectados banimentos em massa por ${executor.tag} (${executor.id}).\nAção tomada: ${getActionName(guildConfig.antiRaid.banProtection.action)}`
                    });
                }
            }

            guildCache.delete(executor.id);
        }
    } catch (error) {
        console.error('Erro ao processar proteção contra banimentos:', error);
    }
}

async function executeAction(guild, user, action) {
    try {
        const member = await guild.members.fetch(user.id);
        
        switch (action) {
            case 'removePermissions':
                const adminRoles = member.roles.cache.filter(role => 
                    role.permissions.has('ADMINISTRATOR') || 
                    role.permissions.has('BAN_MEMBERS')
                );
                if (adminRoles.size > 0) {
                    await member.roles.remove(adminRoles);
                }
                break;
            case 'ban':
                await guild.members.ban(user.id, { reason: 'Sistema Anti-Raid: Banimentos em massa' });
                break;
            case 'kick':
                await member.kick('Sistema Anti-Raid: Banimentos em massa');
                break;
            case 'removeRoles':
                await member.roles.set([]);
                break;
        }
    } catch (error) {
        console.error(`Erro ao executar ação ${action} contra usuário:`, error);
    }
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

module.exports = { handleBan };