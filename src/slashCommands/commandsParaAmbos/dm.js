const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { MessageFlags, EmbedBuilder } = require("discord.js");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const { getCache } = require("../../../Functions/connect_api");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("dm")
        .setDescription("Envie uma mensagem privada para algum usuário!")
        .addUserOption(opUser => opUser
            .setName(`usuário`)
            .setDescription(`Usuário que irá receber a DM`)
            .setRequired(true)
        )
        .addStringOption(opString => opString
            .setName(`mensagem`)
            .setDescription(`Mensagem que será enviada`)
            .setMaxLength(1800)
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

        const userSelected = interaction.options.getUser(`usuário`);
        const msgInserted = interaction.options.getString(`mensagem`);

        await userSelected.send(msgInserted)
            .then(async (msg) => {
                await interaction.reply({
                    content: `✅ | Mensagem enviada com sucesso para o usuário ${userSelected}.`,
                    flags: MessageFlags.Ephemeral
                });
            }).catch(async (err) => {
                await interaction.reply({
                    content: `❌ | Ocorreu um erro ao enviar uma mensagem privada para o usuário ${userSelected}.`,
                    flags: MessageFlags.Ephemeral
                });
            });
    },
};