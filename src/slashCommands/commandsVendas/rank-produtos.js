const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank-produtos")
        .setDescription("Veja o rank dos produtos que mais foram vendidos!"),

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
   //     let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
 //       if (type?.Vendas?.status !== true) {
       //     interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
    //        return
   //     }

        const choices = [];

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value })),
            );
            return;
        }

        await interaction.reply({
            content: `🔁 | Carregando ...`
        }).then(async (msg) => {
            const iId = interaction.id;
            const allItems = await Promise.all(
                dbProducts.all().sort((a, b) => b.data.incomeTotal - a.data.incomeTotal)
                    .filter((product) => product.data.incomeTotal > 0.00)
                    .map(async (product, index) => {

                        const productId = product.ID;
                        const productName = product.data.name;
                        const productIncomeTotal = product.data.incomeTotal;
                        const productSellsTotal = product.data.sellsTotal;

                        const productPosition = index + 1;

                        const productPositionEmoji =
                            productPosition == 1 ? `🥇` :
                                productPosition == 2 ? `🥈` :
                                    productPosition == 3 ? `🥉` :
                                        `🏅`;

                        return `${productPositionEmoji} | **__${productPosition}°__** - ${productName} | ${productId}\n💸 | Rendeu: **R$__${Number(productIncomeTotal).toFixed(2)}__**\n🛒 | Total de Vendas: **${Number(productSellsTotal)}**`;
                    })
            );

            await client.users.cache.clear();
            if (allItems <= 0) {
                await interaction.editReply({
                    content: `❌ | Nenhum produto em rank foi encontrado.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            };

            let currentPage = 1;
            const itemsPerPage = 10;

            async function updateMessagePage(page) {
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const itemsForPage = allItems.slice(startIndex, endIndex);
                const description = itemsForPage.join("\n\n");

                const embedPage = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                    .setTitle(`${client.user.username} | Produtos`)
                    .setDescription(description)
                    .setColor(colorC !== "none" ? colorC : "#460580")
                    .setFooter({ text: `Gerencie as páginas usando os botões abaixo.` });

                await interaction.editReply({
                    content: ``,
                    embeds: [embedPage],
                    components: [createRowPage(page)]
                });

            };

            function createRowPage(page) {
                const rowPage = new ActionRowBuilder();
                const totalPage = Math.ceil(allItems.length / itemsPerPage);

                if (page != 1 && page != totalPage) {
                    rowPage.addComponents(
                        new ButtonBuilder().setCustomId(`backMax-${iId}`).setEmoji(`⏮`).setStyle(`Primary`),
                        new ButtonBuilder().setCustomId(`back-${iId}`).setEmoji(`⬅`).setStyle(`Primary`),
                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`next-${iId}`).setEmoji(`➡`).setStyle(`Primary`),
                        new ButtonBuilder().setCustomId(`nextMax-${iId}`).setEmoji(`⏭`).setStyle(`Primary`),
                    );
                } else if (allItems.length < (itemsPerPage + 1)) {
                    rowPage.addComponents(
                        new ButtonBuilder().setCustomId(`backMax-${iId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`back-${iId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`next-${iId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`nextMax-${iId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                    );
                } else if (page <= 1) {
                    rowPage.addComponents(
                        new ButtonBuilder().setCustomId(`backMax-${iId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`back-${iId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`next-${iId}`).setEmoji(`➡`).setStyle(`Primary`),
                        new ButtonBuilder().setCustomId(`nextMax-${iId}`).setEmoji(`⏭`).setStyle(`Primary`)
                    );
                } else {
                    rowPage.addComponents(
                        new ButtonBuilder().setCustomId(`backMax-${iId}`).setEmoji(`⏮`).setStyle(`Primary`),
                        new ButtonBuilder().setCustomId(`back-${iId}`).setEmoji(`⬅`).setStyle(`Primary`),
                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`next-${iId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                        new ButtonBuilder().setCustomId(`nextMax-${iId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true),
                    );
                };

                return rowPage;
            };

            await updateMessagePage(currentPage);

            const collectorItemBts = msg.createMessageComponentCollector({
                time: 600000
            });
            collectorItemBts.on("collect", async (iItemBt) => {
                if (iItemBt.customId == `backMax-${iId}` && currentPage > 1) {
                    await iItemBt.deferUpdate();
                    currentPage = 1;
                    await updateMessagePage(currentPage);
                };

                if (iItemBt.customId == `back-${iId}` && currentPage > 1) {
                    await iItemBt.deferUpdate();
                    currentPage--;
                    await updateMessagePage(currentPage);
                };

                if (iItemBt.customId == `next-${iId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                    await iItemBt.deferUpdate();
                    currentPage++;
                    await updateMessagePage(currentPage);
                };

                if (iItemBt.customId == `nextMax-${iId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                    await iItemBt.deferUpdate();
                    const totalPages = Math.ceil(allItems.length / itemsPerPage);
                    currentPage = totalPages;
                    await updateMessagePage(currentPage);
                };
            });

            collectorItemBts.on("end", async (c, r) => {
                if (r == "time") {
                    const totalPages = Math.ceil(allItems.length / itemsPerPage);
                    await interaction.editReply({
                        components: [new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${currentPage}/${totalPages}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                            )
                        ]
                    });
                };
            });
        });
    },
};