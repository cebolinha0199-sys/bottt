const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

async function automsg(interaction, client, s) {
    const ggg = dbConfigs.get('acoesautomaticas.mensagens')

    var desc = ''
    if (ggg !== null) {
        for (let index = 0; index < ggg.length; index++) {
            const element = ggg[index];

            const truncatedDescricao = element[0].descricao.length > 30 ? element[0].descricao.substring(0, 30) + '...' : element[0].descricao;
            desc += `  - (${index + 1}) - ${truncatedDescricao}\n`
        }
    }

    if (desc == '') {
        desc = `  - Nenhuma mensagem automática cadastrada.\n`
    }

    let message = `## Mensagens Automáticas ##\n\n- Mensagens cadastradas:\n${desc}\n- Utilize os sistemas abaixo para gerenciar todas suas mensagens automáticas.`

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("criarmsgauto")
                .setLabel('Criar Mensagem Automática')
                .setEmoji('1233110125330563104')
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId("remmsgautomatica")
                .setLabel('Remover Mensagem Automática')
                .setEmoji('1229787813046915092')
                .setStyle(4),
            new ButtonBuilder()
                .setCustomId("gerenciarmsgautomatica")
                .setLabel('Gerenciar Mensagem Automática')
                .setEmoji('1233110125330563104')
                .setStyle(1)
        )

    if (s == 1) {
        await interaction.reply({ embeds: [], components: [row2], content: message, ephemeral: true })
    } else {
        await interaction.update({ embeds: [], components: [row2], content: message, ephemeral: true })
    }
}

async function enviarMensagem(mensagem, canalId, client, chave) {
    // Get up-to-date message data from the database
    const mensagensAtualizadas = dbConfigs.get('acoesautomaticas.mensagens');
    let mensagemAtualizada = null;
    
    // Find the matching message in the database (based on key parameters)
    if (mensagensAtualizadas) {
        for (const msgGroup of mensagensAtualizadas) {
            const msg = msgGroup[0];
            const chaveMensagemAtual = `${msg.titulo}-${msg.descricao}-${msg.bannerembed}-${msg.time}-${msg.idchanell}`;
            
            if (chaveMensagemAtual === chave) {
                mensagemAtualizada = msg;
                break;
            }
        }
    }
    
    // Use the updated message data if found, otherwise use the original
    const mensagemFinal = mensagemAtualizada || mensagem;

    if (dbConfigs.get(chave) !== null) {
        try {
            const { id, channel } = dbConfigs.get(chave);
            const canal = client.channels.cache.get(channel);
            canal.messages.delete(id).catch(() => null);
        } catch (error) {
            // Error handling
        }
    }

    // Initialize components array
    let componentsArray = [];
    
    // Check if message has valid buttons
    if (mensagemFinal.buttons && Array.isArray(mensagemFinal.buttons) && mensagemFinal.buttons.length > 0) {
        // If custom buttons exist, only use those
        console.log(`Message has ${mensagemFinal.buttons.length} custom buttons`);
        const customButtonRows = createButtonRows(mensagemFinal.buttons);
        componentsArray = customButtonRows;
    } else {
        // If no custom buttons, use default button
        console.log("No custom buttons, using default button");
        const defaultRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('asSs')
                    .setLabel('Mensagem Automática')
                    .setStyle(2)
                    .setDisabled(true)
            );
        componentsArray.push(defaultRow);
    }

    if (mensagemFinal.titulo === '' && mensagemFinal.bannerembed === '') {
        try {
            const channela = client.channels.cache.get(canalId);
            let msg = await channela.send({ content: `${mensagemFinal.descricao}`, components: componentsArray });
            dbConfigs.set(chave, { id: msg.id, channel: canalId });
        } catch (error) {
            console.error(`Error sending message: ${error.message}`);
        }
    } else {
        const embed = new EmbedBuilder()
        embed.setColor(await dbConfigs.get('vendas.embeds.color') !== 'none' ? await dbConfigs.get('vendas.embeds.color') : 'Random');

        if (mensagemFinal.titulo !== '') {
            embed.setTitle(mensagemFinal.titulo);
        }

        if (mensagemFinal.descricao !== '') {
            embed.setDescription(mensagemFinal.descricao);
        }

        if (mensagemFinal.bannerembed !== '') {
            embed.setImage(mensagemFinal.bannerembed);
        }

        try {
            const channela = client.channels.cache.get(canalId);
            let msg = await channela.send({ embeds: [embed], components: componentsArray });
            dbConfigs.set(chave, { id: msg.id, channel: canalId });
        } catch (error) {
            console.error(`Error sending message with embed: ${error.message}`);
        }
    }
}

