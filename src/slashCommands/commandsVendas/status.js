const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");
const moment = require("moment");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("Verifique o status de um pagamento!")
        .addStringOption(opString => opString
            .setName(`id`)
            .setDescription(`ID do Pagamento`)
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
    //    let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
     //   if (type?.Vendas?.status !== true) {
    //        interaction.reply({ content: `❌ | Você não possui acesso a nosso módulo de **VENDAS**, adquira um em nosso site renovando seu bot. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
     //       return
     //   }

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

        const mpClient = new MercadoPagoConfig({ accessToken: tokenMp });
        const mpPayment = new Payment(mpClient);
        const paymentId = interaction.options.getString(`id`);
        await interaction.reply({
            content: `🔁 | Carregando ...`,
            flags: MessageFlags.Ephemeral
        }).then(async (msg) => {
            await mpPayment.get({ id: paymentId })
                .then(async (data) => {
                    const paymentStatus = data.status.toString()
                        .replace(`pending`, `Pendente`)
                        .replace(`approved`, `Aprovado`)
                        .replace(`authorized`, `Autorizado`)
                        .replace(`in_process`, `Em processo`)
                        .replace(`in_mediation`, `Em mediação`)
                        .replace(`rejected`, `Rejeitado`)
                        .replace(`cancelled`, `Cancelado`)
                        .replace(`refunded`, `Reembolsado`)
                        .replace(`charged_back`, `Cobrado de Volta (Charged Back)`);

                    const paymentValue = data.transaction_amount;
                    const paymentDateCreated = `<t:${Math.floor(moment(data.date_created).toDate().getTime() / 1000)}:f> (<t:${Math.floor(moment(data.date_created).toDate().getTime() / 1000)}:R>)`;
                    const embedPayment = new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                        .setTitle(`${client.user.username} | Pagamento`)
                        .addFields(
                            { name: `📝 | Status do Pagamento:`, value: `${paymentStatus}` },
                            { name: `💸 | Valor:`, value: `R$__${Number(paymentValue).toFixed(2)}__` },
                            { name: `⏰ | Pagamento criado em:`, value: `${paymentDateCreated}` }
                        )
                        .setColor(colorC !== "none" ? colorC : "#460580")
                        .setTimestamp()

                    await interaction.editReply({
                        content: ``,
                        embeds: [embedPayment],
                        flags: MessageFlags.Ephemeral
                    });

                }).catch(async (err) => {
                    await interaction.editReply({
                        content: `❌ | Ocorreu um erro! Verifique o ID inserido e tente novamente.`,
                        flags: MessageFlags.Ephemeral
                    });
                });
        });
    },
};