const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const moment = require("moment");
const { default: axios } = require("axios");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const Estatisticas = require("../../../Functions/estatisticas");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perfil")
        .setDescription("Veja o perfil de compras de algum usuário!")
        .addUserOption(opUser => opUser
            .setName(`usuário`)
            .setDescription(`Selecione um usuário`)
            .setRequired(false)
        ),

    async execute(interaction, client) {
        // Verificar se o sistema de vendas está ativo
        const colorC = await dbConfigs.get(`vendas.embeds.color`);
       // let type = getCache(null, 'type');
     //   if (type?.Vendas?.status !== true) {
          //  await interaction.reply({ 
           //     content: `❌ | Comando desabilitado pois o sistema de vendas não está ativo.`, 
            //    flags: MessageFlags.Ephemeral 
         //   });
          //  return;
        //}

        // Iniciar resposta diferida sempre como ephemeral
        await interaction.deferReply({ ephemeral: true });

        try {
            const userSelected = interaction.options.getUser(`usuário`) || interaction.user;
            
            // Obter estatísticas totais do servidor
            const estatisticasTotal = await Estatisticas(client, 0, interaction.guild.id);
            
            // Obter compras do usuário específico
            const userPurchases = await getUserPurchases(interaction.guild.id, userSelected.id);
            
            if (!userPurchases || userPurchases.length === 0) {
                // Usuário não tem compras, criar perfil com valores zerados
                const emptyProfileEmbed = createProfileEmbed(
                    userSelected,
                    0,  // orderCount
                    0,  // totalSpent
                    0,  // balance (manter o mesmo comportamento do original)
                    0,  // ranking
                    null, // lastPurchase
                    colorC
                );
                
                await interaction.editReply({
                    embeds: [emptyProfileEmbed]
                });
                return;
            }
            
            // Calcular estatísticas do usuário
            const userStats = calculateUserStats(userPurchases);
            
            // Calcular ranking do usuário
            const userRanking = await calculateUserRanking(
                interaction.guild.id, 
                userSelected.id, 
                userStats.totalSpent
            );
            
            // Criar e enviar o embed do perfil
            const profileEmbed = createProfileEmbed(
                userSelected,
                userStats.orderCount,
                userStats.totalSpent,
                userStats.balance || 0,
                userRanking,
                userStats.lastPurchase,
                colorC
            );
            
            await interaction.editReply({
                embeds: [profileEmbed]
            });
            
        } catch (error) {
            console.error("Erro ao executar comando de perfil:", error);
            await interaction.editReply({
                content: `❌ | Ocorreu um erro ao processar o perfil.`
            });
        }
    },
};

/**
 * Obtém as compras de um usuário específico
 * @param {string} guildId - ID do servidor
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de compras do usuário
 */
async function getUserPurchases(guildId, userId) {
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
        const allPurchases = Array.isArray(response.data) ? response.data : [];
        
        // Filtrar apenas compras do usuário específico
        return allPurchases.filter(purchase => {
            const purchaseUserId = purchase.userId || purchase.user_id || purchase.comprador;
            return purchaseUserId === userId;
        });
        
    } catch (error) {
        console.error('Erro ao obter compras do usuário:', error);
        return []; // Retornar array vazio em caso de erro
    }
}

/**
 * Calcula estatísticas a partir das compras de um usuário
 * @param {Array} purchases - Lista de compras do usuário
 * @returns {Object} Estatísticas calculadas
 */
function calculateUserStats(purchases) {
    // Inicializar estatísticas
    const stats = {
        orderCount: purchases.length,
        totalSpent: 0,
        balance: 0, // Mantido para compatibilidade
        lastPurchase: null
    };
    
    // Se não houver compras, retornar estatísticas zeradas
    if (purchases.length === 0) {
        return stats;
    }
    
    // Ordenar compras por data (mais recente primeiro)
    const sortedPurchases = [...purchases].sort((a, b) => {
        const dateA = a.date ? Number(a.date) : 0;
        const dateB = b.date ? Number(b.date) : 0;
        return dateB - dateA;
    });
    
    // Definir a última compra
    stats.lastPurchase = sortedPurchases[0].date;
    
    // Calcular total gasto
    stats.totalSpent = purchases.reduce((total, purchase) => {
        const price = Number(purchase.price) || 0;
        return total + price;
    }, 0);
    
    // Verificar se há informação de saldo em alguma compra
    // (Caso o sistema antigo armazenasse isso nas compras)
    const lastPurchaseWithBalance = sortedPurchases.find(p => p.balance !== undefined);
    if (lastPurchaseWithBalance) {
        stats.balance = Number(lastPurchaseWithBalance.balance) || 0;
    }
    
    return stats;
}

