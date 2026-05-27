const { MessageFlags, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

async function paginablock(interaction, client, s) {


    let banksblock = dbConfigs.get('vendas.payments.bankBlock') || []
    let message2 = ``
    if (banksblock.length > 0) {
        for (let bank of banksblock) {
            message2 += `  - \`${bank}\`\n`
        }
    } else {
        message2 = `\`Nenhum banco bloqueado.\`\n`
    }


    let message = `## Bloquear Banco ##\n\n- Bancos Bloqueados:\n${message2}\n\n- Clique abaixo para gerenciar suas permissões.`


    if (s == 1) {
        return await interaction.update({ flags: [MessageFlags.Ephemeral], content: message, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("blockbank22222").setLabel("Gerenciar Bancos").setStyle(2).setEmoji('<:1225477825285328979:1289647475765936321>'))] })

    }

    await interaction.reply({ flags: [MessageFlags.Ephemeral], content: message, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("blockbank22222").setLabel("Gerenciar Bancos").setStyle(2).setEmoji('<:1225477825285328979:1289647475765936321>'))] })
}

async function blockbank(interaction) {

    let config = {
        method: 'GET',
        headers: {
            'Authorization': 'joaozinhogostoso',
            'Content-Type': 'application/json'
        }
    }

    let bancosfraudulentos = await fetch('https://dev.promisse.app/blacklist/get', config)
    bancosfraudulentos = await bancosfraudulentos.json()

    let opcoes = []

    let banksblock = dbConfigs.get('vendas.payments.bankBlock') || []


    for (let banco in bancosfraudulentos) {
        let quantidade = bancosfraudulentos[banco].quantidade
        let valorTotal = bancosfraudulentos[banco].valorTotal
      


        opcoes.push(
            new StringSelectMenuOptionBuilder()
            .setLabel(banco)
            .setDescription(`${(quantidade)} Fraudes, total de ${Number(valorTotal).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}`)
            .setValue(banco)
            .setDefault(banksblock.includes(banco))
        )
    }

    const content = `Não se preocupe, no momento em que uma fraude é detectada em um novo banco em qualquer loja, ele é adicionado automaticamente aqui. `

    const select = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("blockbankBank")
            .setPlaceholder('Selecione o Banco que deseja bloquear')
            .setMinValues(1)
            .setMaxValues(opcoes.length)
            .addOptions(opcoes)
    )

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("blockbank2")
            .setEmoji(`1237055536885792889`)
            .setStyle(2),
    )

    await interaction.update({ content: content, embeds: [], components: [select, botao] })
}


module.exports = {
    blockbank,
    paginablock
}