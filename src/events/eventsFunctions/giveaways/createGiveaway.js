const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { parseDuration, addGiveaway } = require('./utils');
const { setupGiveawayEnding } = require('./endGiveaway');

/**
 * Cria e mostra o modal para configuração de sorteio
 * @param {import('discord.js').ButtonInteraction} interaction - Interação do botão
 */
async function createGiveawayModal(interaction) {
    // Criar o modal
    const modal = new ModalBuilder()
        .setCustomId('sorteioModal')
        .setTitle('Informações sobre o Sorteio');

    // Campo para o nome do sorteio
    const nomeInput = new TextInputBuilder()
        .setCustomId('nomeInput')
        .setLabel('Nome')
        .setPlaceholder('Digite o nome do sorteio')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(4000)
        .setRequired(true);

    // Campo para a descrição
    const descInput = new TextInputBuilder()
        .setCustomId('descInput')
        .setLabel('Descrição')
        .setPlaceholder('Digite a descrição do sorteio')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(4000)
        .setRequired(true);

    // Campo para imagem
    const imageInput = new TextInputBuilder()
        .setCustomId('imageInput')
        .setLabel('Link Da Imagem Na Embed')
        .setPlaceholder('URL da imagem (opcional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    // Campo para miniatura
    const thumbnailInput = new TextInputBuilder()
        .setCustomId('thumbnailInput')
        .setLabel('Link Da Miniatura Na Embed')
        .setPlaceholder('URL da miniatura (opcional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    // Campo para cor
    const colorInput = new TextInputBuilder()
        .setCustomId('colorInput')
        .setLabel('Cor Da Embed (Hexadecimal Ou R, G, B)')
        .setPlaceholder('#29a6fe')
        .setStyle(TextInputStyle.Short)
        .setValue('#29a6fe')
        .setRequired(true);

    // Adicionar inputs ao modal
    modal.addComponents(
        new ActionRowBuilder().addComponents(nomeInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(imageInput),
        new ActionRowBuilder().addComponents(thumbnailInput),
        new ActionRowBuilder().addComponents(colorInput)
    );

    // Mostrar o modal
    await interaction.showModal(modal);
}

/**
 * Processa a submissão do modal de sorteio
 * @param {import('discord.js').Client} client - Cliente do Discord.js
 * @param {import('discord.js').ModalSubmitInteraction} interaction - Interação do modal
 */
async function handleGiveawayModalSubmit(client, interaction) {
    // Obter os valores do modal
    const nome = interaction.fields.getTextInputValue('nomeInput');
    const descricao = interaction.fields.getTextInputValue('descInput');
    const imagemUrl = interaction.fields.getTextInputValue('imageInput') || null;
    const miniaturaUrl = interaction.fields.getTextInputValue('thumbnailInput') || null;
    const corEmbed = interaction.fields.getTextInputValue('colorInput');

    // Criar objeto temporário para armazenar dados do sorteio
    const sorteioTemp = {
        prize: nome,
        description: descricao,
        embedImage: imagemUrl,
        embedThumbnail: miniaturaUrl,
        embedColor: corEmbed,
        guildId: interaction.guildId,
        hostedBy: interaction.user.id,
        participants: [],
        winners: [],
        ended: false,
        allowedRoles: [],
        deniedRoles: [],
        winnerRole: null
    };

    // Armazenar temporariamente os dados
    client.sorteiosTemp = client.sorteiosTemp || {};
    client.sorteiosTemp[interaction.user.id] = sorteioTemp;

    // Responder e iniciar fluxo de perguntas
    await interaction.reply({
        content: '⏱️ | Por quanto tempo irá durar o sorteio? (5 minutos, 1 hora 30 minutos, 7 dias, etc)',
        ephemeral: true
    });

    // Criar coletores para as próximas perguntas
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000 }); // 5 minutos

    let etapa = 1;

    collector.on('collect', async (msg) => {
        // Deletar a mensagem do usuário para manter o chat limpo
        if (msg.deletable) await msg.delete().catch(() => { });

        if (etapa === 1) { // Tempo de duração
            const duracao = parseDuration(msg.content);
            if (!duracao) {
                await interaction.followUp({
                    content: '❌ | Formato de tempo inválido! Por favor, tente novamente (ex: 5 minutos, 1 hora, 2 dias)',
                    ephemeral: true
                });
                return;
            }

            client.sorteiosTemp[interaction.user.id].startAt = Date.now();
            client.sorteiosTemp[interaction.user.id].endAt = Date.now() + duracao;

            await interaction.followUp({
                content: '🎭 | Qual emoji deverá ser usado nas reações do sorteio?',
                ephemeral: true
            });
            etapa = 2;
        }
        else if (etapa === 2) { // Emoji
            // Verificar se é um emoji válido
            const emoji = msg.content.trim();
            client.sorteiosTemp[interaction.user.id].reactionEmoji = emoji;

            await interaction.followUp({
                content: '📢 | Em qual canal será realizado o sorteio? (Mencione o canal ou envie o ID)',
                ephemeral: true
            });
            etapa = 3;
        }
        else if (etapa === 3) { // Canal
            let channelId = msg.content.replace(/[<#>]/g, '');
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                await interaction.followUp({
                    content: '❌ | Canal não encontrado! Por favor, tente novamente.',
                    ephemeral: true
                });
                return;
            }

            client.sorteiosTemp[interaction.user.id].channelId = channel.id;

            await interaction.followUp({
                content: '🤔 | Se desejar, você pode configurar quais membros poderão participar do sorteio!\n' +
                    'Mencione os cargos que podem participar ou digite "pular" para permitir todos.',
                ephemeral: true
            });
            etapa = 4;
        }
        else if (etapa === 4) { // Cargos permitidos
            if (msg.content.toLowerCase() !== 'pular') {
                const roles = msg.mentions.roles.map(r => r.id);
                client.sorteiosTemp[interaction.user.id].allowedRoles = roles;
            }

            await interaction.followUp({
                content: '🚫 | Mencione os cargos que NÃO podem participar ou digite "pular" para continuar.',
                ephemeral: true
            });
            etapa = 5;
        }
        else if (etapa === 5) { // Cargos negados
            if (msg.content.toLowerCase() !== 'pular') {
                const roles = msg.mentions.roles.map(r => r.id);
                client.sorteiosTemp[interaction.user.id].deniedRoles = roles;
            }

            await interaction.followUp({
                content: '🏆 | Deseja adicionar um cargo ao vencedor? Mencione o cargo ou digite "pular".',
                ephemeral: true
            });
            etapa = 6;
        }
        else if (etapa === 6) { // Cargo para o vencedor
            if (msg.content.toLowerCase() !== 'pular') {
                const role = msg.mentions.roles.first();
                if (role) {
                    client.sorteiosTemp[interaction.user.id].winnerRole = role.id;
                }
            }

            await interaction.followUp({
                content: '🔢 | Quantas pessoas vão poder ganhar o sorteio? (Mínimo 1, máximo 100)',
                ephemeral: true
            });
            etapa = 7;
        }
        else if (etapa === 7) { // Número de vencedores
            const winnerCount = parseInt(msg.content);

            if (isNaN(winnerCount) || winnerCount < 1 || winnerCount > 100) {
                await interaction.followUp({
                    content: '❌ | Número inválido! Por favor, digite um número entre 1 e 100.',
                    ephemeral: true
                });
                return;
            }

            client.sorteiosTemp[interaction.user.id].winnerCount = winnerCount;

            // Finalizar configuração e criar sorteio
            collector.stop('completed');
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({
                content: '⌛ | Tempo esgotado! Configuração de sorteio cancelada.',
                ephemeral: true
            });
            delete client.sorteiosTemp[interaction.user.id];
            return;
        }

        if (reason === 'completed') {
            const sorteioData = client.sorteiosTemp[interaction.user.id];

            // Criar a embed do sorteio
            const sorteioEmbed = new EmbedBuilder()
                .setTitle(`${sorteioData.prize}`)
                .setDescription(`${sorteioData.description}\n\n**Clique no botão abaixo para participar!**\n\n\`⏱️\` **Termina:** <t:${Math.floor(sorteioData.endAt / 1000)}:R>\n\`👑\` **Organizador:** <@${sorteioData.hostedBy}>\n\`🏆\` **Ganhadores:** ${sorteioData.winnerCount}`)
                .setColor(sorteioData.embedColor)
                .setFooter({ text: `${interaction.user.username}`})
                .setTimestamp();

            if (sorteioData.embedImage) sorteioEmbed.setImage(sorteioData.embedImage);
            if (sorteioData.embedThumbnail) sorteioEmbed.setThumbnail(sorteioData.embedThumbnail);

            // Botões para participar e ver participantes
            const participarButton = new ButtonBuilder()
                .setCustomId(`participar_${interaction.user.id}`)
                .setLabel('Participar (0)')
                .setStyle(1)
                .setEmoji(sorteioData.reactionEmoji);

            const listaButton = new ButtonBuilder()
                .setCustomId(`lista_${interaction.user.id}`)
                .setLabel('Participantes')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📋');

            const row = new ActionRowBuilder().addComponents(participarButton, listaButton);

            // Enviar a mensagem do sorteio
            const channel = interaction.guild.channels.cache.get(sorteioData.channelId);
            const sorteioMsg = await channel.send({ embeds: [sorteioEmbed], components: [row] });

            // Salvar o ID da mensagem
            sorteioData.messageId = sorteioMsg.id;

            // Salvar o sorteio no banco de dados
            addGiveaway(sorteioData);

            // Configurar o temporizador para finalizar o sorteio
            setupGiveawayEnding(client, sorteioData);

            await interaction.followUp({
                content: `✅ | Sorteio criado com sucesso no canal <#${sorteioData.channelId}>!`,
                ephemeral: true
            });

            // Limpar dados temporários
            delete client.sorteiosTemp[interaction.user.id];
        }
    });
}

module.exports = {
    createGiveawayModal,
    handleGiveawayModalSubmit
};