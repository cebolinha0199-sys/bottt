const { Events } = require('discord.js');
const { loadConfig } = require('../config/loadConfig');
const newAccountFilter = require('./newAccountFilter');
const verification = require('./verification');

/**
 * Cache para rastrear verificações pendentes
 * @type {Map<string, Object>}
 */
const verificationCache = new Map();

/**
 * Inicializa o sistema de detecção de contas alternativas
 * @param {Client} client - Cliente do Discord.js
 */
function init(client) {
    // Monitorar entrada de novos membros
    client.on(Events.GuildMemberAdd, async (member) => {
        try {
            const guildConfig = await loadConfig(member.guild.id);
            
            // Verificar se o sistema está ativado
            if (!guildConfig.altDetection?.enabled) return;

            // Verificar idade da conta
            if (await newAccountFilter.checkAccount(member, guildConfig)) {
                // Iniciar processo de verificação se necessário
                if (guildConfig.altDetection.action === 'verify') {
                    await verification.startVerification(member, guildConfig);
                }
            }
        } catch (error) {
            console.error('Erro ao processar novo membro:', error);
        }
    });

    // Monitorar interações de verificação
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;
        
        if (interaction.customId.startsWith('verify_')) {
            await verification.handleVerificationInteraction(interaction, verificationCache);
        }
    });

    // crie cliente da resposta do modal verify_submit_${member.id}


    // Limpar cache periodicamente
    setInterval(() => {
        const now = Date.now();
        for (const [userId, data] of verificationCache.entries()) {
            if (now - data.timestamp > 1800000) { // 30 minutos
                verificationCache.delete(userId);
            }
        }
    }, 300000); // Limpar a cada 5 minutos

    //console.log('Sistema de detecção de contas alternativas inicializado');
}

module.exports = { init, verificationCache };