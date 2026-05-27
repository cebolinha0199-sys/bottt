const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");
const { MercadoPagoConfig, PaymentRefund } = require("mercadopago");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbPurchases = new JsonDatabase({ databasePath: "./databases/dbPurchases.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reembolsar")
        .setDescription("Reembolse um pagamento pelo ID!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Pagamento")
            .setMaxLength(38)
            .setRequired(true)
        ),

    async execute(interaction, client) {
     //   let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
    //    if (type?.Vendas?.status !== true) {
     //       interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
         //   return
      //  }

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

        const paymentId = interaction.options.getString("id");
        const tokenMp = await dbConfigs.get(`vendas.payments.mpAcessToken`);
        if (tokenMp != `none`) {
            await axios.get(`https://api.mercadopago.com/v1/payments/search`, {
                headers: {
                    "Authorization": `Bearer ${tokenMp}`
                }
            }).catch(async (err) => {
                await interaction.reply({
                    content: `❌ | O Token MP que está configurado é inválido.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            });
        } else {
            await interaction.reply({
                content: `❌ | Configure um Token MP para utilizar este comando.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await interaction.reply({
            content: `🔁 | Carregando ...`,
            flags: MessageFlags.Ephemeral
        });

        const mpClient = new MercadoPagoConfig({ accessToken: tokenMp });
        const mpRefund = new PaymentRefund(mpClient);

        await mpRefund.create({
            payment_id: paymentId
        }).then(async (refund) => {
            await interaction.editReply({
                content: `✅ | Pagamento ID: **${paymentId}** reembolsado com sucesso.`,
                flags: MessageFlags.Ephemeral
            });
        }).catch(async (err) => {
            await interaction.editReply({
                content: `❌ | Ocorreu um erro ao reembolsar o Pagamento ID: **${paymentId}**.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        });
    },
};