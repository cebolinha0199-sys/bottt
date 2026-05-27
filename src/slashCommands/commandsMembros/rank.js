const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');
const { default: axios } = require('axios');
const { getCache } = require('../../../Functions/connect_api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('[📊] Veja o rank dos usuários que mais compraram!'),

    async execute(interaction, client) {
        // Verificar se o sistema de vendas está ativo
        const type = getCache(null, 'type');
        if (type?.Vendas?.status !== true) {
            await interaction.reply({
                content: '❌ | Comando desabilitado pois o bot não possui o sistema de venda adquirido.',
                ephemeral: true
            });
            return;
        }

        // Iniciar resposta diferida sempre como ephemeral
        await interaction.deferReply({ ephemeral: true });

        try {
            // Buscar e processar os dados
            const userStats = await getUserStats(interaction.guildId);

            if (userStats.length === 0) {
                await interaction.editReply({
                    content: '❌ | Nenhuma compra foi encontrada.'
                });
                return;
            }

            // Configurar a paginação
            await handlePagination(interaction, userStats);

        } catch (error) {
            console.error('Erro ao executar comando de rank:', error);
            await interaction.editReply({
                content: '❌ | Ocorreu um erro ao processar o comando.'
            });
        }
    }
};

/**
 * Obtém estatísticas de compras agrupadas por usuário
 * @param {string} guildId - ID do servidor Discord
 * @returns {Promise<Array>} Lista ordenada de estatísticas de usuários
 */
async function getUserStats(guildId) {
    try {
        // Configuração da requisição
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://nevermiss-api.squareweb.app/getCompra2/${guildId}`,
            headers: {
                'Authorization': 'wj5O7E82dG4t'
            }
        };

        // Executar requisição e obter dados
        const response = await axios.request(config);
        const purchases = Array.isArray(response.data) ? response.data : [];

        if (purchases.length === 0) {
            return [];
        }

        // Objeto para armazenar estatísticas por usuário
        const userStatsMap = {};

        // Processar cada compra
        for (const purchase of purchases) {
            // Obter ID do usuário, ignorar compras sem ID
            const userId = purchase.userId || purchase.user_id || purchase.comprador;
            if (!userId) continue;

            // Obter e validar o preço
            const price = Number(purchase.price) || 0;
            if (isNaN(price) || price < 0) continue;

            // Atualizar ou criar estatísticas do usuário
            if (!userStatsMap[userId]) {
                userStatsMap[userId] = {
                    userId,
                    username: purchase.username || 'Usuário',
                    totalSpent: 0,
                    orderCount: 0
                };
            }

            // Atualizar estatísticas
            userStatsMap[userId].totalSpent += price;
            userStatsMap[userId].orderCount += 1;
        }

        // Converter para array e ordenar por total gasto
        return Object.values(userStatsMap)
            .sort((a, b) => b.totalSpent - a.totalSpent);

    } catch (error) {
        console.error('Erro ao obter estatísticas de usuários:', error);
        return []; // Retornar array vazio em caso de erro
    }
}

/**
 * Gera um embed para uma página específica do ranking
 * @param {Array} userStats - Lista completa de estatísticas de usuários
 * @param {number} page - Número da página atual (começando em 1)
 * @param {number} totalPages - Número total de páginas
 * @returns {EmbedBuilder} Embed formatado para exibição
 */
function generatePageEmbed(userStats, page, totalPages) {
    // Constantes para paginação
    const USERS_PER_PAGE = 10;
    const startIndex = (page - 1) * USERS_PER_PAGE;

    // Obter usuários para a página atual
    const pageUsers = userStats.slice(startIndex, startIndex + USERS_PER_PAGE);

    // Construir a descrição com o ranking
    let description = '**Rank de Gastos:**\n\n';

    for (let i = 0; i < pageUsers.length; i++) {
        const user = pageUsers[i];
        const position = startIndex + i + 1; // Posição global no ranking

        // Formatar o valor em reais
        const totalFormatted = user.totalSpent.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        description += `${position}º. <@${user.userId}>, total de R$ ${totalFormatted} gastos e ${user.orderCount} pedido(s).\n\n`;
    }

    // Criar e retornar o embed
    return new EmbedBuilder()
        .setColor('#36393F')
        .setDescription(description);
}

/**
 * Gerencia a paginação do comando de rank
 * @param {CommandInteraction} interaction - Interação do Discord
 * @param {Array} userStats - Lista completa de estatísticas de usuários
 */
async function handlePagination(interaction, userStats) {
    const USERS_PER_PAGE = 10;
    const totalPages = Math.ceil(userStats.length / USERS_PER_PAGE);
    let currentPage = 1;

    // Função para atualizar a mensagem com a página atual
    const updateMessage = async (page) => {
        // Gerar embed para a página atual
        const embed = generatePageEmbed(userStats, page, totalPages);

        // Criar botões de navegação
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setEmoji(`<:seta_esquerda:1257790237929767032>`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),

            new ButtonBuilder()
                .setCustomId('page_indicator')
                .setLabel(`${page} de ${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji(`<:seta_direita:1257790236524806165>`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages)
        );

        // Atualizar a mensagem
        return interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    };

    // Mostrar a primeira página
    const message = await updateMessage(currentPage);

    // Criar coletor de interações para os botões
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutos
    });

    // Manipular interações com botões
    collector.on('collect', async (i) => {
        // Verificar se é o mesmo usuário que executou o comando
        if (i.user.id !== interaction.user.id) {
            await i.reply({
                content: '❌ | Apenas quem executou o comando pode navegar pelas páginas.',
                ephemeral: true
            });
            return;
        }

        // Atualizar a página com base no botão clicado
        if (i.customId === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (i.customId === 'next' && currentPage < totalPages) {
            currentPage++;
        }

        // Atualizar a mensagem e responder à interação
        await i.deferUpdate();
        await updateMessage(currentPage);
    });

    // Quando o tempo do coletor expirar
    collector.on('end', async () => {
        // Desabilitar os botões quando o tempo expirar
        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setEmoji(`<:seta_esquerda:1257790237929767032>`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId('page_indicator')
                .setLabel(`${currentPage} de ${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji(`<:seta_direita:1257790236524806165>`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );

        // Tentar atualizar a mensagem com botões desabilitados
        try {
            await interaction.editReply({
                components: [disabledRow]
            });
        } catch (error) {
            // Ignorar erros ao tentar atualizar mensagens muito antigas
            console.log('Não foi possível desabilitar os botões após o tempo expirar');
        }
    });
}