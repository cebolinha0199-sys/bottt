const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delproduto")
        .setDescription("Delete um produto cadastrado!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Produto")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {

        const choices = [];
   //     let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
   //     if (type?.Vendas?.status !== true) {
      //      interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
  //          return
    //    }



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
        const searchId = interaction.options.getString("id");
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
   //     let type = getCache(null, 'type')
        let name = interaction.customId == 'configVendas' ? 'Vendas' : 'Ticket';
     //   if (type?.Vendas?.status !== true) {
      //      interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
    //        return
    //    }

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === getCache(null, "owner");

        if (!isInDb && !isOwner) {
            await interaction.reply({
                content: `❌ | Você não tem permissão para usar este comando.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        const idProduct = interaction.options.getString("id");

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await interaction.reply({
            content: `🔁 | Carregando ...`,
            flags: MessageFlags.Ephemeral
        });

        const nameP = await dbProducts.get(`${idProduct}.name`);
        dbProducts.delete(idProduct);

        const allPanels = dbPanels.all();

        await Promise.all(
            allPanels.map(async (panel) => {
                const productIds = Object.keys(panel.data.products);
                for (const pId of productIds) {
                    if (pId == idProduct) {
                        dbPanels.delete(`${panel.ID}.products.${pId}`);
                    };
                };
            }),
        );
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setTitle(`${client.user.username} | Produto Excluido`)
                .setDescription(`✅ | Produto: **${nameP}** deletado com sucesso.`)
                .setColor(`Green`)
            ],
            components: [],
            flags: MessageFlags.Ephemeral
        });
    },
};