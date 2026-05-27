const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, ActivityType, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require("discord.js")
const axios = require("axios")
const url = require("node:url")

const { JsonDatabase } = require("wio.db")
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });


async function StartAll(client, interaction) {
    const image = `https://public-blob.squarecloud.dev/1057518718378324009/bannernevermiss_m9n255ii-c1a0.png`;

    const components = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`configVendas`).setLabel(`Vendas`).setEmoji(`<:cart:1371936077559894237>`).setStyle(1), //<:home:1334618559447568426>
        new ButtonBuilder().setCustomId(`configticket`).setLabel(`Ticket`).setEmoji(`<:1225477547630788648:1289647471965900843>`).setStyle(1),
        new ButtonBuilder().setCustomId(`configBemvindo`).setLabel(`Boas vindas`).setEmoji(`<:bell:1334638906544492645>`).setStyle(1),
        new ButtonBuilder().setCustomId(`configAutomaticas`).setLabel(`Ações Automáticas`).setEmoji(`<:mais:1334665468736438313>`).setStyle(2),
    );

    const components2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`configbot`).setLabel(`Personalização`).setEmoji(`<:cor:1334663672949112885>`).setStyle(1),
        new ButtonBuilder().setCustomId(`rendimentosBot`).setLabel(`Rendimentos`).setEmoji(`<:banco:1334665466425114705>`).setStyle(3),
        new ButtonBuilder().setCustomId(`e-salesPainel`).setLabel(`e-Sales`).setEmoji(`<:wallet:1371950748107145297>`).setStyle(2).setDisabled(true),
        new ButtonBuilder().setCustomId(`configModeracao`).setLabel(`Moderação`).setEmoji(`<:1289362293456633942:1364987313750282251>`).setStyle(4),
    );

    // Verifica o tipo da interação e responde adequadamente
    if (interaction.isButton() || interaction.isSelectMenu()) {
        await interaction.update({
            components: [components, components2],
            files: [image],
            embeds: []
        });
    } else {
        await interaction.editReply({
            components: [components, components2],
            files: [image],
            embeds: []
        });
    }
}




async function botConfigTickets(client, interaction) {
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    interaction.update({
        files: [],
        embeds: [
            new EmbedBuilder()
                .setTitle(`Configuração Sistemas Automáticos`)
                .setDescription(`Selecione um dos botões abaixo para configurar o seu bot!`)
                .setColor(dbConfigs.get(`color`) || "Default")
        ], components: [
            new ActionRowBuilder()
                .addComponents(
                    //new ButtonBuilder().setStyle(2).setCustomId(`configbot`).setLabel(`Configurar Bot`).setEmoji(`<:gerenciar:1239447347055034421>`),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`configticket`)
                        .setLabel(`Configurar Ticket`)
                        .setEmoji(`<:1166960895201656852:1239447582464282674>`),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`configsugestsistem`)
                        .setLabel(`Configurar Sistema Sugestão`)
                        .setEmoji(`<:comentario:1245612394634543134>`)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`voltarconfiginicio`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1)
                )

        ]
    })
}

module.exports = {
    botConfigTickets,
    StartAll
};