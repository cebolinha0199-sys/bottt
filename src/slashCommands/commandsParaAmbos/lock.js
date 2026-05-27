const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, PermissionFlagsBits } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const { JsonDatabase } = require("wio.db")
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const { getCache } = require("../../../Functions/connect_api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lock-unlock")
        .setDescription("[🔒/🔓] Trancar / Destrancar canal"),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.channel.send({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Você não tem permissão para usar este comando!` })
        }
        await interaction.reply({ content: `${dbEmojis.get(`16`)} | Aguarde um momento...` })

        const channel = interaction.channel;

        try {
            const everyoneRole = interaction.guild.roles.everyone;
            const permissions = channel.permissionOverwrites.cache.get(everyoneRole.id);

            const isLocked = permissions?.deny.has('SendMessages') || false;

            if (isLocked) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: true
                });
                await interaction.editReply(`🔓 O canal **${channel.name}** foi desbloqueado.`);
            } else {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false
                });
                await interaction.editReply(`🔒 O canal **${channel.name}** foi bloqueado.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao tentar bloquear ou desbloquear o canal.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}