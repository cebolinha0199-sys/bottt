const { default: axios } = require("axios");
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

async function TransacoesPage(interaction, client, page) {
    let infos;
    try {
        const response = await axios.get('https://api.e-sales.company/e-sales/buys', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'esalesAPiSquare'
            },
            data: { ServerID: interaction.guild.id, userid: interaction.user.id }
        });
        infos = response.data;
    } catch (error) {
        console.error('Erro ao fazer requisição:', error);
    }

    // Filtra e ordena os dados
    let allVendasBloqueadas = infos.filter(venda => venda.lockBuy > Date.now() && venda.lockBuy !== 0)
        .sort((a, b) => {
            if (b.reclamation.status === a.reclamation.status) {
                return b.lockBuy - a.lockBuy;
            }
            return b.reclamation.status - a.reclamation.status;
        });
    let allVendasLiberadas = infos.filter(venda => venda.lockBuy == 0)
        .sort((a, b) => b.unlockBuy - a.unlockBuy);
    let allMediacao = infos.filter(venda => venda.lockBuy !== 0 && venda.reclamation.status == true);

    const itemsPerPage = 10;

    // Cálculo das páginas
    const maxPageBloqueados = Math.ceil(allVendasBloqueadas.length / itemsPerPage);
    const maxPageLiberadas = Math.ceil(allVendasLiberadas.length / itemsPerPage);
    const getPageData = (page, allVendas) => allVendas.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // Pega as transações paginadas
    allVendasBloqueadas = getPageData(page, allVendasBloqueadas);
    allVendasLiberadas = getPageData(page, allVendasLiberadas);

    // Criação do conteúdo
    let contentBloqueadas = "## Saldos pendentes\n";
    allVendasBloqueadas.forEach(venda => {
        let valor = venda.taxs.totalPrice - venda.taxs.porcentagemVendedor;
        contentBloqueadas += ` - \`${venda._id}\` | Valor: \`${Number(valor).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\` | Liberação em: <t:${Math.floor(venda.lockBuy / 1000)}:f> (<t:${Math.floor(venda.lockBuy / 1000)}:R>) ${venda.reclamation.status ? '(\`Em intervenção\`)' : ''}\n`;
    });
    if (allVendasBloqueadas.length < 1) contentBloqueadas += `- Nenhum saldo pendente ou bloqueado.`;

    let contentLiberadas = "## Transações Concluídas\n";
    allVendasLiberadas.forEach(venda => {
        let valor = venda.taxs.totalPrice - venda.taxs.porcentagemVendedor;
        contentLiberadas += ` - \`${venda._id}\` | Valor: \`${Number(valor).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\` | Liberado em: <t:${Math.floor(venda.unlockBuy / 1000)}:f> (<t:${Math.floor(venda.unlockBuy / 1000)}:R>)\n`;
    });
    if (allVendasLiberadas.length < 1) contentLiberadas += `- Nenhuma transação concluída.`;

    const generatePaginationRow = (page, maxPage, customIdPrefix) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${customIdPrefix}_anterior_${Number(page) - 1}`)
                .setEmoji(`<:seta_esquerda:1257790237929767032>`)
                .setStyle(2)
                .setDisabled(Number(page) === 1),
            new ButtonBuilder()
                .setCustomId(`${customIdPrefix}_paginaSelecionada`)
                .setLabel(`${page} de ${maxPage == 0 ? 1 : maxPage}`)
                .setStyle(2)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`${customIdPrefix}_seguinte_${Number(page) + 1}`)
                .setEmoji(`<:seta_direita:1257790236524806165>`)
                .setStyle(2)
                .setDisabled(Number(page) >= Number(maxPage))
        );
    };

    // Criação dos botões de paginação para bloqueadas e liberadas

    const row2Bloqueados = generatePaginationRow(page, maxPageBloqueados, 'paginaBloqueados');
    const row2Liberadas = generatePaginationRow(page, maxPageLiberadas, 'paginaLiberadas');


    // Criação do menu de mediação
    const options = allMediacao.length === 0 ? [{
        label: 'Nenhuma mediação disponível',
        value: 'nada',
        description: 'Não há intervenção no momento.'
    }] : allMediacao.slice(0, 25).map(venda => ({
        label: `${venda._id.slice(0, 60)} | ${venda.buyer.username.slice(0, 30)}`.slice(0, 100),
        value: venda._id.slice(0, 100),
        description: `Transação: ${venda._id.slice(0, 40)}${venda.reclamation.status ? ' | (Em intervenção)' : ''}`.slice(0, 100)
    }));

    const SelectMediacao = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('e-salesMediacao')
                .setPlaceholder(allMediacao.length == 0 ? 'Nenhuma intervenção no momento.' : 'Selecione uma intervenção para visualizar')
                .setDisabled(allMediacao.length === 0)
                .addOptions(options)
        );

    return {
        contentBloqueados: contentBloqueadas,
        contentLiberadas,
        componentsBloqueados: [SelectMediacao, row2Bloqueados],
        componentsLiberadas: [row2Liberadas],
    };
}




async function PageCompras(interaction, page) {
    let infos;
    try {
        const response = await axios.get('https://api.e-sales.company/e-sales/buys', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'esalesAPiSquare'
            },
            data: { ServerID: interaction.guild.id, salesuser: interaction.user.id }
        });
        infos = response.data;
    } catch (error) {
        console.error('Erro ao fazer requisição:', error);
    }

    if (infos.length < 1) {
        return { content: `Você não possui compras realizadas em nosso sistema de \`e-sales\``, code: 1 }
    }

    const itemsPerPage = 10;
    infos = infos.reverse();
    infos = infos.sort((a, b) => {
        if (a.reclamation.status === b.reclamation.status) {
            return b.unlockBuy - a.unlockBuy;
        }
        return b.reclamation.status - a.reclamation.status;
    });

    const maxPage = Math.ceil(infos.length / itemsPerPage);
    const getPageData = (page, allVendas) => allVendas.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const allVendas = getPageData(page, infos);

    let content = "## Compras Realizadas\n- Selecione abaixo para solicitar interversão de uma compra ou visualizar o produto entregue\n\n- Para acessar servidor de suporte Clique abaixo.";

    let allMediacao = [];
    allVendas.forEach(venda => {
        if (venda.createdAt == undefined) {
            venda.createdAt = Date.now() - 86400000;
        } else {
            venda.createdAt = Number(venda.createdAt)
        }
        if (venda.reclamation.status == true) {
            allMediacao.push(venda)
        }
        let valor = venda.taxs.totalPrice + venda.taxs.taxaoperacional
        //    content += ` - \`${venda._id}\` | Valor: \`${Number(valor).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\` | Realizada em: <t:${Math.floor(tempo)}:f> (<t:${Math.floor(tempo)}:R>)\n`;
    });

    if (allVendas.length < 1) content += `- Nenhuma compra realizada.`;

    const generatePaginationRow = (page, maxPage, customIdPrefix) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`${customIdPrefix}_anterior_${Number(page) - 1}`)
                .setEmoji(`<:seta_esquerda:1257790237929767032>`)
                .setStyle(2)
                .setDisabled(Number(page) === 1),
            new ButtonBuilder()
                .setCustomId(`${customIdPrefix}_paginaSelecionada`)
                .setLabel(`${page} de ${maxPage == 0 ? 1 : maxPage}`)
                .setStyle(2)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`${customIdPrefix}_seguinte_${Number(page) + 1}`)
                .setEmoji(`<:seta_direita:1257790236524806165>`)
                .setStyle(2)
                .setDisabled(Number(page) >= Number(maxPage)),
            new ButtonBuilder()
                .setLabel('Servidor de Suporte [E-SALES]')
                .setURL('https://discord.gg/C2dffutHAE')
                .setStyle(5)
        );
    };

    const row2Bloqueados = generatePaginationRow(page, maxPage, 'paginasCompras');


    const options = allVendas.length === 0 ? [{
        label: 'Nenhuma mediação disponível',
        value: 'nada',
        description: 'Não há intervenção no momento.'
    }] : allVendas.slice(0, 25).map(venda => ({
        label: `${venda._id.slice(0, 60)} | ${Number(venda.taxs.totalPrice + venda.taxs.taxaoperacional).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })} ${venda.reclamation.status ? `(Em Intervenção)` : ``}`.slice(0, 100),
        value: venda.IDPayment,
        description: `Data da compra: ${formatarTimestamp(venda.createdAt)}`.slice(0, 100)
    }));


    const SelectMediacao = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('e-salesMediacao')
                .setPlaceholder(allVendas.length == 0 ? 'Nenhuma compra no momento.' : 'Selecione uma gerenciar uma compra')
                .setDisabled(allVendas.length === 0)
                .addOptions(options)
        );



    return {
        content: content,
        components: [SelectMediacao, row2Bloqueados],
        code: 1
    };
}



