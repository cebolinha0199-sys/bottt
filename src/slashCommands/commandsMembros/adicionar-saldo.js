const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const axios = require("axios")
const moment = require("moment")
const { MercadoPagoConfig, Payment } = require("mercadopago")
const { JsonDatabase } = require("wio.db")
const { getCache } = require("../../../Functions/connect_api")
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbOpenedPayments = new JsonDatabase({ databasePath: "./databases/dbOpenedPayments.json" })
const dbProfiles = new JsonDatabase({ databasePath: "./databases/dbProfiles.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("adicionar-saldo")
        .setDescription("[💰] Adicione Saldo via Pix!")
        .addNumberOption(opInteger => opInteger
            .setName(`valor`)
            .setDescription(`Valor que será adicionado`)
            .setMinValue(1)
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        let type = getCache(null, 'type')

        if (type?.Vendas?.status !== true) {
            await interaction.reply({ content: `❌ | Comando desabilitado pois o bot não possui o sistema de venda adquirido.`, flags: MessageFlags.Ephemeral })
            return
        }

        const msg = await interaction.reply({
            content: `🔁 | Gerando o pagamento ...`,
            flags: MessageFlags.Ephemeral
        })

        const email = interaction.user.username
        const clearEmail = email.replace(/[^a-zA-Z0-9\s]/g, '')

        const channelI = interaction.channel;
        const userI = interaction.user;
        const userPayment = await dbOpenedPayments.get(channelI.id)
        if (userPayment) {
            if (userPayment.payer == userI.id) {
                await interaction.editReply({
                    content: `❌ | Você já tem um pagamento em aberto.`,
                    flags: MessageFlags.Ephemeral
                })
                return;
            }
        }

        const tokenMp = await dbConfigs.get(`vendas.payments.mpAcessToken`)
        if (!tokenMp) {
            return await interaction.editReply({
                content: `❌ | Configure um Token MP para utilizar este comando.`,
                flags: MessageFlags.Ephemeral
            })
        } else {
            await axios.get(`https://api.mercadopago.com/v1/payments/search`, {
                headers: {
                    "Authorization": `Bearer ${tokenMp}`
                }
            }).catch(async (err) => {
                return await interaction.editReply({
                    content: `❌ | O Token MP que está configurado é inválido.`,
                    flags: MessageFlags.Ephemeral
                })
            })
        }

        const mpClient = new MercadoPagoConfig({ accessToken: tokenMp })
        const mpPayment = new Payment(mpClient)

        let valueInserted = interaction.options.getNumber(`valor`)

        const minimumDeposit = await dbConfigs.get(`vendas.balance.minimumDeposit`)

        if (Number(valueInserted) < Number(minimumDeposit)) {
            await interaction.editReply({
                content: `❌ | O valor mínimo para depósito é de \`R$${Number(minimumDeposit).toFixed(2)}\`.`,
                flags: MessageFlags.Ephemeral
            })
            return;
        }

        if (Number(valueInserted) <= 0) {
            await interaction.editReply({
                content: `❌ | O valor mínimo para depósito é de \`R$${Number(minimumDeposit).toFixed(2)}\`.`,
                flags: MessageFlags.Ephemeral
            })
            return;
        }



        let originalValue = valueInserted;
        let discountedValue = 0;
        const bonusDeposit = await dbConfigs.get(`vendas.balance.bonusDeposit`)
        if (bonusDeposit != 0) {
            discountedValue = (bonusDeposit / 100) * originalValue;
            valueInserted = originalValue + discountedValue;
        }

        const paymentData = {
            transaction_amount: Number(originalValue),
            description: `Adição de saldo - ${interaction.user.username}`,
            payment_method_id: `pix`,
            payer: {
                email: `${clearEmail}@gmail.com`,
            },
        }

        await mpPayment.create({ body: paymentData })
            .then(async (data) => {
                const loopCancelPayment = setTimeout(async (t) => {
                    await mpPayment.cancel({ id: data.id })
                        .catch((err) => {
                            return;
                        })
                    dbOpenedPayments.delete(channelI.id)


                    try {
                        const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`))
                        if (channelLogsPriv) {
                            await channelLogsPriv.send({
                                embeds: [new EmbedBuilder()
                                    .setAuthor({ name: `${userI.username} - ${userI.id}`, iconURL: userI.avatarURL({ dynamic: true }) })
                                    .setTitle(`${client.user.username} | Pagamento Cancelado`)
                                    .setDescription(`👤 | O ${userI} não realizou o pagamento dentro do prazo e foi cancelada a adição de saldo no valor de **R$__${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}__**.`)
                                    .addFields(
                                        { name: `📝 | ID do Pagamento:`, value: `**${data.id}**` }
                                    )
                                    .setThumbnail(userI.avatarURL({ dynamic: true }))
                                    .setColor(`Red`)
                                    .setTimestamp()
                                ]
                            })
                        }
                    } catch (error) {
                        if (!channelLogsPriv) {
                            console.error('Canal de logs de pagamentos não definido.', error)
                        } else {
                            console.error(error)
                        }
                    }

                    await interaction.editReply({
                        content: `❗ | O prazo para o pagamento expirou, já que não foi efetuado dentro do período estipulado.`,
                        embeds: [],
                        components: []
                    })
                }, 600000)

                await dbOpenedPayments.set(`${channelI.id}.payer`, userI.id)
                await dbOpenedPayments.set(`${channelI.id}.valueAdded`, Number(originalValue))
                await dbOpenedPayments.set(`${channelI.id}.paymentId`, data.id)
                await dbOpenedPayments.set(`${channelI.id}.date`, moment())

                const rowPixPayment = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`copiaCola`).setLabel(`Pix Copia e Cola`).setEmoji(`<:1289360523074207807:1289647527515127961>`).setStyle(`Success`),
                        new ButtonBuilder().setCustomId(`qrCode`).setLabel(`QR Code`).setEmoji(`<:QRCODE:1328739559026065530>`).setStyle(`Success`),
                        new ButtonBuilder().setCustomId(`cancelPayment`).setEmoji(`<:1289361576486240327:1289647775176331376>`).setStyle(`Danger`)
                    )

                const tenMinutes = moment().add(10, `minute`)
                const expirationTenMinutes = `<t:${Math.floor(tenMinutes.toDate().getTime() / 1000)}:f> (<t:${Math.floor(tenMinutes.toDate().getTime() / 1000)}:R>)`;

                const embedPixPayment = new EmbedBuilder()
                    .setTitle(`${client.user.username} | Pagamento`)
                    .addFields(
                        { name: `💸 | Valor:`, value: `${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` },
                        { name: `🎉 | Bônus de Depósito:`, value: `${bonusDeposit}% - ${Number(discountedValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` },
                        { name: `⏰ | Pagamento expira em:`, value: expirationTenMinutes }
                    )
                    .setColor(colorC !== "none" ? colorC : "#460580")
                    .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` })

                await interaction.editReply({
                    content: `${userI}`,
                    embeds: [embedPixPayment],
                    components: [rowPixPayment]
                })

                const loopCheckPayment = setInterval(async (i) => {
                    const paymentGet = await mpPayment.get({ id: data.id })
                    const paymentStatus = paymentGet.status;

                    if (paymentStatus == `approved`) {
                        clearTimeout(loopCancelPayment)
                        clearInterval(loopCheckPayment)
                        dbOpenedPayments.delete(channelI.id)
                        await dbProfiles.add(`${userI.id}.balance`, Number(valueInserted))

                        const bonusDeposit = await dbConfigs.get(`vendas.balance.bonusDeposit`)
                        if (bonusDeposit == 0) {
                            try {
                                const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`))
                                if (channelLogsPriv) {
                                    await channelLogsPriv.send({
                                        embeds: [new EmbedBuilder()
                                            .setAuthor({ name: `${userI.username} - ${userI.id}`, iconURL: userI.avatarURL({ dynamic: true }) })
                                            .setTitle(`${client.user.username} | Pagamento Criado`)
                                            .setDescription(`👤 | O ${userI} efetuou um pagamento no valor de __${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}__ para adição de saldo.`)
                                            .addFields(
                                                { name: `📝 | ID do Pagamento:`, value: `**${data.id}**` }
                                            )
                                            .setThumbnail(userI.avatarURL({ dynamic: true }))
                                            .setColor(`Green`)
                                            .setTimestamp()
                                        ]
                                    })
                                }
                            } catch (error) {
                                if (!channelLogsPriv) {
                                    console.error('Canal de logs de pagamentos não definido.', error)
                                } else {
                                    console.error(error)
                                }
                            }

                            const embedSuccessPayment = new EmbedBuilder()
                                .setTitle(`${client.user.username} | Pagamento Aprovado`)
                                .setDescription(`✅ | Seu pagamento no valor de **R$__${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}__** para adição de saldo foi aprovado!`)
                                .setColor(`Green`)
                                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` })

                            await interaction.editReply({
                                content: `🎉 | Pagamento Aprovado!\n📝 | ID da compra: **${data.id}**`,
                                embeds: [embedSuccessPayment],
                                components: []
                            })
                        } else {
                            try {
                                const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`))
                                if (channelLogsPriv) {
                                    await channelLogsPriv.send({
                                        embeds: [new EmbedBuilder()
                                            .setAuthor({ name: `${userI.username} - ${userI.id}`, iconURL: userI.avatarURL({ dynamic: true }) })
                                            .setTitle(`${client.user.username} | Pagamento Criado`)
                                            .setDescription(`👤 | O ${userI} efetuou um pagamento no valor de ${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })} para adição de saldo e recebeu um bônus de **${bonusDeposit}%**, totalizando um acréscimo de **R$__${Number(valueInserted).toFixed(2)}__**.`)
                                            .addFields(
                                                { name: `📝 | ID do Pagamento:`, value: `**${data.id}**` }
                                            )
                                            .setThumbnail(userI.avatarURL({ dynamic: true }))
                                            .setColor(`Green`)
                                            .setTimestamp()
                                        ]
                                    })
                                }
                            } catch (error) {
                                if (!channelLogsPriv) {
                                    console.error('Canal de logs de pagamentos não definido.', error)
                                } else {
                                    console.error(error)
                                }
                            }

                            const embedSuccessPayment = new EmbedBuilder()
                                .setTitle(`${client.user.username} | Pagamento Aprovado`)
                                .setDescription(`✅ | Seu pagamento no valor de **R$__${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}__** para adição de saldo foi aprovado! Você recebeu um bônus de **${bonusDeposit}%**, totalizando um acréscimo de **R$__${Number(valueInserted).toFixed(2)}__**.`)
                                .setColor(`Green`)
                                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` })

                            await interaction.editReply({
                                content: `🎉 | Pagamento Aprovado!\n📝 | ID da compra: **${data.id}**`,
                                embeds: [embedSuccessPayment],
                                components: []
                            })
                        }
                    }
                }, 5000)

                const filter = (m) => m.user.id == userI.id;
                const collectorPayment = msg.createMessageComponentCollector({
                    filter: filter,
                    time: 600000
                })
                collectorPayment.on("collect", async (iPayment) => {
                    if (iPayment.customId == `copiaCola`) {
                        await iPayment.deferUpdate()
                        const codePix = data.point_of_interaction.transaction_data.qr_code;
                        await iPayment.followUp({
                            content: `${codePix}`,
                            flags: MessageFlags.Ephemeral
                        })
                    }

                    if (iPayment.customId == `qrCode`) {
                        await iPayment.deferUpdate()
                        const bufferQrCode = Buffer.from(data.point_of_interaction.transaction_data.qr_code_base64, "base64")
                        const qrCodeAttachment = new AttachmentBuilder(bufferQrCode, "payment.png")
                        await iPayment.followUp({
                            files: [qrCodeAttachment],
                            flags: MessageFlags.Ephemeral
                        })
                    }

                    if (iPayment.customId == `cancelPayment`) {
                        await iPayment.deferUpdate()
                        clearTimeout(loopCancelPayment)
                        clearInterval(loopCheckPayment)
                        await mpPayment.cancel({ id: data.id })
                            .catch((err) => {
                                return;
                            })
                        dbOpenedPayments.delete(channelI.id)

                        try {
                            const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`))
                            if (channelLogsPriv) {
                                await channelLogsPriv.send({
                                    embeds: [new EmbedBuilder()
                                        .setAuthor({ name: `${userI.username} - ${userI.id}`, iconURL: userI.avatarURL({ dynamic: true }) })
                                        .setTitle(`${client.user.username} | Pagamento Cancelado`)
                                        .setDescription(`👤 | O ${userI} cancelou o pagamento para adição de saldo no valor de **R$__${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}__**.`)
                                        .addFields(
                                            { name: `📝 | ID do Pagamento:`, value: `**${data.id}**` }
                                        )
                                        .setThumbnail(userI.avatarURL({ dynamic: true }))
                                        .setColor(`Red`)
                                        .setTimestamp()
                                    ]
                                })
                            }
                        } catch (error) {
                            if (!channelLogsPriv) {
                                console.error('Canal de logs de pagamentos não definido.', error)
                            } else {
                                console.error(error)
                            }
                        }

                        await interaction.deleteReply()
                        await collectorPayment.stop()
                    }
                })

                try {
                    const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`))
                    if (channelLogsPriv) {
                        await channelLogsPriv.send({
                            embeds: [new EmbedBuilder()
                                .setAuthor({ name: `${userI.username} - ${userI.id}`, iconURL: userI.avatarURL({ dynamic: true }) })
                                .setTitle(`${client.user.username} | Pagamento Criado`)
                                .setDescription(`👤 | O ${userI} solicitou um pagamento para adição de saldo no valor de **__${Number(originalValue).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}__**.`)
                                .addFields(
                                    { name: `📝 | ID do Pagamento:`, value: `**${data.id}**` }
                                )
                                .setThumbnail(userI.avatarURL({ dynamic: true }))
                                .setColor(`Green`)
                                .setTimestamp()
                            ]
                        })
                    }
                } catch (error) {
                    if (!channelLogsPriv) {
                        console.error('Canal de logs de pagamentos não definido.', error)
                    } else {
                        console.error(error)
                    }
                }
            }).catch(async (err) => {
                await interaction.editReply({
                    content: `❌ | Ocorreu um erro ao gerar o pagamento.`,
                    embeds: [],
                    components: [],
                    flags: MessageFlags.Ephemeral
                })
                dbOpenedPayments.delete(channelI.id)
            })
    },
}