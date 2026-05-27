const { StringSelectMenuBuilder, TextDisplayBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, MessageFlags } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
async function PageNubank(client, interaction, a) {
    let typebank = await dbConfigs.get(`vendas.payments.NubankType`)
    let message = `## Pagamentos - IMAP##\n Veja abaixo informações sobre sua conta Nubank ou Picpay (IMAP):\n\n- Status do Sistema: ${await dbConfigs.get(`vendas.payments.Nubank`) !== true ? '\`Desativado\`' : '\`Ativado\`'}\n- Email: \`${await dbConfigs.get(`vendas.payments.NubankEmail`) == null ? 'Não configurado' : await dbConfigs.get(`vendas.payments.NubankEmail`)}\`\n- Senha: \`${await dbConfigs.get(`vendas.payments.NubankSenha`) == null ? 'Não configurado' : await dbConfigs.get(`vendas.payments.NubankSenha`)}\`\n\n- Banco Selecionado: \`${typebank == null ? 'Nenhum banco selecionado' : typebank}\`\n\n- **Atenção:** O sistema de pagamentos IMAP é experimental e pode apresentar instabilidades.\n\n**Clique no botão abaixo para configurar o sistema de pagamentos IMAP.**`;
    let components1 = new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId('nubankStatus')
                .setLabel('Ativar/Desativar Imap')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('nubankConfig')
                .setLabel('Configurar Imap')
                .setStyle(1)
        )
    let components2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previousPaymentMP')
                .setEmoji('1237055536885792889')
                .setStyle(2),
        )

    let components3 = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selecttypebank')
                .setPlaceholder('Selecione qual banco deseja utilizar')
                .addOptions([
                    {
                        label: 'Nubank - IMAP',
                        value: 'nubank',
                        emoji: '1237055536885792889'
                    },
                    {
                        label: 'Picpay - IMAP',
                        value: 'picpay',
                        emoji: '1237055536885792889'
                    }
                ])
        )

    if (a == 1) {
        return await interaction.editReply({ content: message, components: [components1, components3, components2], embeds: [] });
    }

    await interaction.update({ content: message, components: [components1, components3, components2], embeds: [] });
}

module.exports = {
    PageNubank
}