// Helper function to create button rows from button data
function createButtonRows(buttons) {
    const rows = [];
    
    // Ensure buttons is an array and not null/undefined
    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
        return rows;
    }
    
    console.log(`Creating button rows for ${buttons.length} buttons`);
    
    // Create rows with maximum 5 buttons per row (Discord limit)
    for (let i = 0; i < buttons.length; i += 5) {
        const row = new ActionRowBuilder();
        const buttonsInThisRow = buttons.slice(i, i + 5);
        
        for (const buttonData of buttonsInThisRow) {
            try {
                const button = new ButtonBuilder()
                    .setLabel(buttonData.label)
                    .setStyle(5) // Link style
                    .setURL(buttonData.url);

                row.addComponents(button);
                console.log(`Added button: ${buttonData.label} - ${buttonData.url}`);
            } catch (error) {
                console.error(`Error creating button: ${error.message}`);
            }
        }
        
        if (row.components.length > 0) {
            rows.push(row);
        }
    }
    
    console.log(`Created ${rows.length} button rows`);
    return rows;
}

const agendadas = new Set();
const intervalosAgendados = new Map();

function agendarMensagens(client) {
    // Initial check and setup of messages
    atualizarMensagensAgendadas(client);
    
    // Set up the interval to check for changes
    setInterval(() => {
        atualizarMensagensAgendadas(client);
    }, 5000);
}

function atualizarMensagensAgendadas(client) {
    const ggg = dbConfigs.get('acoesautomaticas.mensagens');
    const mensagensAtuais = new Set();

    if (ggg !== null) {
        ggg.forEach(([mensagem]) => {
            const { titulo, descricao, bannerembed, time, idchanell } = mensagem;
            const chaveMensagem = `${titulo}-${descricao}-${bannerembed}-${time}-${idchanell}`;
            mensagensAtuais.add(chaveMensagem);

            if (!agendadas.has(chaveMensagem)) {
                const intervalo = parseInt(time, 10) * 1000;

                // Send the initial message
                enviarMensagem(mensagem, idchanell, client, chaveMensagem);

                // Set up the interval for recurring messages
                const intervalId = setInterval(() => {
                    // This will fetch fresh data each time
                    enviarMensagem(mensagem, idchanell, client, chaveMensagem);
                }, intervalo);

                agendadas.add(chaveMensagem);
                intervalosAgendados.set(chaveMensagem, intervalId);
                console.log(`Scheduled new message: ${chaveMensagem}`);
            }
        });

        // Remove messages that are no longer in the database
        agendadas.forEach((chaveMensagem) => {
            if (!mensagensAtuais.has(chaveMensagem)) {
                clearInterval(intervalosAgendados.get(chaveMensagem));
                intervalosAgendados.delete(chaveMensagem);
                agendadas.delete(chaveMensagem);
                console.log(`Removed scheduled message: ${chaveMensagem}`);
            }
        });
    } else {
        // Clean up all scheduled messages if the database is empty
        agendadas.forEach((chaveMensagem) => {
            clearInterval(intervalosAgendados.get(chaveMensagem));
            intervalosAgendados.delete(chaveMensagem);
            agendadas.delete(chaveMensagem);
        });
    }
}

module.exports = {
    automsg,
    agendarMensagens
}