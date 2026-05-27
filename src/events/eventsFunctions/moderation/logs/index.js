const { Events, Collection, AuditLogEvent } = require('discord.js');
const { loadConfig } = require('../config/loadConfig');
const securityLogs = require('./securityLogs');
const serverLogs = require('./serverLogs');
const moderationLogs = require('./moderationLogs');

// Cache para configurações para reduzir chamadas ao banco de dados
const configCache = new Collection();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos


async function getCachedConfig(guildId) {
    const cached = configCache.get(guildId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.config;
    }

    const config = await loadConfig(guildId);
    configCache.set(guildId, {
        config,
        timestamp: Date.now()
    });
    return config;
}

function safeEventHandler(handler) {
    return async (...args) => {
        try {
            await handler(...args);
        } catch (error) {
            console.error(`Erro ao processar evento: ${error.message}`, {
                event: handler.name,
                error: error.stack,
                args: args.map(arg => arg?.id || 'undefined')
            });
        }
    };
}

function areLogsEnabled(config, channelType) {
    return config?.logs?.enabled && config.logs[channelType];
}


function init(client) {
    // Mapeamento de eventos
    const eventHandlers = {

        [Events.GuildBanAdd]: async (ban) => {
            try {
                const config = await getCachedConfig(ban.guild.id);
                if (!areLogsEnabled(config, 'securityChannel')) return;
        
                // Aguarda para garantir que o audit log esteja disponível
                await new Promise(resolve => setTimeout(resolve, 1500));
        
                const auditLog = await ban.guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberBanAdd,
                    limit: 1
                }).then(audit => audit.entries.first())
                .catch(() => null);
        
                const banInfo = {
                    guild: ban.guild,
                    user: ban.user,
                    executor: auditLog?.executor || null,
                    reason: auditLog?.reason || 'Nenhuma razão fornecida',
                    timestamp: auditLog?.createdTimestamp || Date.now()
                };
        
                await securityLogs.logBan(banInfo, config);
            } catch (error) {
                console.error('[Ban] Erro ao processar banimento:', error);
            }
        },
        
        // Eventos do Servidor
        [Events.ChannelCreate]: async (channel) => {
            if (!channel.guild) return;
            const config = await getCachedConfig(channel.guild.id);
            if (areLogsEnabled(config, 'serverChannel')) {
                await serverLogs.logChannelCreate(channel, config);
            }
        },

        [Events.ChannelDelete]: async (channel) => {
            if (!channel.guild) return;
            const config = await getCachedConfig(channel.guild.id);
            if (areLogsEnabled(config, 'serverChannel')) {
                await serverLogs.logChannelDelete(channel, config);
            }
        },

        // Eventos de Moderação
        [Events.GuildMemberUpdate]: async (oldMember, newMember) => {
            const config = await getCachedConfig(newMember.guild.id);
            if (areLogsEnabled(config, 'moderationChannel')) {
                await moderationLogs.logMemberUpdate(oldMember, newMember, config);
            }
        },

        [Events.MessageDelete]: async (message) => {
            if (!message.guild) return;
            const config = await getCachedConfig(message.guild.id);
            if (areLogsEnabled(config, 'moderationChannel')) {
                await moderationLogs.logMessageDelete(message, config);
            }
        },

        [Events.MessageBulkDelete]: async (messages) => {
            const firstMessage = messages.first();
            if (!firstMessage?.guild) return;
            const config = await getCachedConfig(firstMessage.guild.id);
            if (areLogsEnabled(config, 'moderationChannel')) {
                await moderationLogs.logBulkDelete(messages, config);
            }
        },

        [Events.GuildMemberRemove]: async (member) => {
            try {
                //console.log(`[MemberRemove] Processando saída do membro: ${member.user.tag} (${member.id})`);
        
                const config = await getCachedConfig(member.guild.id);
                if (!areLogsEnabled(config, 'securityChannel')) {
                    //console.log('[MemberRemove] Logs de segurança desativadas');
                    return;
                }
        
                // Verificar permissões do bot
                const botMember = member.guild.members.cache.get(member.client.user.id);
                if (!botMember?.permissions.has('ViewAuditLog')) {
                    console.error('[MemberRemove] Bot não tem permissão para ver audit logs');
                    return;
                }
        
                // Primeiro, verificar especificamente por ban
                let isBanned = false;
                let banLog = null;
                
                try {
                    // Aguardar um momento para o audit log ser atualizado
                    await new Promise(resolve => setTimeout(resolve, 20000));
                    
                    const banAuditLogs = await member.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberBanAdd,
                        limit: 5
                    });
        
                    banLog = banAuditLogs.entries.find(entry => 
                        entry.target?.id === member.user.id &&
                        Date.now() - entry.createdTimestamp < 5000
                    );
        
                    if (banLog) {
                        isBanned = true;
                        //console.log('[MemberRemove] Ban detectado, processando log de banimento');
                        
                        // Criar objeto de ban para passar para logBan
                        const banInfo = {
                            guild: member.guild,
                            user: member.user,
                            executor: banLog.executor,
                            reason: banLog.reason || 'Nenhuma razão fornecida'
                        };
        
                        await securityLogs.logBan(banInfo, config);
                        return; // Retornar após processar o ban
                    }
                } catch (error) {
                    console.error('[MemberRemove] Erro ao verificar ban:', error);
                }
        
                // Se não for ban, verificar kick
                if (!isBanned) {
                    try {
                        const kickAuditLogs = await member.guild.fetchAuditLogs({
                            type: AuditLogEvent.MemberKick,
                            limit: 5
                        });
        
                        const kickLog = kickAuditLogs.entries.find(entry =>
                            entry.target?.id === member.user.id &&
                            Date.now() - entry.createdTimestamp < 5000
                        );
        
                        if (kickLog) {
                            //console.log('[MemberRemove] Kick detectado, processando log de kick');
                            await securityLogs.logKick(member, config, kickLog);
                        } else {
                            // console.log('[MemberRemove] Saída normal do servidor:', {
                            //     user: member.user.tag,
                            //     joinedAt: member.joinedAt,
                            //     roles: member.roles.cache.size - 1
                            // });
                        }
                    } catch (error) {
                        console.error('[MemberRemove] Erro ao verificar kick:', error);
                    }
                }
        
            } catch (error) {
                console.error('[MemberRemove] Erro crítico:', error);
            }
        }

    };

    // Registrar todos os eventos com tratamento de erro
    Object.entries(eventHandlers).forEach(([event, handler]) => {
        client.on(event, safeEventHandler(handler));
    });

    // Limpar cache periodicamente
    setInterval(() => {
        const now = Date.now();
        configCache.sweep(cached => now - cached.timestamp > CACHE_DURATION);
    }, CACHE_DURATION);

    // console.log('Sistema de Logs inicializado com sucesso!', {
    //     eventsRegistered: Object.keys(eventHandlers).length,
    //     timestamp: new Date().toISOString()
    // });
}

module.exports = {
    init,
    getCachedConfig, // Exportado para possível uso em outros módulos
    areLogsEnabled  // Exportado para testes e reutilização
};