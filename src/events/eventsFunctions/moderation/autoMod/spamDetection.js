const { Message } = require('discord.js');

/**
 * Cache para rastrear mensagens recentes de usuários
 * Estrutura: { userId: { messages: [timestamp, ...], lastWarned: timestamp } }
 */
const userMessageCache = new Map();

/**
 * Verifica se uma mensagem é spam
 * @param {Message} message - Mensagem do Discord
 * @param {Object} guildConfig - Configuração do servidor
 */
async function checkMessage(message, guildConfig) {
    try {
        const configType = 'spamDetection'; // Tipo de configuração para spam
        const { author, guild, channel, member } = message;
        const config = guildConfig.autoMod[configType]; // configType será 'spamDetection', 'linkFilter' ou 'mentionFilter'
        
        

        // Verificar se o membro tem cargo isento
        if (member && config.whitelistedRoles?.some(roleId => member.roles.cache.has(roleId))) {
            console.log(`Usuário ${member.user.tag} possui cargo isento desta moderação`);
            return;
        }
        
        // Obter ou inicializar o cache para este usuário
        if (!userMessageCache.has(author.id)) {
            userMessageCache.set(author.id, {
                messages: [],
                lastWarned: 0
            });
        }
        
        const userData = userMessageCache.get(author.id);
        const now = Date.now();
        
        // Adicionar esta mensagem ao histórico
        userData.messages.push(now);
        
        // Remover mensagens antigas (fora da janela de tempo)
        userData.messages = userData.messages.filter(
            timestamp => now - timestamp < config.timeThreshold * 1000
        );
        
        // Verificar se excedeu o limite
        if (userData.messages.length >= config.messageThreshold) {
            // Evitar spam de ações (não agir se já agiu recentemente)
            if (now - userData.lastWarned < 10000) return; // 10 segundos
            
            // Marcar que agimos agora
            userData.lastWarned = now;
            
            // Executar ação com base na configuração
            await executeAction(message, config.action, config.duration);
            
            // Registrar no canal de logs, se configurado
            if (guildConfig.logs?.enabled && guildConfig.logs.moderationChannel) {
                const logChannel = guild.channels.cache.get(guildConfig.logs.moderationChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `🤖 **AUTO-MODERAÇÃO** 🤖\nDetectado spam de ${author.tag} (${author.id}) no canal ${channel}.\nAção tomada: ${getActionName(config.action)}`
                    });
                }
            }
            
            // Limpar o cache para este usuário
            userData.messages = [];
        }
        
        // Atualizar o cache
        userMessageCache.set(author.id, userData);
    } catch (error) {
        console.error('Erro ao processar detecção de spam:', error);
    }
}

/**
 * Executa a ação configurada contra o usuário
 * @param {Message} message - Mensagem do Discord
 * @param {string} action - Ação a ser executada
 * @param {number} duration - Duração em minutos (para timeout)
 */
async function executeAction(message, action, duration) {
    try {
        const { author, guild, channel } = message;
        
        switch (action) {
            case 'timeout':
                // Aplicar timeout
                const member = await guild.members.fetch(author.id);
                await member.timeout(duration * 60 * 1000, 'Auto-Moderação: Spam detectado');
                
                // Notificar usuário
                await channel.send({
                    content: `<@${author.id}>, você foi silenciado por ${duration} minutos por enviar mensagens muito rapidamente.`,
                    allowedMentions: { users: [author.id] }
                });
                break;
                
            case 'delete':
                // Buscar mensagens recentes do usuário neste canal
                const messages = await channel.messages.fetch({ limit: 50 });
                const userMessages = messages.filter(m => m.author.id === author.id);
                
                // Deletar mensagens dos últimos 10 segundos
                const recentMessages = userMessages.filter(
                    m => Date.now() - m.createdTimestamp < 10000
                );
                
                if (recentMessages.size > 0) {
                    await channel.bulkDelete(recentMessages);
                }
                
                // Notificar usuário
                await channel.send({
                    content: `<@${author.id}>, por favor, evite enviar mensagens muito rapidamente.`,
                    allowedMentions: { users: [author.id] }
                });
                break;
                
            case 'warn':
                // Apenas avisar
                await channel.send({
                    content: `<@${author.id}>, **AVISO**: Por favor, evite enviar mensagens muito rapidamente.`,
                    allowedMentions: { users: [author.id] }
                });
                break;
                
            case 'ban':
                // Banir o usuário
                await guild.members.ban(author.id, { reason: 'Auto-Moderação: Spam excessivo' });
                break;
                
            case 'kick':
                // Expulsar o usuário
                const memberToKick = await guild.members.fetch(author.id);
                await memberToKick.kick('Auto-Moderação: Spam excessivo');
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
        'timeout': 'Timeout (Castigo)',
        'delete': 'Deletar Mensagens',
        'warn': 'Avisar Usuário',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário'
    };
    
    return actions[actionCode] || 'Desconhecida';
}

module.exports = { checkMessage, executeAction, getActionName };