/**
 * Calcula o ranking do usuário com base no total gasto
 * @param {string} guildId - ID do servidor
 * @param {string} userId - ID do usuário
 * @param {number} userTotalSpent - Total gasto pelo usuário
 * @returns {Promise<number>} Posição do usuário no ranking (0 se não estiver no ranking)
 */
async function calculateUserRanking(guildId, userId, userTotalSpent) {
    // Se o usuário não gastou nada, não está no ranking
    if (userTotalSpent <= 0) {
        return 0;
    }
    
    try {
        // Obter todas as compras
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://nevermiss-api.squareweb.app/getCompra2/${guildId}`,
            headers: {
                'Authorization': 'wj5O7E82dG4t'
            }
        };

        const response = await axios.request(config);
        const allPurchases = Array.isArray(response.data) ? response.data : [];
        
        // Agrupar compras por usuário e calcular total gasto
        const userStats = {};
        
        for (const purchase of allPurchases) {
            const purchaseUserId = purchase.userId || purchase.user_id || purchase.comprador;
            if (!purchaseUserId) continue;
            
            const price = Number(purchase.price) || 0;
            
            if (!userStats[purchaseUserId]) {
                userStats[purchaseUserId] = {
                    userId: purchaseUserId,
                    totalSpent: 0
                };
            }
            
            userStats[purchaseUserId].totalSpent += price;
        }
        
        // Converter para array e ordenar por total gasto (decrescente)
        const sortedUsers = Object.values(userStats)
            .sort((a, b) => b.totalSpent - a.totalSpent);
        
        // Encontrar a posição do usuário no ranking
        const userPosition = sortedUsers.findIndex(user => user.userId === userId);
        
        // Retornar a posição (índice + 1) ou 0 se não encontrado
        return userPosition >= 0 ? userPosition + 1 : 0;
        
    } catch (error) {
        console.error('Erro ao calcular ranking do usuário:', error);
        return 0; // Em caso de erro, não está no ranking
    }
}

/**
 * Cria o embed do perfil do usuário
 * @param {User} user - Objeto do usuário do Discord
 * @param {number} orderCount - Número de compras
 * @param {number} totalSpent - Total gasto
 * @param {number} balance - Saldo disponível
 * @param {number} ranking - Posição no ranking
 * @param {string|null} lastPurchase - Timestamp da última compra
 * @param {string} color - Cor do embed
 * @returns {EmbedBuilder} Embed do perfil
 */
function createProfileEmbed(user, orderCount, totalSpent, balance, ranking, lastPurchase, color) {
    // Formatar valores monetários
    const formattedTotalSpent = Number(totalSpent).toFixed(2);
    const formattedBalance = Number(balance).toFixed(2);
    
    // Criar mensagem de ranking
    const rankingMessage = ranking > 0
        ? `**${user.username}** está em **__${ranking}°__** no ranking!`
        : `**${user.username}** não está no ranking!`;
    
    // Formatar data da última compra
    let lastPurchaseFormatted;
    if (lastPurchase) {
        // Converter timestamp para formato legível
        const timestamp = Number(lastPurchase);
        lastPurchaseFormatted = `<t:${Math.floor(timestamp / 1000)}:R>`;
    } else {
        lastPurchaseFormatted = "**__Nenhuma!__**";
    }
    
    // Criar o embed
    return new EmbedBuilder()
        .setAuthor({ name: user.username, iconURL: user.avatarURL({ dynamic: true }) })
        .setTitle(`Perfil | ${user.username}`)
        .addFields(
            { name: `🛒 | Produtos Comprados:`, value: `**__${orderCount}__** Compras realizadas.` },
            { name: `💸 | Total Gasto:`, value: `**R$__${formattedTotalSpent}__** ` },
            { name: `💰 | Saldo:`, value: `**R$__${formattedBalance}__**` },
            { name: `🏆 | Posição no Rank:`, value: rankingMessage },
            { name: `📝 | Ultima Compra:`, value: lastPurchaseFormatted }
        )
        .setThumbnail(user.avatarURL({ dynamic: true }))
        .setColor(color !== "none" ? color : "#460580")
        .setTimestamp();
}