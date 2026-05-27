const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Veja todos os meus comandos!"),

    async execute(interaction, client) {
        //et type = getCache(null, 'type')
        //if (type?.Vendas?.status !== true) {
           // interaction.reply({ content: `❌ | Comando desabilitado pois o sistema de vendas não está ativo.`, flags: MessageFlags.Ephemeral })
          //  return
       // }

        const rowHelp = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`advancedCommands`)
                    .setLabel(`Comandos Avançados`)
                    .setEmoji(`⚙`)
                    .setStyle(`Primary`)
            );

        const embedHelp = new EmbedBuilder()
            .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
            .setTitle(`${client.user.username} | Comandos de Uso Livre`)
            .setDescription([
                `**/help**\n \`Exibe está mensagem.\``,
                `**/adicionar-saldo**\n \`Adicione saldo no BOT via Pix.\``,
                `**/cleardm**\n \`Limpa a DM do BOT caso haja mensagens.\``,
                `**/rank**\n \`Veja o rank dos usuários que mais compraram.\``,
                `**/resgatar-gift**\n \`Resgate um GiftCard.\``,
            ].join('\n'))
            .setColor(0xFFFFFF)
            .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` });

        await interaction.reply({
            embeds: [embedHelp],
            components: [rowHelp]
        }).then(async (msg) => {
            const filter = (i) => i.user.id == interaction.user.id;
            const collectorHelp = msg.createMessageComponentCollector({
                filter: filter,
                time: 600000
            });
            collectorHelp.on("collect", async (iHelp) => {
                if (iHelp.customId == `advancedCommands`) {
                    if (!await dbPerms.get(`vendas`)?.includes(interaction.user.id)) {
                        await interaction.reply({
                            content: `❌ | Você não tem permissão para ver os comandos avançados.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    };

                    const rowHelp = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`publicCommands`).setLabel(`Comandos de Uso Livre`).setEmoji(`⚙`).setStyle(`Success`)
                        );

                    const embedHelp = new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                        .setTitle(`${client.user.username} | Comandos Avançados`)
                        .setDescription([
                            `**/gerenciar**\n \`Gerencie as configurações do BOT.\``,
                            `**/administrar-saldo**\n \`Gerencie o saldo de algum usuário.\``,
                            `**/conectar** \`[Canal]\`\n\`Conecte o BOT em um canal de voz.\``,
                            `**/config-cupom** \`[Nome]\`\n\`Configure um cupom de desconto.\``,
                            `**/config** \`[ID/Produto]\`\n\`Configure um produto.\``,
                            `**/config-painel** \`[ID/Painel]\`\n\`Configure um painel de produtos.\``,
                            `**/criados**\n \`Veja todos os itens cadastrados.\``,
                            `**/criar-cupom** \`[Nome]\`\n\`Cadastre um novo cupom de desconto.\``,
                            `**/criar-gift**\n \`Cadastre um novo GiftCard com valor.\``,
                            `**/criar** \`[ID/Produto]\`\n\`Cadastre um novo produto.\``,
                            `**/criar-painel** \`[ID/Painel] [ID/Produto]\`\n\`Cadastre um novo painel de produtos em select menu.\``,
                            `**/dm** \`[Usuário] [Mensagem]\`\n \`Envie uma mensagem privada para algum usuário.\``,
                            `**/entregar** \`[ID/Produto] [Usuário] [Unidade]\`\n\`Entregue um produto para um usuário.\``,
                            `**/estatísticas**\n \`Veja as estatisticas do BOT.\``,
                            `**/gerar-pix** \`[Valor]\`\n\`Gere uma cobrança via Pix.\``,
                            `**/pegar \`[ID/Pedido]\`\n\`Mostra os itens entregues de uma compra pelo ID.\``,
                            `**/perfil \`[Usuário/Opcional]\`\n\`Veja o perfil de compras de algum usuário.\``,
                            `**/rank-adm\n \`Veja o rank dos usuários que mais compraram.\``,
                            `**/rank-produtos\n \`Veja o rank dos produtos que mais foram vendidos.\``,
                            `**/say \`[Mensagem]\`\n\`Faça o BOT enviar uma mensagem.\``,
                            `**/set \`[ID/Produto]\`\n\`Sete a mensagem de compra.\``,
                            `**/set-painel** \`[ID/Painel]\`\n\`Sete a mensagem de compra de um painel com select menu.\``,
                            `**/status**\n \`[ID/Pagamento]\`\`Verifique o status de um pagamento.\``,
                            `**/stock-id**\n \`[ID/Produto]\`\`Veja o estoque de um produto.\``,
                            `**/add-perm**\n \`Dê permissão para algum usuário usar minhas funções.\``,
                            `**/remove-perm**\n \`Remova permissão de algum usuário.\``,
                            `**/users-perm**\n \`Veja os usuários que tem permissão para usar minhas funções.\``
                        ].join('\n'))
                        .setColor(0xFFFFFF)
                        .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` });

                    await iHelp.update({
                        embeds: [embedHelp],
                        components: [rowHelp]
                    });
                };

                if (iHelp.customId == `publicCommands`) {
                    await iHelp.update({
                        embeds: [embedHelp],
                        components: [rowHelp]
                    });
                };
            });
        });
    },
};