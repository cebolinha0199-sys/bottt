const { AuditLogEvent } = require('discord.js');

const deletionCache = new Map();

async function handleRoleDelete(role, client, guildConfig) {
    try {
        const auditLogs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleDelete
        });

        const deleteLog = auditLogs.entries.first();

        if (!deleteLog || (Date.now() - deleteLog.createdTimestamp > 5000)) return;

        const executor = deleteLog.executor;

        if (executor.id === client.user.id || executor.id === role.guild.ownerId) return;

        if (!deletionCache.has(role.guild.id)) {
            deletionCache.set(role.guild.id, new Map());
        }

        const guildCache = deletionCache.get(role.guild.id);

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
            await executeAction(role.guild, executor, guildConfig.antiRaid.roleProtection.action);

            if (guildConfig.logs?.enabled && guildConfig.logs.securityChannel) {
                const logChannel = role.guild.channels.cache.get(guildConfig.logs.securityChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `⚠️ **ALERTA DE SEGURANÇA** ⚠️\nDetectada exclusão em massa de cargos por ${executor.tag} (${executor.id}).\nAção tomada: ${getActionName(guildConfig.antiRaid.roleProtection.action)}`
                    });
                }
            }

            guildCache.delete(executor.id);
        }
    } catch (error) {
        console.error('Erro ao processar proteção de cargos:', error);
    }
}

async function executeAction(guild, user, action) {
    try {
        const member = await guild.members.fetch(user.id);
        
        switch (action) {
            case 'removePermissions':
                const adminRoles = member.roles.cache.filter(role => 
                    role.permissions.has('ADMINISTRATOR') || 
                    role.permissions.has('MANAGE_ROLES')
                );
                if (adminRoles.size > 0) {
                    await member.roles.remove(adminRoles);
                }
                break;
            case 'ban':
                await guild.members.ban(user.id, { reason: 'Sistema Anti-Raid: Exclusão em massa de cargos' });
                break;
            case 'kick':
                await member.kick('Sistema Anti-Raid: Exclusão em massa de cargos');
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

module.exports = { handleRoleDelete };