async function PainelCompras(interaction, IDSale) {

    let infos;
    try {
        const response = await axios.get('https://api.e-sales.company/e-sales/buy', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'esalesAPiSquare'
            },
            data: { idpayment: IDSale, guildid: interaction.guild.id }
        });
        infos = response.data;
    } catch (error) {
        console.error('Erro ao fazer requisição:', error);
    }

    console.log(infos)

    let formatProduto
    infos.products.forEach((produto) => {
        formatProduto = `  - Produto: \`${produto.name}\` - Valor Pago: \`${Number(produto.price * produto.qtd).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n`
    })
    console.log(infos.lockBuy)
    let desativarbutton = false
    if (infos.reclamation.status == true) {
        desativarbutton = true
    }
    if (infos.lockBuy == 0) {
        desativarbutton = true
    }

    console.log(desativarbutton)



    let content = `## Painel de Compra - \`${infos.IDPayment}\`\n\n- Produtos Adquiridos:\n${formatProduto}\n- Taxa operacional: \`${Number(infos.taxs.taxaoperacional).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n- Valor Total: \`${Number(infos.taxs.totalPrice + infos.taxs.taxaoperacional).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n- Data da compra: <t:${Math.floor(infos.createdAt / 1000)}:f> (<t:${Math.floor(infos.createdAt / 1000)}:R>)\n- ${infos.lockBuy == 0 ? `Garantia expirada em: <t:${Math.floor(infos.unlockBuy / 1000)}:f> (<t:${Math.floor(infos.unlockBuy / 1000)}:R>)` : `Garantia válida até: <t:${Math.floor(infos.lockBuy / 1000)}:f> (<t:${Math.floor(infos.lockBuy / 1000)}:R>)`}\n\nUtilize os botões abaixo caso queira iniciar uma intervenção.`;

    let components = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setDisabled(desativarbutton)
                .setCustomId(`e-salesIntervencao_${infos.IDPayment}`)
                .setLabel(
                    desativarbutton
                        ? `${infos.reclamation.status ? 'Intervenção em andamento' : 'Garantia expirada'}`
                        : 'Iniciar intervenção'
                )
                .setEmoji(desativarbutton
                    ? `${infos.reclamation.status ? '<:1225477825285328979:1289647475765936321>' : '<:1289362293456633942:1289647777080545420>'}`
                    : '<:1289359625937747989:1293976255632511078>')
                .setStyle(2),
        )

    let componentVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`voltarCompras`)
                .setEmoji('<:voltar:1314432925281812480>')
                .setStyle(2),
            new ButtonBuilder()
                .setLabel('Servidor de Suporte [E-SALES]')
                .setURL('https://discord.gg/C2dffutHAE')
                .setStyle(5)
        )

    await interaction.reply({
        content: content,
        ephemeral: true,
        embeds: [],
        components: [components, componentVoltar]
    })
}

function formatarTimestamp(date) {
    if (typeof date === 'number') {
        if (String(date).length === 10) {
            date = new Date(date * 1000);
        } else {
            date = new Date(date)
        }
    } else if (!(date instanceof Date)) {
        date = new Date(date);
    }

    const agora = new Date();
    const diffMs = agora - date;

    const segundos = Math.floor(diffMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);


    let tempoRelativo = '';
    if (dias > 0) {
        tempoRelativo = `há ${dias} dia${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
        tempoRelativo = `há ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
        tempoRelativo = `há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
        tempoRelativo = `há alguns segundos`;
    }

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, '0');
    const minuto = String(date.getMinutes()).padStart(2, '0');

    const dataFormatada = `${dia}/${mes}/${ano} ${hora}:${minuto}`;

    return `${dataFormatada} (${tempoRelativo})`;
}



module.exports = { TransacoesPage, PageCompras, PainelCompras };
