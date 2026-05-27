const { EmbedBuilder } = require('discord.js');

/**
 * Verifica a idade da conta de um membro
 * @param {GuildMember} member - Membro do servidor
 * @param {Object} guildConfig - Configuração do servidor
 * @returns {Promise<boolean>} True se a conta precisar de verificação
 */
async function checkAccount(member, guildConfig) {
    try {
        const accountAge = Date.now() - member.user.createdTimestamp;
        const minAge = guildConfig.altDetection.minAccountAge * 24 * 60 * 60 * 1000; // Converter dias para ms

        // Verificar se a conta é muito nova
        if (accountAge < minAge) {
            // Executar ação com base na configuração
            await handleNewAccount(member, guildConfig, accountAge);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Erro ao verificar idade da conta:', error);
        return false;
    }
}

/**
 * Executa ação apropriada para conta nova
 * @param {GuildMember} member - Membro do servidor
 * @param {Object} guildConfig - Configuração do servidor
 * @param {number} accountAge - Idade da conta em ms
 */
async function handleNewAccount(member, guildConfig, accountAge) {
    const embed = new EmbedBuilder()
        .setTitle('⚠️ Conta Recente Detectada')
        .setColor('#FF9900')
        .setDescription(`Usuário: ${member.user.tag} (${member.id})`)
        .addFields(
            { name: 'Idade da Conta', value: formatAge(accountAge), inline: true },
            { name: 'Criada em', value: member.user.createdAt.toLocaleDateString(), inline: true }
        )
        .setTimestamp();

    // Enviar notificação se configurado
    if (guildConfig.altDetection.notificationChannel) {
        const channel = member.guild.channels.cache.get(guildConfig.altDetection.notificationChannel);
        if (channel) {
            await channel.send({ embeds: [embed] });
        }
    }

    switch (guildConfig.altDetection.action) {
        case 'block':
            await member.kick('Conta muito recente - Sistema de proteção');
            break;
            
        case 'notify':
            // Notificação já enviada acima
            
            break;
            
        case 'verify':
            // A verificação será iniciada pelo módulo de verificação
            break;
    }
}

/**
 * Formata a idade da conta de forma legível
 * @param {number} ms - Idade em milissegundos
 * @returns {string} Idade formatada
 */
function formatAge(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `${days} dias, ${hours} horas`;
}

module.exports = { checkAccount };