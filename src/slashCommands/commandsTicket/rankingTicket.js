const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, AttachmentBuilder, ComponentType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbRankingTicket = new JsonDatabase({ databasePath: "./databases/dbRankingTicket.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank-atendimento")
        .setDescription("[👑] Veja o ranking dos atendimentos a tickets.")
        .addStringOption(opString => opString
            .setName("opção")
            .setDescription("Selecione o tipo de ranking")
            .addChoices(
                { name: "Ranking de mensagens", value: "rankinMessage" },
                { name: "Ranking de assumidos", value: "rankinAssumidos" },
                { name: "Ranking de finalizados", value: "rankinFinalizados" }
            )
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const choices = [];
        //let type = getCache(null, 'type')
        //if (type?.Ticket?.status === false) {
            //interaction.reply({ content: `❌ | Você não possui acesso a nosso módulo de **TICKET**, adquira um em nosso site renovando seu bot. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            //return
        //}
        const getOption = interaction.options.getString("opção")

        let allItems = ''

        if (getOption == 'rankinMessage') {
            allItems = await Promise.all(
                dbRankingTicket.all().sort((a, b) => b.data.messages - a.data.messages)
                    .filter((profile) => profile.data.messages > 0)
                    .map(async (profile, index) => {

                        let userFetched = ``;

                        try {
                            const userFetch = await client.users.fetch(profile.ID);
                            userFetched = userFetch;
                        } catch (err) {
                            userFetched = `none`;
                        };

                        const userPosition = index + 1;
                        const totalMessages = profile.data.messages ? profile.data.messages : 0
                        const totalAssumidos = profile.data.assumidos ? profile.data.assumidos : 0
                        const totalFinalizados = profile.data.finalizados ? profile.data.finalizados : 0

                        const userPositionEmoji =
                            userPosition == 1 ? `🥇` :
                                userPosition == 2 ? `🥈` :
                                    userPosition == 3 ? `🥉` :
                                        `🏅`;

                        return `${userPositionEmoji} | **__${userPosition}°__** - ${userFetched != `none` ? `\`${userFetched.username}\` | ${userFetched.id}` : `__Usuário não encontrado!__`}\n✍ | Mensagens enviadas: ${totalMessages}\n📌 | Assumidos: ${totalAssumidos}\n📑 | Finalizados: ${totalFinalizados}`;
                    })
            );
        }

        if (getOption == 'rankinAssumidos') {
            allItems = await Promise.all(
                dbRankingTicket.all().sort((a, b) => b.data.assumidos - a.data.assumidos)
                    .filter((profile) => profile.data.assumidos > 0)
                    .map(async (profile, index) => {

                        let userFetched = ``;

                        try {
                            const userFetch = await client.users.fetch(profile.ID);
                            userFetched = userFetch;
                        } catch (err) {
                            userFetched = `none`;
                        };

                        const userPosition = index + 1;
                        const totalMessages = profile.data.messages ? profile.data.messages : 0
                        const totalAssumidos = profile.data.assumidos ? profile.data.assumidos : 0
                        const totalFinalizados = profile.data.finalizados ? profile.data.finalizados : 0

                        const userPositionEmoji =
                            userPosition == 1 ? `🥇` :
                                userPosition == 2 ? `🥈` :
                                    userPosition == 3 ? `🥉` :
                                        `🏅`;

                        return `${userPositionEmoji} | **__${userPosition}°__** - ${userFetched != `none` ? `\`${userFetched.username}\` | ${userFetched.id}` : `__Usuário não encontrado!__`}\n✍ | Mensagens enviadas: ${totalMessages}\n📌 | Assumidos: ${totalAssumidos}\n📑 | Finalizados: ${totalFinalizados}`;
                    })
            );
        }

        if (getOption == 'rankinFinalizados') {
            allItems = await Promise.all(
                dbRankingTicket.all().sort((a, b) => b.data.finalizados - a.data.finalizados)
                    .filter((profile) => profile.data.finalizados > 0)
                    .map(async (profile, index) => {

                        let userFetched = ``;

                        try {
                            const userFetch = await client.users.fetch(profile.ID);
                            userFetched = userFetch;
                        } catch (err) {
                            userFetched = `none`;
                        };

                        const userPosition = index + 1;
                        const totalMessages = profile.data.messages ? profile.data.messages : 0
                        const totalAssumidos = profile.data.assumidos ? profile.data.assumidos : 0
                        const totalFinalizados = profile.data.finalizados ? profile.data.finalizados : 0

                        const userPositionEmoji =
                            userPosition == 1 ? `🥇` :
                                userPosition == 2 ? `🥈` :
                                    userPosition == 3 ? `🥉` :
                                        `🏅`;

                        return `${userPositionEmoji} | **__${userPosition}°__** - ${userFetched != `none` ? `\`${userFetched.username}\` | ${userFetched.id}` : `__Usuário não encontrado!__`}\n✍ | Mensagens enviadas: ${totalMessages}\n📌 | Assumidos: ${totalAssumidos}\n📑 | Finalizados: ${totalFinalizados}`;
                    })
            );
        }

        await interaction.reply({
            content: `🔁 | Carregando ...`
        }).then(async (msg) => {
            const iId = interaction.id;

            if (allItems <= 0) {
                await interaction.editReply({
                    content: `❌ | Nenhum usuário foi encontrado para esse ranking.`,
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
                    .setTitle(`${client.user.username} | Ranking`)
                    .setDescription(description)
                    .setColor(dbConfigs.get(`ticket.color`) || "Green")
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

            collectorItemBts.on("end", async (c, respondTime) => {
                if (respondTime == "time") {
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
    }
}