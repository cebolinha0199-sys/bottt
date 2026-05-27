const { AuditLogEvent } = require('discord.js');
const { updateConfig } = require('../config/saveConfig');

/**
 * Cache para registrar exclusões de canais
 * Estrutura: { guildId: { userId: { count: number, timestamp: number } } }
 */
const deletionCache = new Map();

/**
 * Manipula eventos de exclusão de canal
 * @param {Channel} channel - Canal excluído
 * @param {Client} client - Cliente do Discord.js
 * @param {Object} guildConfig - Configuração do servidor
 */
async function handleChannelDelete(channel, client, guildConfig) {
    try {
        // Ignorar canais que não são de uma guild
        if (!channel.guild) return;

        // Buscar logs de auditoria para determinar quem excluiu o canal
        const auditLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelDelete
        });

        // Obter a entrada mais recente
        const deleteLog = auditLogs.entries.first();
        
        // Se não houver log ou for muito antigo (mais de 5 segundos), ignorar
        if (!deleteLog || (Date.now() - deleteLog.createdTimestamp > 5000)) return;

        // Obter o usuário que excluiu o canal
        const executor = deleteLog.executor;
        
        // Ignorar ações do próprio bot ou do dono do servidor
        if (executor.id === client.user.id || executor.id === channel.guild.ownerId) return;

        // Verificar se o usuário está no cache
        if (!deletionCache.has(channel.guild.id)) {
            deletionCache.set(channel.guild.id, new Map());
        }
        
        const guildCache = deletionCache.get(channel.guild.id);
        
        if (!guildCache.has(executor.id)) {
            guildCache.set(executor.id, {
                count: 1,
                timestamp: Date.now()
            });
        } else {
            const userData = guildCache.get(executor.id);
            
            // Resetar contador se passou muito tempo desde a última exclusão
            if (Date.now() - userData.timestamp > 60000) { // 1 minuto
                userData.count = 1;
                userData.timestamp = Date.now();
            } else {
                userData.count++;
                userData.timestamp = Date.now();
            }
            
            guildCache.set(executor.id, userData);
        }
        
        // Verificar se excedeu o limite (5 canais em 1 minuto)
        const userData = guildCache.get(executor.id);
        if (userData.count >= 5) {
            // Executar ação com base na configuração
            await executeAction(channel.guild, executor, guildConfig.antiRaid.channelProtection.action);
            
            // Registrar no canal de logs, se configurado
            if (guildConfig.logs?.enabled && guildConfig.logs.securityChannel) {
                const logChannel = channel.guild.channels.cache.get(guildConfig.logs.securityChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `⚠️ **ALERTA DE SEGURANÇA** ⚠️\nDetectada exclusão em massa de canais por ${executor.tag} (${executor.id}).\nAção tomada: ${getActionName(guildConfig.antiRaid.channelProtection.action)}`
                    });
                }
            }
            
            // Limpar o cache para este usuário
            guildCache.delete(executor.id);
        }
    } catch (error) {
        console.error('Erro ao processar proteção de canais:', error);
    }
}

/**
 * Executa a ação configurada contra o usuário
 * @param {Guild} guild - Servidor Discord
 * @param {User} user - Usuário a receber a ação
 * @param {string} action - Ação a ser executada
 */
async function executeAction(guild, user, action) {
    try {
        const member = await guild.members.fetch(user.id);
        
        switch (action) {
            case 'removePermissions':
                // Remover todos os cargos com permissões administrativas
                const adminRoles = member.roles.cache.filter(role => 
                    role.permissions.has('ADMINISTRATOR') || 
                    role.permissions.has('MANAGE_CHANNELS') || 
                    role.permissions.has('MANAGE_GUILD')
                );
                
                if (adminRoles.size > 0) {
                    await member.roles.remove(adminRoles);
                }
                break;
                
            case 'ban':
                // Banir o usuário
                await guild.members.ban(user.id, { reason: 'Sistema Anti-Raid: Exclusão em massa de canais' });
                break;
                
            case 'kick':
                // Expulsar o usuário
                await member.kick('Sistema Anti-Raid: Exclusão em massa de canais');
                break;
                
            case 'removeRoles':
                // Remover todos os cargos
                await member.roles.set([]);
                break;
        }
    } catch (error) {
        console.error(`Erro ao executar ação ${action} contra usuário:`, error);
    }
}

/**
 * Traduz o código da ação para um nome legível
 * @param {string} actionCode - Código da ação
 * @returns {string} Nome legível da ação
 */
function getActionName(actionCode) {
    const actions = {
        'removePermissions': 'Remover Permissões Administrativas',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário',
        'removeRoles': 'Remover Todos os Cargos'
    };
    
    return actions[actionCode] || 'Desconhecida';
}

module.exports = { handleChannelDelete };