const { MessageFlags, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("criar-painel")
        .setDescription("Cadastre um novo painel de produtos em select menu!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Painel")
            .setMaxLength(25)
            .setRequired(true)
        )
        .addStringOption(opString => opString
            .setName("produto")
            .setDescription("Produto que será adicionado ao painel")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
     //   let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
    //    if (type?.Vendas?.status !== true) {
      //      interaction.reply({ content: `❌ | Comando desabilitado pois o sistema de vendas não está ativo.`, flags: MessageFlags.Ephemeral })
          //  return
      //  }

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

        for (const product of dbProducts.all()) {
            choices.push({
                name: `ID: ${product.ID} | Nome: ${product.data.name}`,
                value: product.ID,
            });
        };
        choices.sort((a, b) => a.value - b.value);
        const searchId = interaction.options.getString("produto");
        if (searchId) {
            const filteredChoices = choices.filter(choice => {
                return choice.value.startsWith(searchId);
            });
            await interaction.respond(
                filteredChoices.map(choice => ({ name: choice.name, value: choice.value })),
            );
        } else {
            const limitedChoices = choices.slice(0, 25);
            await interaction.respond(
                limitedChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        };
    },

    async execute(interaction, client) {
        const choices = [];
 //       let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
     //   if (type?.Vendas?.status !== true) {
      //      interaction.reply({ content: `❌ | Comando desabilitado pois o sistema de vendas não está ativo.`, flags: MessageFlags.Ephemeral })
   //         return
    //)    }

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

        const idPanel = interaction.options.getString("id");
        const idProduct = interaction.options.getString("produto");

        if (dbPanels.has(idPanel)) {
            await interaction.reply({
                content: `❌ | ID do painel: **${idPanel}** já existe.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await dbPanels.set(`${idPanel}.id`, idPanel);

        await dbPanels.set(`${idPanel}.embed.title`, `Não configurado(a).`);
        await dbPanels.set(`${idPanel}.embed.description`, `Não configurado(a).`);
        await dbPanels.set(`${idPanel}.embed.color`, `none`);
        await dbPanels.set(`${idPanel}.embed.bannerUrl`, `none`);
        await dbPanels.set(`${idPanel}.embed.thumbUrl`, `none`);
        await dbPanels.set(`${idPanel}.embed.footer`, `none`);

        await dbPanels.set(`${idPanel}.selectMenu.placeholder`, `Selecione um Produto`);

        await dbPanels.set(`${idPanel}.products.${idProduct}.id`, idProduct);
        await dbPanels.set(`${idPanel}.products.${idProduct}.emoji`, `🛒`);

        const titleP = await dbPanels.get(`${idPanel}.embed.title`);
        const descriptionP = await dbPanels.get(`${idPanel}.embed.description`);
        const colorP = await dbPanels.get(`${idPanel}.embed.color`);
        const bannerP = await dbPanels.get(`${idPanel}.embed.bannerUrl`);
        const thumbP = await dbPanels.get(`${idPanel}.embed.thumbUrl`);
        const footerP = await dbPanels.get(`${idPanel}.embed.footer`);

        const placeholderP = await dbPanels.get(`${idPanel}.selectMenu.placeholder`);
        const emojiP = await dbPanels.get(`${idPanel}.products.${idProduct}.emoji`);

        const product = await dbProducts.get(idProduct);

        const rowPanel = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(idPanel)
                    .setPlaceholder(placeholderP)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`${product.name}`)
                            .setDescription(`💸 | Preço: R$${Number(product.price).toFixed(2)} - 📦 | Estoque: ${product.stock.length}`)
                            .setEmoji(emojiP)
                            .setValue(idProduct)
                    )
            );

        const embedPanel = new EmbedBuilder()
            .setTitle(titleP)
            .setDescription(descriptionP)
            .setColor(colorP != "none" ? colorP : "#460580")
            .setThumbnail(thumbP != "none" ? thumbP : "https://sem-img.com")
            .setImage(bannerP != "none" ? bannerP : "https://sem-img.com")
            .setFooter({ text: footerP != "none" ? footerP : " " });

        const msg = await interaction.channel.send({
            embeds: [embedPanel],
            components: [rowPanel]
        });

        await dbPanels.set(`${idPanel}.msgLocalization.channelId`, interaction.channel.id);
        await dbPanels.set(`${idPanel}.msgLocalization.messageId`, msg.id);

        await interaction.reply({
            content: `✅ | Painel criado com sucesso. Utilize **/config-painel-vendas** para gerência-lo!`,
            flags: MessageFlags.Ephemeral
        });
    },
};