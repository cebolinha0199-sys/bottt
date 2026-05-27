const { default: axios } = require("axios");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");


const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

async function PainelSales(cliemt, interaction) {
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    let infos
    try {
        const response = await axios.get('https://api.e-sales.company/e-sales/buys', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'esalesAPiSquare',
            },
            data: {
                ServerID: interaction.guild.id, userid: interaction.user.id
            }
        });

        infos = response.data;
    } catch (error) {
        console.log(error)
        console.error('Erro ao fazer requisição:', error);
    }

    let infosUser
    try {
        const query = `?userid=${interaction.user.id}&status=admin`;
        const response = await axios.get(`https://api.e-sales.company/e-sales${query}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'esalesAPiSquare'
            }
        });

        infosUser = response.data;
    } catch (error) {
        console.log(error)
        console.error('Erro ao fazer requisição:', error);
    }



    let allVendas = infos.length
    let valorTotalAliberar = 0
    let taxasArrecadadas = 0
    let qtdMediacoes = 0
    infos.forEach((venda) => {
        if (venda.lockBuy > Date.now() && venda.lockBuy !== 0) {
            valorTotalAliberar += venda.taxs.totalPrice - venda.taxs.porcentagemVendedor
        }
        taxasArrecadadas += venda.taxs.porcentagemVendedor

        if (venda.reclamation.status) {
            qtdMediacoes++
        }

    })
    let EsalesToggle = await dbConfigs.get(`vendas.payments.paymentsOptions.eSales`)

    let statusSacar = true
    if (infosUser.userStatus.valueReleased > 0) {
        statusSacar = false
        if(qtdMediacoes > 0) {
            statusSacar = true
        }
    }


    await interaction.editReply({
        files: [],
        content: ``,
        embeds: [
            new EmbedBuilder()
                .setAuthor({
                    name: `e-Sales ・ NeverMiss Apps`,
                    iconURL: `https://cdn.discordapp.com/emojis/1361573712033218722.webp?size=96`
                })
                .setDescription(
                    `💡 **Sobre o e-Sales**\n` +
                    `Desenvolvido especialmente para menores de idade ou pessoas que ainda não possuem conta bancária.\n`
                )
                .addFields(
                    { name: `💰 Saldo Disponível`, value: `\`${Number(infosUser.userStatus.valueReleased).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: `🔒 Saldo à liberar`, value: `\`${Number(valorTotalAliberar).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                    { name: `📈 Total de Vendas`, value: `\`${Number(allVendas)}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                )
                .setColor("Aqua")
                .setFooter({
                    text: `A tarifa atual do e-Sales é de 10% sobre cada venda realizada.`
                })


        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`e-salesToggle`).setLabel(EsalesToggle ? `Sistema Ativado` : `Sistema Desativado`).setStyle(EsalesToggle ? 3 : 4),
                    new ButtonBuilder().setCustomId(`e-salesSacar`).setLabel(qtdMediacoes > 0 ? `Sacar Saldo (Você possui intervenção)` : `Sacar Saldo`).setEmoji(`<:sacar1:1361573715107909773>`).setStyle(2).setDisabled(statusSacar),
                    new ButtonBuilder().setCustomId(`e-salesTransacoes`).setLabel(`Transações`).setEmoji(`<:entrega:1309524376454037554>`).setStyle(2),

                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`voltarconfiginicio`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1),
                    new ButtonBuilder().setCustomId(`e-salesAtualizar`).setLabel(`Atualizar Painel`).setEmoji(`<a:1289360283990495304:1289647509878345899>`).setStyle(2),
                )
        ]
    })

    if (qtdMediacoes > 0) {
        await interaction.followUp({
            content: `Você possui \`${qtdMediacoes}\` transações em intervenção, busque resolver o mais rápido possível para evitar bloqueios na sua conta!\n\n- Clique em \`Transações\` para visualizar o status e resolve-lo!`,
            ephemeral: true,
        })
    }


}

module.exports = {
    PainelSales
}