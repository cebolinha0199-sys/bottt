const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, AttachmentBuilder, ComponentType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase, } = require("wio.db");
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" });
const { getCache } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("[📁] Limpe o chat atual.")
        .addNumberOption(opNumber => opNumber
            .setName("quantidade")
            .setDescription("Quantidade de mensagens a ser deletada")
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const type = getCache(null, 'type');
        const dono = getCache(null, "owner");

        if (type?.Vendas?.status == false && type?.Ticket?.status == false) {
            return await interaction.editReply({
                content: `❌ | Você não possui acesso a nenhum de nossos sistemas, adquira um plano em nosso site. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`,
            });
        }

        const isVendas = (await dbPerms.get('vendas'))?.includes(interaction.user.id);
        const isTicket = (await dbPerms.get('ticket'))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isVendas && !isTicket && !isOwner) {
            return await interaction.editReply({
                content: `❌ | Você não tem permissão para usar este comando.`,
            });
        }

        let numero = Number(interaction.options.getNumber('quantidade'))
        if (isNaN(numero)) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Coloque um número válido!` })
            return;
        }
        if (numero > 2000 || numero <= 0) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | O comando só apaga entre \`0 - 2000\` mensagens!` })
            return;
        }
        let nmr2 = numero
        await interaction.reply({
            content: `${dbEmojis.get(`16`)} | Limpando chat, aguarde...`,
            flags: MessageFlags.Ephemeral
        });
        let deletedCount = 0;

        function deleteMsg() {
            let msgApagar;
            if (nmr2 > 99) {
                msgApagar = 99
            } else {
                msgApagar = nmr2
            }

            interaction.channel.bulkDelete(msgApagar).then((msg) => {
                deletedCount = deletedCount + msg.size;
                nmr2 = nmr2 - msgApagar
                if (nmr2 <= 0) {
                    interaction.editReply({
                        content: `${dbEmojis.get(`6`)} | **${deletedCount}** mensagens excluídas do chat.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                deleteMsg()
            }).catch((msg) => {
                interaction.editReply({
                    content: `${dbEmojis.get(`13`)} | Algumas mensagens são muito antigas e não foi possível apagar!.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            })
        }
        deleteMsg()
    }
}