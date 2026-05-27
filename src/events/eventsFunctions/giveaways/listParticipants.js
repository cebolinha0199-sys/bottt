const { findGiveawayByMessageId } = require('./utils');

/**
 * Processa o botão para listar participantes do sorteio
 * @param {import('discord.js').ButtonInteraction} interaction - Interação do botão
 */
async function handleListParticipantsButton(interaction) {
    // Encontrar o sorteio pelo ID da mensagem
    const sorteio = findGiveawayByMessageId(interaction.message.id);

    if (!sorteio) {
        return interaction.reply({
            content: '❌ | Este sorteio não existe!',
            ephemeral: true
        });
    }

    if (sorteio.participants.length === 0) {
        return interaction.reply({
            content: '📋 | Não há participantes neste sorteio ainda!',
            ephemeral: true
        });
    }

    // Criar lista de participantes
    let participantsText = '';
    for (let i = 0; i < sorteio.participants.length; i++) {
        participantsText += `${i + 1}. <@${sorteio.participants[i]}>\n`;

        // Se a lista ficar muito grande, criar um arquivo
        if (participantsText.length > 1) {
            // Gerar arquivo
            const buffer = Buffer.from(`Participantes do sorteio "${sorteio.prize}":\n\n${sorteio.participants.map((id, index) => `${index + 1}. ${id}`).join('\n')}`);

            return interaction.reply({
                content: `📋 | O sorteio possui ${sorteio.participants.length} participantes. Lista completa no arquivo:`,
                files: [{ attachment: buffer, name: 'participantes.txt' }],
                ephemeral: true
            });
        }
    }

    return interaction.reply({
        content: `📋 | Participantes do sorteio (${sorteio.participants.length}):\n\n${participantsText}`,
        ephemeral: true
    });
}

module.exports = {
    handleListParticipantsButton
};