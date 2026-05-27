const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");
const moment = require("moment");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { JsonDatabase } = require("wio.db");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbOpenedPayments = new JsonDatabase({ databasePath: "./databases/dbOpenedPayments.json" });
const { getCache } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gerar-pix")
        .setDescription("[💰] Gerenciar uma cobrança via Pix!")
        .addStringOption(opString => opString
            .setName("ação")
            .setDescription("Selecione o que deseja fazer")
            .addChoices(
                { name: "Configurar sistema", value: "configPayments" },
                { name: "Gerar pix", value: "gerarPix" }
            )
            .setRequired(true)
        )
        .addNumberOption(opInteger => opInteger
            .setName(`valor`)
            .setDescription(`Valor do Pagamento`)
            .setMinValue(1)
            .setRequired(false)
        ),

    async execute(interaction, client) {
        const actionSelect = interaction.options.getString('ação')
        const colorC = await dbConfigs.get(`vendas.embeds.color`)

        if (actionSelect === 'configPayments') {
            var banksBloqued = '';
            dbConfigs.get(`pagamentos.blockbank`)?.map((entry, index) => { banksBloqued += `${entry}\n`; })
            if (await dbConfigs.get("agamentos.blockbank")?.length <= 0) banksBloqued = "`Nenhum Banco foi Bloqueado`";

            const sampascorin = new EmbedBuilder()
                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                .setAuthor({ name: `Configurando Pagamentos`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .addFields(
                    {
                        name: `Sistema ON/OFF:`,
                        value: `${dbConfigs.get(`pagamentos.sistema`) !== 'ON' ? '\`🔴 Desligado\`' : '\`🟢 Ligado\`'}`,
                        inline: true
                    },
                    {
                        name: `Acess Token:`,
                        value: `||${dbConfigs.get(`pagamentos.acess_token`) || `Não Definido`}||`,
                        inline: true
                    },
                    {
                        name: `Bancos Bloqueados:`,
                        value: `${banksBloqued || 'Nenhum definido'}`
                    }
                )
            const sampasrowbah = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(dbConfigs.get(`pagamentos.sistema`) === "ON" ? 3 : 4)
                        .setCustomId(`paymentsonoff`)
                        .setLabel(dbConfigs.get(`pagamentos.sistema`) === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                        .setEmoji(dbConfigs.get(`pagamentos.sistema`) === "ON" ? "<:on_mt:1232722645238288506>" : "<:off:1243274635748048937>"),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`sistema_semiauto`)
                        .setLabel(`Sistema Semiauto`)
                        .setEmoji(`<:Pix:1239447475035570246>`),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`alterar_acesstoken`)
                        .setLabel(`Alterar Acess Token`)
                        .setEmoji(`<:emoji_mp:1242924437351698432>`),
                    new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId(`alterar_blockbank`)
                        .setLabel(`Bloquear Bancos`)
                        .setEmoji("<:emoji_50:1242924374915551293>")
                )
            interaction.reply({ embeds: [sampascorin], components: [sampasrowbah] })
        }

        if (actionSelect === 'gerarPix') {
            if (dbConfigs.get(`pagamentos.sistema`) === 'OFF') {
                interaction.reply({ content: `❕ | Sistema de pagamentos está **DESLIGADO**, utilize **_/gerar-pix_** para ativa-lo e configura-lo.`, flags: MessageFlags.Ephemeral })
                return
            } else if (dbConfigs.get(`pagamentos.chavepix`) || dbConfigs.get(`pagamentos.qrcode`)) {
                interaction.reply({
                    content: '❕ | Chave Pix e QRCode foram enviados no canal, caso queira gerar um pix com valor definido, vá em **/gerar-pix > Sistema Semiauto > Resetar**,' +
                        ' você deverá ter um *Token do Mercado Pago* cadastrado para gerar pix com valor definido.',
                    flags: MessageFlags.Ephemeral
                })
                interaction.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription([
                                `- Após efetuar o pagamento, envie o comprovante no chat para os membros da staff.`,
                                '\n',
                                '**Chave:**',
                                `\`\`\`${await dbConfigs.get('pagamentos.chavepix') || '\u200b'}\`\`\``
                            ].join('\n'))
                            .setImage(dbConfigs.get('pagamentos.qrcode') || 'https://sem-img.com')
                    ]
                }).then((msg) => {
                    setTimeout(() => {
                        msg.delete().catch(err => { })
                    }, 600000);
                })
            } else {
                const channelI = interaction.channel;
                const userI = interaction.user;
                const userPayment = await dbOpenedPayments.get(channelI.id);
                if (userPayment) {
                    if (userPayment.payer == userI.id) {
                        await interaction.reply({
                            content: `❌ | Você já tem um pagamento em aberto.`,
                            flags: MessageFlags.Ephemeral
                        });
                    };
                    return
                };

                const tokenMp = await dbConfigs.get(`pagamentos.acess_token`);

                if (!await dbConfigs.get(`pagamentos.acess_token`)) {
                    await interaction.reply({
                        content: `❌ | Configure um Token MP para utilizar este comando.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return
                }

                await axios.get(`https://api.mercadopago.com/v1/payments/search`, {
                    headers: {
                        "Authorization": `Bearer ${tokenMp}`
                    }
                }).catch(err => { })

                const mpClient = new MercadoPagoConfig({ accessToken: tokenMp });
                const mpPayment = new Payment(mpClient);
                let valueInserted = interaction.options.getNumber(`valor`);
                if (Number(valueInserted) <= 0) {
                    await interaction.reply({
                        content: `❌ | O valor mínimo é de \`R$1\`.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                };

                await interaction.reply({
                    content: '🔁 | Gerando o pagamento ...'
                }).then(async (msg) => {
                    const regex = /[^a-zA-Z0-9\s]/g;
                    const email = interaction.user.username
                    const clearEmail = email.replace(regex, '')

                    const paymentData = {
                        transaction_amount: Number(valueInserted),
                        description: `Compras - ${interaction.user.username}`,
                        payment_method_id: `pix`,
                        payer: {
                            email: `${clearEmail}@gmail.com`,
                        },
                    };

                    await mpPayment.create({ body: paymentData })
                        .then(async (data) => {
                            const loopCancelPayment = setTimeout(async (t) => {
                                await mpPayment.cancel({ id: data.id })
                                    .catch((err) => {
                                        return;
                                    });
                                dbOpenedPayments.delete(channelI.id);
                                await interaction.editReply({
                                    content: `⚠ | O prazo para o pagamento expirou, já que não foi efetuado dentro do período estipulado.`,
                                    embeds: [],
                                    components: []
                                });
                            }, 600000);

                            await dbOpenedPayments.set(`${channelI.id}.payer`, userI.id);
                            await dbOpenedPayments.set(`${channelI.id}.valueAdded`, Number(valueInserted));
                            await dbOpenedPayments.set(`${channelI.id}.paymentId`, data.id);
                            await dbOpenedPayments.set(`${channelI.id}.date`, moment());

                            const rowPixPayment = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder().setCustomId(`gerarPixCopiaCola`).setLabel(`Pix Copia e Cola`).setEmoji(`<:1289360523074207807:1289647527515127961>`).setStyle(`Success`),
                                    new ButtonBuilder().setCustomId(`gerarPixQrCode`).setLabel(`QR Code`).setEmoji(`<:qrcode:1235790732233670656>`).setStyle(`Success`),
                                    new ButtonBuilder().setCustomId(`cancelarGerarPix`).setEmoji(`<a:incorreto:1235790401219067975>`).setStyle(`Danger`)
                                );

                            const tenMinutes = moment().add(10, `minute`);
                            const expirationTenMinutes = `<t:${Math.floor(tenMinutes.toDate().getTime() / 1000)}:f> (<t:${Math.floor(tenMinutes.toDate().getTime() / 1000)}:R>)`;

                            const embedPixPayment = new EmbedBuilder()
                                .setTitle(`${client.user.username} | Pagamento`)
                                .addFields(
                                    { name: `💸 | Valor:`, value: `R$${Number(valueInserted).toFixed(2)}` },
                                    { name: `⏰ | Pagamento expira em:`, value: expirationTenMinutes }
                                )
                                .setColor(colorC !== "none" ? colorC : "#460580")
                                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` });

                            await interaction.editReply({
                                content: ``,
                                embeds: [embedPixPayment],
                                components: [rowPixPayment]
                            });

                            const loopCheckPayment = setInterval(async (i) => {
                                const paymentGet = await mpPayment.get({ id: data.id });
                                const paymentStatus = paymentGet.status;
                                if (paymentStatus == `approved`) {
                                    clearTimeout(loopCancelPayment);
                                    clearInterval(loopCheckPayment);
                                    dbOpenedPayments.delete(channelI.id);

                                    const embedSuccessPayment = new EmbedBuilder()
                                        .setTitle(`${client.user.username} | Pagamento Aprovado`)
                                        .setDescription(`✅ | O pagamento no valor de **R$__${Number(valueInserted).toFixed(2)}__** gerado por ${userI} foi aprovado!`)
                                        .setColor(`Green`)
                                        .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` });

                                    await interaction.editReply({
                                        content: `🎉 | Pagamento Aprovado!\n📝 | ID do Pagamento: **${data.id}**`,
                                        embeds: [embedSuccessPayment],
                                        components: []
                                    });
                                };
                            }, 5000);
                            const collectorPayment = msg.createMessageComponentCollector({
                                time: 600000
                            });
                            collectorPayment.on("collect", async (iPayment) => {
                                if (iPayment.customId == `gerarPixCopiaCola`) {
                                    const codePix = data.point_of_interaction.transaction_data.qr_code;
                                    await iPayment.reply({
                                        content: `${codePix}`,
                                        flags: MessageFlags.Ephemeral
                                    });
                                };

                                if (iPayment.customId == `gerarPixQrCode`) {
                                    const bufferQrCode = Buffer.from(data.point_of_interaction.transaction_data.qr_code_base64, "base64");
                                    const qrCodeAttachment = new AttachmentBuilder(bufferQrCode, "payment.png");
                                    await iPayment.reply({
                                        files: [qrCodeAttachment],
                                        flags: MessageFlags.Ephemeral
                                    });
                                };

                                if (iPayment.customId == `cancelarGerarPix`) {
                                    await iPayment.deferUpdate();
                                    clearTimeout(loopCancelPayment);
                                    clearInterval(loopCheckPayment);
                                    await mpPayment.cancel({ id: data.id })
                                        .catch((err) => {
                                            return;
                                        });
                                    dbOpenedPayments.delete(channelI.id);

                                    await interaction.editReply({
                                        content: `❌ | Pagamento Cancelado!`,
                                        embeds: [],
                                        components: []
                                    });

                                    await collectorPayment.stop();
                                };
                            });
                        }).catch(async (err) => {
                            if (err.message === 'invalid access token') {
                                interaction.editReply({
                                    content: `❌ | Token inválido, por favor, reconfigure corretamente.`,
                                    flags: MessageFlags.Ephemeral
                                })
                            } else {
                                await interaction.editReply({
                                    content: `❌ | Ocorreu um erro ao gerar o pagamento.`,
                                    embeds: [],
                                    components: []
                                });
                            }
                            dbOpenedPayments.delete(channelI.id)
                            return
                        });
                });
            }
        }
    },
};