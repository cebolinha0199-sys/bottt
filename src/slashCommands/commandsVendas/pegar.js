const { MessageFlags, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("node:fs");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPurchases = new JsonDatabase({ databasePath: "./databases/dbPurchases.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pegar")
        .setDescription("Mostra os itens entregues de uma compra pelo ID!")
        .addStringOption(opString => opString
            .setName(`id`)
            .setDescription(`ID do Pedido`)
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
     //   let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
    //    if (type?.Vendas?.status !== true) {
     //       interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
    //        return
    //    }

        const choices = [];

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

        const purchaseId = interaction.options.getString(`id`);
        if (!dbPurchases.has(purchaseId)) {
            await interaction.reply({
                content: `❌ | ID do pedido: **${purchaseId}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await interaction.reply({
            content: `🔁 | Carregando ...`,
            flags: MessageFlags.Ephemeral
        }).then(async (msg) => {
            const productsDelivered = await dbPurchases.get(`${purchaseId}.productsDelivered`);
            const fileName = `${purchaseId}.txt`;
            fs.writeFile(fileName, productsDelivered, (err) => {
                if (err) throw err;
            });

            const attachmentProducts = new AttachmentBuilder(fileName);
            const embedProducts = new EmbedBuilder()
                .setTitle(`Pedido (${purchaseId})`)
                .setDescription(`**📦 | Itens entregues no Arquivo TXT.**`)
                .setColor(colorC !== "none" ? colorC : "#460580")
                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

            await interaction.editReply({
                content: ``,
                embeds: [embedProducts],
                files: [attachmentProducts],
                flags: MessageFlags.Ephemeral
            }).then(async (msgEdited) => {
                fs.unlink(fileName, (err) => {
                    if (err) throw err;
                })
            })
        })
    },
}