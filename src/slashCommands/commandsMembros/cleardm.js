const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cleardm")
        .setDescription(`[🔧] Limpe Minha DM (Max: 100 mensagens)`),

    async execute(interaction, client) {
        const DM = await interaction.user.createDM();
        const lastMessage = await DM.messages.fetch({ limit: 1 });
        if (lastMessage.size == 0) {
            await interaction.reply({
                content: `❌ | Não encontrei nenhuma mensagem em minha DM.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await interaction.reply({
            content: `🔁 | Limpando minha DM! Aguarde ...`,
            flags: MessageFlags.Ephemeral
        });

        const messagesToDelete = await DM.messages.fetch({ limit: 100 });
        let deletedCount = 0;
        for (const message of messagesToDelete.values()) {
            if (message.author.bot) {
                await message.delete().catch(console.error);
                deletedCount++;
            };

            await interaction.editReply({
                content: `🔁 | **${deletedCount}** mensagens apagadas ...`,
                flags: MessageFlags.Ephemeral
            });
        };

        await interaction.editReply({
            content: `✅ | Foram excluídas **${deletedCount}** mensagens em minha DM.`,
            flags: MessageFlags.Ephemeral
        });
    }
};