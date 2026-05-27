const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const { JsonDatabase } = require("wio.db");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });

async function StartAll(client, interaction) {
    const image = "https://public-blob.squarecloud.dev/1057518718378324009/bannernevermiss_m9n255ii-c1a0.png";

    const components = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("configVendas").setLabel("Vendas").setEmoji("🛒").setStyle(1),
        new ButtonBuilder().setCustomId("configticket").setLabel("Ticket").setEmoji("🎫").setStyle(1),
        new ButtonBuilder().setCustomId("configBemvindo").setLabel("Boas vindas").setEmoji("🔔").setStyle(1),
        new ButtonBuilder().setCustomId("configAutomaticas").setLabel("Ações Automáticas").setEmoji("➕").setStyle(2)
    );

    const components2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("configbot").setLabel("Personalização").setEmoji("🎨").setStyle(1),
        new ButtonBuilder().setCustomId("rendimentosBot").setLabel("Rendimentos").setEmoji("🏦").setStyle(3),
        new ButtonBuilder().setCustomId("e-salesPainel").setLabel("e-Sales").setEmoji("💼").setStyle(2).setDisabled(true),
        new ButtonBuilder().setCustomId("configModeracao").setLabel("Moderação").setEmoji("🛡️").setStyle(4)
    );

    const embed = new EmbedBuilder()
        .setColor(dbConfigs.get("color") || "Default")
        .setImage(image);

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        await interaction.update({
            embeds: [embed],
            components: [components, components2],
            files: []
        });
    } else {
        await interaction.editReply({
            embeds: [embed],
            components: [components, components2],
            files: []
        });
    }
}

async function botConfigTickets(client, interaction) {
    await interaction.update({
        files: [],
        embeds: [
            new EmbedBuilder()
                .setTitle("Configuração Sistemas Automáticos")
                .setDescription("Selecione um dos botões abaixo para configurar o seu bot!")
                .setColor(dbConfigs.get("color") || "Default")
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId("configticket")
                    .setLabel("Configurar Ticket")
                    .setEmoji("🎫"),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId("configsugestsistem")
                    .setLabel("Configurar Sistema Sugestão")
                    .setEmoji("💬")
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("voltarconfiginicio")
                    .setEmoji("⬅️")
                    .setStyle(1)
            )
        ]
    });
}

module.exports = {
    botConfigTickets,
    StartAll
};