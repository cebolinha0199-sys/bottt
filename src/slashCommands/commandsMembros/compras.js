const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageFlags, EmbedBuilder } = require("discord.js");
const { PageCompras } = require("../../../Functions/e-sales/TransacoesPage");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("compras")
        .setDescription(`[🔧] Visualizes suas compras realizadas pelo e-sales`),

    async execute(interaction, client) {
        await interaction.reply({ content: `🔄 | Carregando...`, ephemeral: true });

        let messge = await PageCompras(interaction, 1)
        if (messge.code == 1) {
            await interaction.editReply({
                content: messge.content,
                flags: MessageFlags.Ephemeral
            });
        }

        if (messge.code == 1) {
            await interaction.editReply({
                content: messge.content,
                components: messge.components,
                flags: MessageFlags.Ephemeral
            });
        }

    }
};