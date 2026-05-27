const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbCoupons = new JsonDatabase({ databasePath: "./databases/dbCoupons.json" });
const dbGifts = new JsonDatabase({ databasePath: "./databases/dbGifts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("criados")
        .setDescription("Veja todos os itens cadastrados!"),

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
       // let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
       // if (type?.Vendas?.status !== true) {
            //interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            //return
        //}

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

        const rowItemsRegistered = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`products`).setLabel(`Produtos`).setEmoji(`⚙`).setStyle(`Secondary`),
                new ButtonBuilder().setCustomId(`coupons`).setLabel(`Cupons`).setEmoji(`⚙`).setStyle(`Secondary`),
                new ButtonBuilder().setCustomId(`outStockProducts`).setLabel(`Produtos sem Estoque`).setEmoji(`⚙`).setStyle(`Secondary`),
                new ButtonBuilder().setCustomId(`giftcards`).setLabel(`GiftCards`).setEmoji(`⚙`).setStyle(`Secondary`),
            );

        const embedItemsRegistered = new EmbedBuilder()
            .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
            .setTitle(`${client.user.username} | Criados`)
            .setDescription(`⚙ | Selecione o tipo de item que deseja visualizar.`)
            .setColor(colorC !== "none" ? colorC : "#460580");

        await interaction.reply({
            embeds: [embedItemsRegistered],
            components: [rowItemsRegistered]
        }).then(async (msg) => {
            const filter = (m) => m.user.id == interaction.user.id;
            const collectorItems = msg.createMessageComponentCollector({
                filter: filter,
                time: 600000
            });
            collectorItems.on("collect", async (iItem) => {
                const iItemId = iItem.id;
                if (iItem.customId == `products`) {
                    await iItem.reply({
                        content: `🔁 | Carregando ...`,
                        flags: MessageFlags.Ephemeral
                    });

                    const allItems = await Promise.all(
                        dbProducts.all().map((product) => {
                            const productId = product.ID;
                            const productName = product.data.name;
                            const productPrice = product.data.price;
                            const productStock = product.data.stock;

                            return `**📝 | ID:** ${productId}\n**🪐 | Nome:** ${productName}\n**💸 | Preço:** R$${productPrice}\n**📦 | Estoque:** ${productStock.length}`;
                        })
                    );

                    if (allItems <= 0) {
                        await iItem.editReply({
                            content: `❌ | Nenhum produto foi encontrado.`,
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

                        await iItem.editReply({
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
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`),
                            );

                        } else if (allItems.length < (itemsPerPage + 1)) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                            );

                        } else if (page <= 1) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`)
                            );
                        } else {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true),
                            );
                        };
                        return rowPage;
                    };

                    await updateMessagePage(currentPage);

                    const filter = (m) => m.user.id == interaction.user.id;
                    const collectorItemBts = msg.createMessageComponentCollector({
                        filter: filter,
                        time: 600000
                    });
                    collectorItemBts.on("collect", async (iItemBt) => {
                        if (iItemBt.customId == `backMax-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();
                            currentPage = 1;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `back-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();
                            currentPage--;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `next-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            currentPage++;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `nextMax-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();

                            const totalPages = Math.ceil(allItems.length / itemsPerPage);
                            currentPage = totalPages;
                            await updateMessagePage(currentPage);

                        };
                    });

                    collectorItemBts.on("end", async (c, r) => {
                        if (r == "time") {
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);

                            await iItem.editReply({
                                components: [new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${currentPage}/${totalPages}`).setStyle(`Secondary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                                    )
                                ]
                            });
                        };
                    });
                };

                if (iItem.customId == `coupons`) {
                    await iItem.reply({
                        content: `🔁 | Carregando ...`,
                        flags: MessageFlags.Ephemeral
                    });

                    const allItems = await Promise.all(
                        dbCoupons.all().map((coupon) => {
                            const couponName = coupon.ID;
                            const couponDiscount = coupon.data.discount;
                            const couponStock = coupon.data.stock;
                            const couponMinimumPurchase = coupon.data.minimumPurchase;

                            const minimumPurchaseFormatted = couponMinimumPurchase != 0 ? `R$${Number(couponMinimumPurchase).toFixed(2)}` : `Qualquer valor.`;
                            return `**📝 | Nome:** ${couponName}\n**💸 | Desconto:** ${couponDiscount}%\n**🛒 | Valor Mínimo:** ${minimumPurchaseFormatted}\n**📦 | Quantidade:** ${couponStock}`;
                        })
                    );

                    if (allItems <= 0) {
                        await iItem.editReply({
                            content: `❌ | Nenhum cupom foi encontrado.`,
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
                            .setTitle(`${client.user.username} | Cupons`)
                            .setDescription(description)
                            .setColor(colorC !== "none" ? colorC : "#460580")
                            .setFooter({ text: `Gerencie as páginas usando os botões abaixo.` });

                        await iItem.editReply({
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
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`),
                            );
                        } else if (allItems.length < (itemsPerPage + 1)) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                            );
                        } else if (page <= 1) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`)
                            );
                        } else {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true),
                            );
                        };
                        return rowPage;
                    };

                    await updateMessagePage(currentPage);

                    const filter = (m) => m.user.id == interaction.user.id;
                    const collectorItemBts = msg.createMessageComponentCollector({
                        filter: filter,
                        time: 600000
                    });
                    collectorItemBts.on("collect", async (iItemBt) => {
                        if (iItemBt.customId == `backMax-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();
                            currentPage = 1;

                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `back-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();

                            currentPage--;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `next-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            currentPage++;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `nextMax-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);
                            currentPage = totalPages;

                            await updateMessagePage(currentPage);
                        };
                    });

                    collectorItemBts.on("end", async (c, r) => {
                        if (r == "time") {
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);

                            await iItem.editReply({
                                components: [new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${currentPage}/${totalPages}`).setStyle(`Secondary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                                    )
                                ]
                            });
                        };
                    });
                };

                if (iItem.customId == `outStockProducts`) {
                    await iItem.reply({
                        content: `🔁 | Carregando ...`,
                        flags: MessageFlags.Ephemeral
                    });

                    const allItems = await Promise.all(
                        dbProducts.all().filter((product) => product.data.stock.length <= 0)
                            .map((product) => {
                                const productId = product.ID;
                                const productName = product.data.name;
                                const productPrice = product.data.price;
                                const productStock = product.data.stock;

                                return `**📝 | ID:** ${productId}\n**🪐 | Nome:** ${productName}\n**💸 | Preço:** R$${productPrice}\n**📦 | Estoque:** ${productStock.length}`;
                            })
                    );

                    if (allItems <= 0) {
                        await iItem.editReply({
                            content: `❌ | Nenhum produto sem estoque foi encontrado.`,
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

                        await iItem.editReply({
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
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`),
                            );
                        } else if (allItems.length < (itemsPerPage + 1)) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                            );
                        } else if (page <= 1) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`)
                            );
                        } else {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true),
                            );
                        };
                        return rowPage;
                    };

                    await updateMessagePage(currentPage);

                    const filter = (m) => m.user.id == interaction.user.id;
                    const collectorItemBts = msg.createMessageComponentCollector({
                        filter: filter,
                        time: 600000
                    });
                    collectorItemBts.on("collect", async (iItemBt) => {
                        if (iItemBt.customId == `backMax-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();
                            currentPage = 1;

                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `back-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();

                            currentPage--;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `next-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            currentPage++;

                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `nextMax-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);

                            currentPage = totalPages;
                            await updateMessagePage(currentPage);
                        };
                    });

                    collectorItemBts.on("end", async (c, r) => {
                        if (r == "time") {
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);

                            await iItem.editReply({
                                components: [new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${currentPage}/${totalPages}`).setStyle(`Secondary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                                    )
                                ]
                            });
                        };
                    });
                };

                if (iItem.customId == `giftcards`) {
                    await iItem.reply({
                        content: `🔁 | Carregando ...`,
                        flags: MessageFlags.Ephemeral
                    });

                    const allItems = await Promise.all(
                        dbGifts.all().map((gift) => {
                            const giftCode = gift.ID;
                            const giftBalance = gift.data.balance;

                            return `**📝 | Código:** ${giftCode}\n**💸 | Valor:** R$${Number(giftBalance).toFixed(2)}`;
                        })
                    );

                    if (allItems <= 0) {
                        await iItem.editReply({
                            content: `❌ | Nenhum gift foi encontrado.`,
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
                            .setTitle(`${client.user.username} | GiftCards`)
                            .setDescription(description)
                            .setColor(colorC !== "none" ? colorC : "#460580")
                            .setFooter({ text: `Gerencie as páginas usando os botões abaixo.` });

                        await iItem.editReply({
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
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`),
                            );
                        } else if (allItems.length < (itemsPerPage + 1)) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                            );
                        } else if (page <= 1) {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`)
                            );
                        } else {
                            rowPage.addComponents(
                                new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`),
                                new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${page}/${totalPage}`).setStyle(`Secondary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true),
                            );
                        };
                        return rowPage;
                    };

                    await updateMessagePage(currentPage);

                    const filter = (m) => m.user.id == interaction.user.id;
                    const collectorItemBts = msg.createMessageComponentCollector({
                        filter: filter,
                        time: 600000
                    });
                    collectorItemBts.on("collect", async (iItemBt) => {
                        if (iItemBt.customId == `backMax-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();
                            currentPage = 1;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `back-${iItemId}` && currentPage > 1) {
                            await iItemBt.deferUpdate();
                            currentPage--;
                            await updateMessagePage(currentPage);
                        };

                        if (iItemBt.customId == `next-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            currentPage++;
                            await updateMessagePage(currentPage);

                        };

                        if (iItemBt.customId == `nextMax-${iItemId}` && currentPage < Math.ceil(allItems.length / itemsPerPage)) {
                            await iItemBt.deferUpdate();
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);
                            currentPage = totalPages;
                            await updateMessagePage(currentPage);
                        };
                    });

                    collectorItemBts.on("end", async (c, r) => {
                        if (r == "time") {
                            const totalPages = Math.ceil(allItems.length / itemsPerPage);
                            await iItem.editReply({
                                components: [new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`backMax-${iItemId}`).setEmoji(`⏮`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`back-${iItemId}`).setEmoji(`⬅`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`currentAndTotal`).setLabel(`Página ${currentPage}/${totalPages}`).setStyle(`Secondary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`next-${iItemId}`).setEmoji(`➡`).setStyle(`Primary`).setDisabled(true),
                                        new ButtonBuilder().setCustomId(`nextMax-${iItemId}`).setEmoji(`⏭`).setStyle(`Primary`).setDisabled(true)
                                    )
                                ]
                            });
                        };
                    });
                };
            });
            collectorItems.on("end", async (c, r) => {
                if (r == "time") {
                    await interaction.editReply({
                        content: `⚙ | Use o comando novamente.`,
                        embeds: [],
                        components: []
                    });
                };
            });
        });
    },
};