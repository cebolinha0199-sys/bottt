const { MessageFlags, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("node:fs");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");

const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stock-id")
        .setDescription("Veja o estoque de um produto!")
        .addStringOption(opString =>
            opString
                .setName("id")
                .setDescription("ID do Produto")
                .setMaxLength(25)
                .setAutocomplete(true)
                .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
        const dono = getCache(null, "owner");

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            choices.push({
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            });
            await interaction.respond(choices);
            return;
        }

        const products = await dbProducts.all();
        for (const product of products) {
            choices.push({
                name: `ID: ${product.ID} | Nome: ${product.data.name}`,
                value: product.ID,
            });
        }

        choices.sort((a, b) => a.value.localeCompare(b.value));

        const searchId = interaction.options.getString("id");
        const filtered = searchId
            ? choices.filter(c => c.value.toLowerCase().startsWith(searchId.toLowerCase()))
            : choices.slice(0, 25);

        await interaction.respond(filtered);
    },

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`);
        const dono = getCache(null, "owner");

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            await interaction.reply({
                content: "❌ | Você não tem permissão para usar este comando!",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const idProduct = interaction.options.getString("id");

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.reply({
            content: `🔁 | Carregando ...`,
            flags: MessageFlags.Ephemeral
        });

        const estoqueP = await dbProducts.get(`${idProduct}.stock`);
        if (!estoqueP || estoqueP.length === 0) {
            await interaction.editReply({
                content: `❌ | Este produto está sem estoque.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const nameP = await dbProducts.get(`${idProduct}.name`);

        let fileContent = "";
        for (let i = 0; i < estoqueP.length; i++) {
            fileContent += `📦 | ${nameP} - ${i + 1}/${estoqueP.length}:\n${estoqueP[i]}\n\n`;
        }

        const fileName = `${nameP}.txt`;

        fs.writeFileSync(fileName, fileContent);

        const stockAttachment = new AttachmentBuilder(fileName);

        const embedStock = new EmbedBuilder()
            .setTitle(`Estoque (${idProduct})`)
            .setDescription(`**📦 | Estoque enviado como arquivo TXT.**`)
            .setColor(colorC !== "none" ? colorC : "#460580")
            .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL()
            });

        await interaction.editReply({
            content: ``,
            embeds: [embedStock],
            files: [stockAttachment],
            flags: MessageFlags.Ephemeral
        });

        fs.unlink(fileName, (err) => {
            if (err) console.error("Erro ao remover arquivo:", err);
        });
    }
};