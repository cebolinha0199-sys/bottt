const { findGiveawayByMessageId, updateGiveaway } = require('./utils');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Processa o botão de participação no sorteio
 * @param {import('discord.js').ButtonInteraction} interaction - Interação do botão
 */
async function handleParticipateButton(interaction) {
    // Encontrar o sorteio pelo ID da mensagem
    const sorteio = findGiveawayByMessageId(interaction.message.id);

    if (!sorteio) {
        return interaction.reply({
            content: '❌ | Este sorteio não existe ou já foi finalizado!',
            ephemeral: true
        });
    }

    if (sorteio.ended) {
        return interaction.reply({
            content: '❌ | Este sorteio já foi finalizado!',
            ephemeral: true
        });
    }

    // Verificar se o usuário já está participando
    if (sorteio.participants.includes(interaction.user.id)) {
        return interaction.reply({
            content: `❌ | Você já está participando deste sorteio!`,
            ephemeral: true
        });
    }

    // Verificar restrições de cargos
    if (sorteio.allowedRoles.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasAllowedRole = member.roles.cache.some(role => sorteio.allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
            return interaction.reply({
                content: `❌ | Você não possui os cargos necessários para participar deste sorteio!`,
                ephemeral: true
            });
        }
    }

    if (sorteio.deniedRoles.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasDeniedRole = member.roles.cache.some(role => sorteio.deniedRoles.includes(role.id));

        if (hasDeniedRole) {
            return interaction.reply({
                content: `❌ | Você possui um cargo que não permite participar deste sorteio!`,
                ephemeral: true
            });
        }
    }

    // Adicionar usuário aos participantes
    sorteio.participants.push(interaction.user.id);

    // Atualizar no banco de dados
    updateGiveaway(interaction.message.id, { participants: sorteio.participants });

    // NOVO CÓDIGO: Atualizar o botão com o novo contador de participantes
    try {
        // Obter a mensagem atual
        const message = await interaction.message.fetch();

        // Clonar os componentes existentes
        const components = [...message.components];

        // Atualizar o botão "Participar" com o novo contador
        const participarButton = ButtonBuilder.from(components[0].components[0])
            .setLabel(`Participar (${sorteio.participants.length})`);

        // Recriar a action row com os botões atualizados
        const listaButton = ButtonBuilder.from(components[0].components[1]);
        const row = new ActionRowBuilder().addComponents(participarButton, listaButton);

        // Atualizar a mensagem com os novos componentes
        await interaction.message.edit({ components: [row] });
    } catch (error) {
        console.error('Erro ao atualizar contador de participantes:', error);
    }

    return interaction.reply({
        content: `✅ | Você está participando do sorteio **${sorteio.prize}**!`,
        ephemeral: true
    });
}

module.exports = {
    handleParticipateButton
};