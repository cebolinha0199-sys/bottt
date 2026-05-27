const Discord = require("discord.js")
const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const url = require("node:url")

const { JsonDatabase } = require("wio.db")
const { getCache } = require("../../../Functions/connect_api")
const { UpdateMsgs, UpdateSelects } = require("../../../Functions/Paginas/UpdateMsgs")
const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" })
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" })
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config-painel-vendas")
        .setDescription("Configure um painel de produtos!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Painel")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction, client) {
        try {
            const choices = [];
            //const type = getCache(null, 'type');
            const dono = getCache(null, "owner");

            // Verificação rápida de permissão
            const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
            const isOwner = interaction.user.id === dono;

            if (!isInDb && !isOwner) {
                await interaction.respond([
                    { name: "Você não tem permissão para usar este comando!", value: "no-perms" }
                ]);
                return;
            }

            // Verificação do sistema de vendas
            if (type?.Vendas?.status !== true) {
                await interaction.respond([
                    { name: "Sistema de vendas desativado", value: "disabled" }
                ]);
                return;
            }

            // Busca mais eficiente dos painéis
            const searchId = interaction.options.getString("id")?.toLowerCase() || "";
            const allPanels = dbPanels.all();

            // Filtra os painéis diretamente sem operações desnecessárias
            const filteredPanels = allPanels
                .filter(panel => panel.ID.toLowerCase().includes(searchId))
                .slice(0, 25)
                .map(panel => ({
                    name: `ID: ${panel.ID} | Produtos: ${Object.keys(panel.data.products).length}`,
                    value: panel.ID
                }));

            await interaction.respond(filteredPanels);
        } catch (error) {
            console.error("Erro no autocomplete:", error);
            // Tenta responder com uma mensagem de erro em caso de falha
            try {
                await interaction.respond([
                    { name: "Erro ao carregar sugestões", value: "error" }
                ]);
            } catch (e) {
                // Ignora erro adicional se a interação já expirou
            }
        }
    },

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        const umEmoji = `<:um:${dbe.get('um')}>`;
        const doisEmoji = `<:dois:${dbe.get('dois')}>`;
        const tresEmoji = `<:tres:${dbe.get('tres')}>`;
        const quatroEmoji = `<:quatro:${dbe.get('quatro')}>`;
        const cincoEmoji = `<:cinco:${dbe.get('cinco')}>`;
        const seisEmoji = `<:seis:${dbe.get('seis')}>`;
        const seteEmoji = `<:sete:${dbe.get('sete')}>`;
        const oitoEmoji = `<:oito:${dbe.get('oito')}>`;

        //let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        let name = interaction.customId == 'configVendas' ? 'Vendas' : 'Ticket';
        //if (type?.Vendas?.status !== true) {
           // interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
          //  return
       // }

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

        const idPanel = interaction.options.getString("id")

        if (!dbPanels.has(idPanel)) {
            await interaction.reply({
                content: `❌ | ID do painel: **${idPanel}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            })
            return;
        }

        const rowPanel = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`configEmbed`).setLabel(`Configurar Embed`).setEmoji(`<a:emoji_16:1235789393961287711>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`configProducts`).setLabel(`Configurar Produtos`).setEmoji(`<:carrinho:1236021394610061352>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                new ButtonBuilder().setCustomId(`deletePanel`).setLabel(`DELETAR`).setEmoji(`<:lixo:1236083085636796416>`).setStyle(`Danger`)
            )

        const embedPanel = new EmbedBuilder()
            .setTitle(`${client.user.username} | Configurando Painel`)
            .setDescription(`**⚙ | Gerencie o painel utilizando as opções/botões abaixo.**`)
            .setColor(colorC !== "none" ? colorC : "#460580")
            .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() })

        await interaction.reply({
            embeds: [embedPanel],
            components: [rowPanel]
        }).then(async (msg) => {
            const filter = (m) => m.user.id == interaction.user.id;
            const collectorConfig = msg.createMessageComponentCollector({
                filter: filter,
                time: 600000
            })
            collectorConfig.on("collect", async (iConfig) => {
                if (iConfig.customId == `configEmbed`) {
                    await iConfig.deferUpdate()

                    const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                    const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                    const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                    const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                    const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                    const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                    const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                    const rowPanelEmbed1 = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                .setOptions(
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                )
                        )

                    const rowPanelEmbed2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                            new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                        )

                    const embedPanelEmbed = new EmbedBuilder()
                        .setTitle(`Título: ${titleP}`)
                        .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                        .setColor(colorC !== "none" ? colorC : "#460580")
                        .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                    await interaction.editReply({
                        embeds: [embedPanelEmbed],
                        components: [rowPanelEmbed1, rowPanelEmbed2]
                    }).then(async (msgPanelEmbed) => {
                        const filter = (m) => m.user.id == interaction.user.id;
                        const collectorPanelEmbed = msgPanelEmbed.createMessageComponentCollector({
                            filter: filter,
                            time: 600000
                        })
                        collectorPanelEmbed.on("collect", async (iPanelEmbed) => {
                            if (iPanelEmbed.customId == `changesConfigPanelEmbed`) {
                                await interaction.editReply({
                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                })

                                const valueId = iPanelEmbed.values[0];

                                if (valueId == `changeTitle`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalTitle-${idPanel}`)
                                        .setTitle(`🛠 | Título da Embed`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Novo Título:`)
                                        .setMaxLength(38)
                                        .setPlaceholder(`Insira um título para a embed ...`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)

                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalTitle-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()
                                                    .replace(/[*_~`]|^>+/g, ``)

                                                await dbPanels.set(`${idPanel}.embed.title`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeDescription`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalDesc-${idPanel}`)
                                        .setTitle(`🛠 | Descrição da Embed`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Nova Descrição:`)
                                        .setMaxLength(1800)
                                        .setPlaceholder(`Insira uma descrição para a embed ...`)
                                        .setRequired(true)
                                        .setStyle(`Paragraph`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)

                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalDesc-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()
                                                // .replace(/[*_~`]|^>+/g, ``)

                                                await dbPanels.set(`${idPanel}.embed.description`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeFooter`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalFooter-${idPanel}`)
                                        .setTitle(`🛠 | Rodapé da Embed`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Novo Rodapé:`)
                                        .setMaxLength(48)
                                        .setPlaceholder(`Digite "remover" para remover o atual`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)

                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalFooter-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()
                                                    .replace(/[*_~`]|^>+/g, ``)

                                                if (infoInserted == `remover`) {
                                                    await dbPanels.set(`${idPanel}.embed.footer`, `none`)

                                                    const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                    const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                    const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                    const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                    const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                    const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                    const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                    const rowPanelEmbed1 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                                .setOptions(
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                                )
                                                        )

                                                    const rowPanelEmbed2 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                            new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                        )

                                                    const embedPanelEmbed = new EmbedBuilder()
                                                        .setTitle(`Título: ${titleP}`)
                                                        .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                        .setColor(colorC !== "none" ? colorC : "#460580")
                                                        .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                    await interaction.editReply({
                                                        embeds: [embedPanelEmbed],
                                                        components: [rowPanelEmbed1, rowPanelEmbed2]
                                                    })
                                                    return;
                                                }

                                                await dbPanels.set(`${idPanel}.embed.footer`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changePlaceholder`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalPlaceholder-${idPanel}`)
                                        .setTitle(`🛠 | Placeholder`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Novo Placeholder:`)
                                        .setMaxLength(48)
                                        .setPlaceholder(`Insira um placeholder para o select menu ...`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalPlaceholder-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()
                                                    .replace(/[*_~`]|^>+/g, ``)

                                                await dbPanels.set(`${idPanel}.selectMenu.placeholder`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeColor`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalColor-${idPanel}`)
                                        .setTitle(`🛠 | Cor da Embed`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Nova Cor:`)
                                        .setMaxLength(7)
                                        .setPlaceholder(`Digite "remover" para remover a atual`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalColor-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                if (infoInserted == `remover`) {
                                                    await dbPanels.set(`${idPanel}.embed.color`, `none`)

                                                    const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                    const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                    const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                    const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                    const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                    const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                    const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                    const rowPanelEmbed1 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                                .setOptions(
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                                )
                                                        )

                                                    const rowPanelEmbed2 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                            new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                        )

                                                    const embedPanelEmbed = new EmbedBuilder()
                                                        .setTitle(`Título: ${titleP}`)
                                                        .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                        .setColor(colorC !== "none" ? colorC : "#460580")
                                                        .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                    await interaction.editReply({
                                                        embeds: [embedPanelEmbed],
                                                        components: [rowPanelEmbed1, rowPanelEmbed2]
                                                    })
                                                    return;
                                                }

                                                const colorRegex = /^#[0-9A-Fa-f]{6}$/;
                                                if (!colorRegex.test(infoInserted)) {
                                                    await iModal.followUp({
                                                        content: `❌ | Formato de cor inválido.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })

                                                    return;
                                                }

                                                await dbPanels.set(`${idPanel}.embed.color`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeBanner`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalBanner-${idPanel}`)
                                        .setTitle(`🛠 | Banner da Embed`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Novo Banner:`)
                                        .setMaxLength(280)
                                        .setPlaceholder(`Digite "remover" para remover o atual`)
                                        .setRequired(true)
                                        .setStyle(`Paragraph`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalBanner-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                if (infoInserted == `remover`) {
                                                    await dbPanels.set(`${idPanel}.embed.bannerUrl`, `none`)

                                                    const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                    const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                    const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                    const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                    const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                    const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                    const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                    const rowPanelEmbed1 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                                .setOptions(
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                                )
                                                        )

                                                    const rowPanelEmbed2 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                            new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                        )

                                                    const embedPanelEmbed = new EmbedBuilder()
                                                        .setTitle(`Título: ${titleP}`)
                                                        .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                        .setColor(colorC !== "none" ? colorC : "#460580")
                                                        .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                    await interaction.editReply({
                                                        embeds: [embedPanelEmbed],
                                                        components: [rowPanelEmbed1, rowPanelEmbed2]
                                                    })
                                                    return;
                                                }

                                                if (!url.parse(infoInserted).protocol || !url.parse(infoInserted).hostname) {
                                                    await iModal.followUp({
                                                        content: `❌ | O URL inserido não é válido.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                await dbPanels.set(`${idPanel}.embed.bannerUrl`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeThumbnail`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalThumbnail-${idPanel}`)
                                        .setTitle(`🛠 | Miniatura da Embed`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`Nova Miniatura:`)
                                        .setMaxLength(280)
                                        .setPlaceholder(`Digite "remover" para remover a atual`)
                                        .setRequired(true)
                                        .setStyle(`Paragraph`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelEmbed.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalThumbnail-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                if (infoInserted == `remover`) {
                                                    await dbPanels.set(`${idPanel}.embed.thumbUrl`, `none`)

                                                    const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                    const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                    const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                    const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                    const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                    const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                    const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                    const rowPanelEmbed1 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                                .setOptions(
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                                )
                                                        )

                                                    const rowPanelEmbed2 = new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                            new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                        )

                                                    const embedPanelEmbed = new EmbedBuilder()
                                                        .setTitle(`Título: ${titleP}`)
                                                        .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                        .setColor(colorC !== "none" ? colorC : "#460580")
                                                        .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                    await interaction.editReply({
                                                        embeds: [embedPanelEmbed],
                                                        components: [rowPanelEmbed1, rowPanelEmbed2]
                                                    })
                                                    return;
                                                }

                                                if (!url.parse(infoInserted).protocol || !url.parse(infoInserted).hostname) {
                                                    await iModal.followUp({
                                                        content: `❌ | O URL inserido não é válido.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })

                                                    return;
                                                }

                                                await dbPanels.set(`${idPanel}.embed.thumbUrl`, infoInserted)

                                                const titleP = await dbPanels.get(`${idPanel}.embed.title`)
                                                const descriptionP = await dbPanels.get(`${idPanel}.embed.description`)
                                                const colorP = await dbPanels.get(`${idPanel}.embed.color`)
                                                const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`)
                                                const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`)
                                                const footerP = await dbPanels.get(`${idPanel}.embed.footer`)

                                                const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`)

                                                const rowPanelEmbed1 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder().setCustomId(`changesConfigPanelEmbed`).setPlaceholder(`Selecione uma opção (Embed)`)
                                                            .setOptions(
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Título`).setEmoji(`⚙`).setDescription(`Altere o título da embed.`).setValue(`changeTitle`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Descrição`).setEmoji(`⚙`).setDescription(`Altere a descrição da embed.`).setValue(`changeDescription`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Rodapé`).setEmoji(`⚙`).setDescription(`Altere o rodapé (footer) da embed.`).setValue(`changeFooter`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Placeholder`).setEmoji(`⚙`).setDescription(`Altere o placeholder do select menu.`).setValue(`changePlaceholder`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Cor da Embed`).setEmoji(`⚙`).setDescription(`Altere a cor da embed.`).setValue(`changeColor`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Banner`).setEmoji(`⚙`).setDescription(`Altere a banner da embed.`).setValue(`changeBanner`),
                                                                new StringSelectMenuOptionBuilder().setLabel(`Alterar Miniatura`).setEmoji(`⚙`).setDescription(`Altere a miniatura da embed.`).setValue(`changeThumbnail`),
                                                            )
                                                    )

                                                const rowPanelEmbed2 = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                                                        new ButtonBuilder().setCustomId(`previousPanelEmbed`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                                    )

                                                const embedPanelEmbed = new EmbedBuilder()
                                                    .setTitle(`Título: ${titleP}`)
                                                    .setDescription(`**📜 | Descrição:**\n${descriptionP}\n\n**🖌 | Cor Embed:** ${colorP != "none" ? colorP : "\`Não configurado(a).\`"}\n**🔎 | Placeholder:** ${placeholderP}\n**🖼 | Banner:** ${bannerP != "none" ? `[Link da Imagem](${bannerP})` : "\`Não configurado(a).\`"}\n**🖼 | Miniatura:** ${thumbP != "none" ? `[Link da Imagem](${thumbP})` : "\`Não configurado(a).\`"}`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Rodapé: ${footerP != "none" ? footerP : "Sem Rodapé"}` })

                                                await interaction.editReply({
                                                    embeds: [embedPanelEmbed],
                                                    components: [rowPanelEmbed1, rowPanelEmbed2]
                                                })
                                            }
                                        }
                                    })
                                }
                            }

                            if (iPanelEmbed.customId == `previousPanelEmbed`) {
                                await iPanelEmbed.deferUpdate()

                                await interaction.editReply({
                                    embeds: [embedPanel],
                                    components: [rowPanel]
                                })

                                await collectorPanelEmbed.stop()
                            }
                        })
                    })
                }

                if (iConfig.customId == `configProducts`) {
                    await iConfig.deferUpdate()

                    const rowPanelProducts1 = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder().setCustomId(`changesConfigPanelProducts`).setPlaceholder(`Selecione uma opção (Produtos)`)
                                .setOptions(
                                    new StringSelectMenuOptionBuilder().setLabel(`Adicionar Produto`).setEmoji(`➕`).setDescription(`Adicione mais produtos no painel.`).setValue(`addProduct`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Remover Produto`).setEmoji(`➖`).setDescription(`Remova produtos do painel.`).setValue(`removeProduct`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Sequência`).setEmoji(`🔎`).setDescription(`Altere a sequência de um produto.`).setValue(`changeSequence`),
                                    new StringSelectMenuOptionBuilder().setLabel(`Alterar Emoji`).setEmoji(`🪐`).setDescription(`Altere o emoji de um produto no painel.`).setValue(`changeEmoji`),
                                )
                        )

                    const rowPanelProducts2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`updateMsg`).setLabel(`Atualizar Mensagem`).setEmoji(`<a:load:1236018971363381248>`).setStyle(`Primary`),
                            new ButtonBuilder().setCustomId(`previousPanelProducts`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                        )

                    let allProducts = [];
                    await Promise.all(
                        dbPanels.all().filter((panel) => panel.ID == idPanel)
                            .map(async (panel) => {
                                Object.keys(panel.data.products)
                                    .map(async (product, index) => {
                                        const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)

                                        allProducts.push(`${emojiP} | **__${index + 1}°__** - 📦 | **ID:** ${product}`)
                                    })
                            })
                    )

                    const embedPanelProducts = new EmbedBuilder()
                        .setTitle(`${client.user.username} | Produto(s)`)
                        .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                        .setColor(colorC !== "none" ? colorC : "#460580")
                        .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                    await interaction.editReply({
                        embeds: [embedPanelProducts],
                        components: [rowPanelProducts1, rowPanelProducts2]
                    }).then(async (msgPanelEmbed) => {
                        const filter = (m) => m.user.id == interaction.user.id;
                        const collectorPanelProducts = msgPanelEmbed.createMessageComponentCollector({
                            filter: filter,
                            time: 600000
                        })
                        collectorPanelProducts.on("collect", async (iPanelProducts) => {
                            if (iPanelProducts.customId == `changesConfigPanelProducts`) {
                                await interaction.editReply({
                                    components: [rowPanelProducts1, rowPanelProducts2]
                                })

                                const valueId = iPanelProducts.values[0];

                                if (valueId == `addProduct`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalAddProduct-${idPanel}`)
                                        .setTitle(`➕ | Adicionar Produto`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`ID do Produto:`)
                                        .setMaxLength(28)
                                        .setPlaceholder(`Insira o ID do produto que será adicionado ...`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelProducts.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalAddProduct-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                if (!dbProducts.has(infoInserted)) {
                                                    await iModal.followUp({
                                                        content: `❌ | ID do produto: **${infoInserted}** não foi encontrado.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const checkProductPanel = await dbPanels.get(`${idPanel}.products.${infoInserted}`)
                                                if (checkProductPanel) {
                                                    await iModal.followUp({
                                                        content: `❌ | Este produto já está setado no painel.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const panelProducts = await dbPanels.get(`${idPanel}.products`)
                                                if (Object.values(panelProducts).length == 20) {
                                                    await iModal.followUp({
                                                        content: `❌ | Não é possível adicionar mais de **20** produtos em um painel.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                await dbPanels.set(`${idPanel}.products.${infoInserted}.id`, infoInserted)
                                                await dbPanels.set(`${idPanel}.products.${infoInserted}.emoji`, `🛒`)

                                                let allProducts = [];
                                                await Promise.all(
                                                    dbPanels.all().filter((panel) => panel.ID == idPanel)
                                                        .map(async (panel) => {
                                                            Object.keys(panel.data.products)
                                                                .map(async (product, index) => {
                                                                    const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)
                                                                    allProducts.push(`${emojiP} | **__${index + 1}°__** - 📦 | **ID:** ${product}`)
                                                                })
                                                        })
                                                )

                                                const embedPanelProducts = new EmbedBuilder()
                                                    .setTitle(`${client.user.username} | Produto(s)`)
                                                    .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                                                await interaction.editReply({
                                                    embeds: [embedPanelProducts],
                                                    components: [rowPanelProducts1, rowPanelProducts2]
                                                })

                                                await iModal.followUp({
                                                    content: `✅ | Produto ID: **${infoInserted}** adicionado com sucesso ao painel.`,
                                                    flags: MessageFlags.Ephemeral
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `removeProduct`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalRemoveProduct-${idPanel}`)
                                        .setTitle(`➕ | Remover Produto`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`ID do Produto:`)
                                        .setMaxLength(28)
                                        .setPlaceholder(`Insira o ID do produto que será removido ...`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelProducts.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalRemoveProduct-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                if (!dbProducts.has(infoInserted)) {
                                                    await iModal.followUp({
                                                        content: `❌ | ID do produto: **${infoInserted}** não foi encontrado.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const checkProductPanel = await dbPanels.get(`${idPanel}.products.${infoInserted}`)
                                                if (!checkProductPanel) {
                                                    await iModal.followUp({
                                                        content: `❌ | Este produto não está setado no painel.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                dbPanels.delete(`${idPanel}.products.${infoInserted}`)

                                                let allProducts = [];
                                                await Promise.all(
                                                    dbPanels.all().filter((panel) => panel.ID == idPanel)
                                                        .map(async (panel) => {
                                                            Object.keys(panel.data.products)
                                                                .map(async (product, index) => {
                                                                    const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)
                                                                    allProducts.push(`${emojiP} | **__${index + 1}°__** - 📦 | **ID:** ${product}`)
                                                                })
                                                        })
                                                )

                                                const embedPanelProducts = new EmbedBuilder()
                                                    .setTitle(`${client.user.username} | Produto(s)`)
                                                    .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                                                await interaction.editReply({
                                                    embeds: [embedPanelProducts],
                                                    components: [rowPanelProducts1, rowPanelProducts2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeSequence`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalSequenceProduct-${idPanel}`)
                                        .setTitle(`🔂 | Sequência`)

                                    const input1 = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`ID do Produto:`)
                                        .setMaxLength(28)
                                        .setPlaceholder(`Insira o ID do produto que será removido ...`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const input2 = new TextInputBuilder()
                                        .setCustomId('newInfoText2')
                                        .setLabel(`Número da Posição:`)
                                        .setMaxLength(2)
                                        .setPlaceholder(`Insira o número da nova posição/linha ...\nExemplo: 2`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput1 = new ActionRowBuilder()
                                        .addComponents(input1)

                                    const iInput2 = new ActionRowBuilder()
                                        .addComponents(input2)

                                    modal.addComponents(iInput1, iInput2)
                                    await iPanelProducts.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalSequenceProduct-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted1 = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                const infoInserted2 = iModal.fields.getTextInputValue(`newInfoText2`)
                                                    .trim()

                                                if (!dbProducts.has(infoInserted1)) {
                                                    await iModal.followUp({
                                                        content: `❌ | ID do produto: **${infoInserted1}** não foi encontrado.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const checkProductPanel = await dbPanels.get(`${idPanel}.products.${infoInserted1}`)
                                                if (!checkProductPanel) {
                                                    await iModal.followUp({
                                                        content: `❌ | Este produto não está setado no painel.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                if (isNaN(infoInserted2)) {
                                                    await iModal.followUp({
                                                        content: `❌ | A posição inserida não é um número válido.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const panelProducts = await dbPanels.get(`${idPanel}.products`)
                                                if (Number(infoInserted2) - 1 < 0 || Number(infoInserted2) - 1 >= Object.keys(panelProducts).length) {
                                                    await iModal.followUp({
                                                        content: `❌ | A posição inserida é inexistente.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const keys = Object.keys(panelProducts)
                                                const currentProduct = panelProducts[infoInserted1];

                                                delete panelProducts[infoInserted1];

                                                const reorderedProducts = {}
                                                let position = 0;
                                                for (const key of keys) {
                                                    if (position == Number(infoInserted2) - 1) {
                                                        reorderedProducts[infoInserted1] = currentProduct;
                                                    }
                                                    if (key != infoInserted1) {
                                                        reorderedProducts[key] = panelProducts[key];
                                                    }
                                                    position++;
                                                }

                                                if (Number(infoInserted2) - 1 == keys.length) {
                                                    reorderedProducts[infoInserted1] = currentProduct;
                                                }

                                                await dbPanels.set(`${idPanel}.products`, reorderedProducts)

                                                let allProducts = [];
                                                await Promise.all(
                                                    dbPanels.all().filter((panel) => panel.ID == idPanel)
                                                        .map(async (panel) => {
                                                            Object.keys(panel.data.products)
                                                                .map(async (product, index) => {
                                                                    const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)

                                                                    allProducts.push(`${emojiP} | **__${index + 1}°__** - 📦 | **ID:** ${product}`)
                                                                })
                                                        })
                                                )

                                                const embedPanelProducts = new EmbedBuilder()
                                                    .setTitle(`${client.user.username} | Produto(s)`)
                                                    .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                                    .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                                                await interaction.editReply({
                                                    embeds: [embedPanelProducts],
                                                    components: [rowPanelProducts1, rowPanelProducts2]
                                                })
                                            }
                                        }
                                    })
                                }

                                if (valueId == `changeEmoji`) {
                                    const modal = new ModalBuilder()
                                        .setCustomId(`modalEmojiProduct-${idPanel}`)
                                        .setTitle(`🛠 | Emoji`)

                                    const input = new TextInputBuilder()
                                        .setCustomId('newInfoText')
                                        .setLabel(`ID do Produto:`)
                                        .setMaxLength(28)
                                        .setPlaceholder(`Insira o ID do produto que será editado ...`)
                                        .setRequired(true)
                                        .setStyle(`Short`)

                                    const iInput = new ActionRowBuilder()
                                        .addComponents(input)

                                    modal.addComponents(iInput)
                                    await iPanelProducts.showModal(modal)

                                    client.once("interactionCreate", async (iModal) => {
                                        if (iModal.isModalSubmit()) {
                                            if (iModal.customId == `modalEmojiProduct-${idPanel}`) {
                                                await iModal.deferUpdate()

                                                const infoInserted = iModal.fields.getTextInputValue(`newInfoText`)
                                                    .trim()

                                                if (!dbProducts.has(infoInserted)) {
                                                    await iModal.followUp({
                                                        content: `❌ | ID do produto: **${infoInserted}** não foi encontrado.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const checkProductPanel = await dbPanels.get(`${idPanel}.products.${infoInserted}`)
                                                if (!checkProductPanel) {
                                                    await iModal.followUp({
                                                        content: `❌ | Este produto não está setado no painel.`,
                                                        flags: MessageFlags.Ephemeral
                                                    })
                                                    return;
                                                }

                                                const emojiP = await dbPanels.get(`${idPanel}.products.${infoInserted}.emoji`)
                                                await interaction.editReply({
                                                    embeds: [new EmbedBuilder()
                                                        .setTitle(`${client.user.username} | Novo Emoji`)
                                                        .setDescription(`Reaja a esta mensagem com o novo emoji. Atualmente: (${emojiP})`)
                                                        .setColor(colorC !== "none" ? colorC : "#460580")
                                                        .setFooter({ text: `Você tem 2 minutos para reagir a esta mensagem.` })
                                                    ],
                                                    components: [new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder()
                                                                .setCustomId(`cancelEditEmoji-${idPanel}`).setLabel(`Cancelar`).setEmoji(`<a:reddot:1236019332706992288>`).setStyle(`Danger`)
                                                        )
                                                    ]
                                                }).then(async (msgEditEmoji) => {
                                                    const collectorFilter = (reaction, user) => {
                                                        return user.id == interaction.user.id;
                                                    }

                                                    const collectorEmoji = msgEditEmoji.createReactionCollector({
                                                        filter: collectorFilter,
                                                        max: 1,
                                                        time: 120000 // 2 minutos
                                                    })
                                                    collectorEmoji.on("collect", async (iReaction) => {
                                                        await msgEditEmoji.reactions.removeAll()

                                                        let emojiName = iReaction.emoji.id || iReaction.emoji.toString()
                                                        let emojiId = iReaction.emoji.id;

                                                        await dbPanels.set(`${idPanel}.products.${infoInserted}.emoji`, emojiName)

                                                        await interaction.followUp({
                                                            content: `✅ | O emoji foi modificado para: ${emojiName}`,
                                                            flags: MessageFlags.Ephemeral
                                                        })

                                                        if (iReaction.emoji instanceof Discord.GuildEmoji) {
                                                            if (iReaction.emoji.animated) {
                                                                emojiName = `<a:${iReaction.emoji.name}:${emojiId}>`;
                                                            } else {
                                                                emojiName = `<:${iReaction.emoji.name}:${emojiId}>`;
                                                            }
                                                        }

                                                        let allProducts = [];
                                                        await Promise.all(
                                                            dbPanels.all().filter((panel) => panel.ID == idPanel)
                                                                .map(async (panel) => {
                                                                    Object.keys(panel.data.products)
                                                                        .map(async (product, index) => {
                                                                            const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)
                                                                            allProducts.push(`${emojiP} | **__${index + 1}°__** - ${product}`)
                                                                        })
                                                                })
                                                        )

                                                        const embedPanelProducts = new EmbedBuilder()
                                                            .setTitle(`${client.user.username} | Produto(s)`)
                                                            .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                                                            .setColor(colorC !== "none" ? colorC : "#460580")
                                                            .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                                                        await interaction.editReply({
                                                            embeds: [embedPanelProducts],
                                                            components: [rowPanelProducts1, rowPanelProducts2]
                                                        })
                                                    })

                                                    collectorEmoji.on("end", async (c, r) => {
                                                        if (r == "time") {
                                                            let allProducts = [];
                                                            await Promise.all(
                                                                dbPanels.all().filter((panel) => panel.ID == idPanel)
                                                                    .map(async (panel) => {
                                                                        Object.keys(panel.data.products)
                                                                            .map(async (product, index) => {
                                                                                const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)

                                                                                allProducts.push(`${emojiP} | **__${index + 1}°__** - 📦 | **ID:** ${product}`)
                                                                            })

                                                                    })
                                                            )

                                                            const embedPanelProducts = new EmbedBuilder()
                                                                .setTitle(`${client.user.username} | Produto(s)`)
                                                                .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                                                                .setColor(colorC !== "none" ? colorC : "#460580")
                                                                .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                                                            await interaction.editReply({
                                                                embeds: [embedPanelProducts],
                                                                components: [rowPanelProducts1, rowPanelProducts2]
                                                            })
                                                        }
                                                    })

                                                    try {
                                                        const collectorFilter = (i) => i.user.id == interaction.user.id;
                                                        const iAwait = await msg.awaitMessageComponent({ filter: collectorFilter, time: 120000 })

                                                        if (iAwait.customId == `cancelEditEmoji-${idPanel}`) {
                                                            await iAwait.deferUpdate()

                                                            let allProducts = [];
                                                            await Promise.all(
                                                                dbPanels.all().filter((panel) => panel.ID == idPanel)
                                                                    .map(async (panel) => {
                                                                        Object.keys(panel.data.products)
                                                                            .map(async (product, index) => {
                                                                                const emojiP = await dbPanels.get(`${idPanel}.products.${product}.emoji`)
                                                                                allProducts.push(`${emojiP} | **__${index + 1}°__** - 📦 | **ID:** ${product}`)
                                                                            })
                                                                    })
                                                            )

                                                            const embedPanelProducts = new EmbedBuilder()
                                                                .setTitle(`${client.user.username} | Produto(s)`)
                                                                .setDescription(allProducts.join(`\n`) || `Sem produtos. Adicione!`)
                                                                .setColor(colorC !== "none" ? colorC : "#460580")
                                                                .setFooter({ text: `Gerencie os produtos do painel utilizando as opções/botões abaixo.`, iconURL: client.user.avatarURL() })

                                                            await interaction.editReply({
                                                                embeds: [embedPanelProducts],
                                                                components: [rowPanelProducts1, rowPanelProducts2]
                                                            })

                                                            await collectorEmoji.stop()
                                                        }
                                                    } catch (err) {
                                                        return;
                                                    }
                                                })
                                            }
                                        }
                                    })
                                }
                            }

                            if (iPanelProducts.customId == `previousPanelProducts`) {
                                await iPanelProducts.deferUpdate()

                                await interaction.editReply({
                                    embeds: [embedPanel],
                                    components: [rowPanel]
                                })

                                await collectorPanelProducts.stop()
                            }
                        })
                    })
                }

                if (iConfig.customId == `updateMsg`) {
                    let teste = await iConfig.reply({
                        content: `⚙ | Atualizando mensagem ...`,
                        embeds: [],
                        components: []
                    })

                    try {
                        UpdateMsgs(client, null)
                        UpdateSelects(client, null)

                        let channelMsg = await dbPanels.get(`${idPanel}.channel`)

                        await iConfig.editReply({
                            content: `✅ | Mensagem atualizada com sucesso no canal ${channelMsg}.`,
                            flags: MessageFlags.Ephemeral
                        })
                    } catch (err) {
                        console.error(err.message, err.stack)
                    }
                }

                if (iConfig.customId == `deletePanel`) {
                    const modal = new ModalBuilder()
                        .setCustomId(`modalConfirm-${idPanel}`)
                        .setTitle(`📝 | ${idPanel}`)

                    const inputConfirm = new TextInputBuilder()
                        .setCustomId('confirmText')
                        .setLabel(`Escreva "SIM" para continuar:`)
                        .setMaxLength(3)
                        .setPlaceholder(`SIM`)
                        .setRequired(true)
                        .setStyle(`Paragraph`)

                    const iConfirm = new ActionRowBuilder().addComponents(inputConfirm)

                    modal.addComponents(iConfirm)
                    await iConfig.showModal(modal)

                    client.once("interactionCreate", async (iModal) => {
                        if (iModal.customId == `modalConfirm-${idPanel}`) {
                            await iModal.deferUpdate()

                            const insertedText = iModal.fields.getTextInputValue(`confirmText`)
                                .toLowerCase()

                            if (insertedText == `sim`) {
                                dbPanels.delete(idPanel)

                                await interaction.editReply({
                                    content: ``,
                                    embeds: [new EmbedBuilder()
                                        .setTitle(`${client.user.username} | Painel Excluido`)
                                        .setDescription(`✅ | Painel: **${idPanel}** deletado com sucesso.`)
                                        .setColor(`Green`)
                                    ],
                                    components: []
                                })
                                await collectorConfig.stop()
                            }
                        }
                    })
                }
            })

            collectorConfig.on("end", async (c, r) => {
                if (r == "time") {
                    await interaction.editReply({
                        content: `⚙ | Use o comando novamente.`,
                        embeds: [],
                        components: []
                    })
                }
            })
        })
    },
}