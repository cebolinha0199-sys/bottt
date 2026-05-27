const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { updateGiveaway, findGiveawayByMessageId, permitirAutoParticipacao } = require('./utils');

/**
 * Configura o temporizador para finalizar um sorteio
 * @param {import('discord.js').Client} client - Cliente do Discord.js
 * @param {Object} sorteio - Dados do sorteio
 */
function setupGiveawayEnding(client, sorteio) {
    // Calcular o tempo restante
    const remainingTime = sorteio.endAt - Date.now();
    const sorteioId = sorteio.messageId;

    //console.log(`Sorteio ${sorteio.prize} configurado para terminar em ${remainingTime}ms`);

    // Se o sorteio já deveria ter terminado, finalize-o imediatamente
    if (remainingTime <= 0 && !sorteio.ended) {
        //console.log(`Finalizando sorteio atrasado: ${sorteio.prize}`);
        finalizarSorteio(client, sorteio);
        return;
    }

    // Se o sorteio já terminou, não faça nada
    if (sorteio.ended) {
        //console.log(`Sorteio ${sorteio.prize} já foi finalizado. Ignorando.`);
        return;
    }

    // Limitar o temporizador a no máximo 24 horas e verificar novamente depois
    const maxTimeout = 24 * 60 * 60 * 1000; // 24 horas em ms

    if (remainingTime > maxTimeout) {
        //console.log(`Sorteio ${sorteio.prize} termina em mais de 24h, configurando verificação intermediária`);
        setTimeout(() => {
            // Recarregar o sorteio do banco de dados para ter os dados mais atualizados
            const updatedGiveaway = findGiveawayByMessageId(sorteioId);
            if (updatedGiveaway && !updatedGiveaway.ended) {
                setupGiveawayEnding(client, updatedGiveaway);
            }
        }, maxTimeout);
    } else {
        // Usar setTimeout com uma função que recarrega os dados do sorteio
        setTimeout(() => {
            //console.log(`Temporizador acionado para o sorteio ${sorteioId}`);
            // Recarregar dados do sorteio para garantir que temos a versão mais recente
            const updatedGiveaway = findGiveawayByMessageId(sorteioId);

            if (!updatedGiveaway) {
                console.error(`Erro: Sorteio ${sorteioId} não encontrado no banco de dados no momento da finalização`);
                return;
            }

            if (updatedGiveaway.ended) {
                //console.log(`Sorteio ${sorteioId} já foi finalizado por outro processo`);
                return;
            }

            // Finalizar com os dados atualizados
            finalizarSorteio(client, updatedGiveaway);
        }, remainingTime);
    }
}

// Em /eventsFunctions/giveaways/endGiveaway.js
async function finalizarSorteio(client, sorteioData) {
    //console.log(`Iniciando finalização do sorteio: ${sorteioData.prize} (ID: ${sorteioData.messageId})`);

    // IMPORTANTE: Recarregar os dados mais recentes do banco de dados
    const sorteio = findGiveawayByMessageId(sorteioData.messageId);

    // Se o sorteio não existir mais no banco de dados, abortar
    if (!sorteio) {
        console.error(`Erro: Sorteio ${sorteioData.messageId} não encontrado no banco de dados`);
        return;
    }

    // Se o sorteio já foi finalizado, não processar novamente
    if (sorteio.ended) {
        //console.log(`Sorteio ${sorteio.messageId} já foi finalizado anteriormente. Abortando.`);
        return;
    }

    const guild = client.guilds.cache.get(sorteio.guildId);
    if (!guild) {
        console.error(`Erro: Servidor ${sorteio.guildId} não encontrado`);
        return;
    }

    const channel = guild.channels.cache.get(sorteio.channelId);
    if (!channel) {
        console.error(`Erro: Canal ${sorteio.channelId} não encontrado`);
        return;
    }

    try {
       // console.log(`Buscando mensagem do sorteio: ${sorteio.messageId}`);
        const message = await channel.messages.fetch(sorteio.messageId).catch(err => {
            console.error(`Erro ao buscar mensagem do sorteio: ${err.message}`);
            return null;
        });

        if (!message) {
            console.error(`Erro: Mensagem do sorteio ${sorteio.messageId} não encontrada`);
            // Marcar como finalizado com erro para evitar tentativas futuras
            updateGiveaway(sorteio.messageId, { ended: true, error: true });
            return;
        }

        // Registrar o número de participantes para diagnóstico
        //console.log(`Sorteio ${sorteio.prize}: Dados do banco mostram ${sorteio.participants.length} participantes`);

        // Selecionar vencedores aleatoriamente
        const participants = [...sorteio.participants]; // Cria uma cópia para não modificar o original
        //console.log(`Sorteio ${sorteio.prize}: Processando com ${participants.length} participantes`);

        // Filtrar criador do sorteio se auto-participação não for permitida
        if (!permitirAutoParticipacao(sorteio)) {
            const creatorIndex = participants.indexOf(sorteio.hostedBy);
            if (creatorIndex !== -1) {
                participants.splice(creatorIndex, 1);
                //console.log(`Criador do sorteio removido da lista de participantes. Restantes: ${participants.length}`);
            }
        }

        const winners = [];

        if (participants.length > 0) {
            const numWinners = Math.min(sorteio.winnerCount, participants.length);
            //console.log(`Selecionando ${numWinners} vencedores de ${participants.length} participantes`);

            for (let i = 0; i < numWinners; i++) {
                const winnerIndex = Math.floor(Math.random() * participants.length);
                const winnerId = participants[winnerIndex];
                winners.push(winnerId);
                participants.splice(winnerIndex, 1);
                //console.log(`Vencedor ${i + 1} selecionado: ${winnerId}`);
            }
        } else {
            //console.log(`Não há participantes válidos para selecionar vencedores`);
        }

        // Atualizar a embed
        const embed = EmbedBuilder.from(message.embeds[0]);

        if (winners.length > 0) {
            //console.log(`Atualizando embed com ${winners.length} vencedores`);
            embed.setDescription(`${sorteio.description}\n\n**Vencedores:**\n${winners.map(id => `<@${id}>`).join('\n')}\n\n\`👑\` **Organizador:** <@${sorteio.hostedBy}>\n\`🏆\` **Ganhadores:** ${sorteio.winnerCount}`);
            embed.setColor('#00FF00');
        } else {
            //console.log(`Atualizando embed sem vencedores`);
            embed.setDescription(`${sorteio.description}\n\n**Não houve participantes suficientes para este sorteio!**\n\n\`👑\` **Organizador:** <@${sorteio.hostedBy}>\n\`🏆\` **Ganhadores:** ${sorteio.winnerCount}`);
            embed.setColor('#FF0000');
        }

        // Desativar botões
        const components = message.components;
        for (const row of components) {
            for (const component of row.components) {
                component.data.disabled = true;
            }
        }

        //console.log(`Atualizando mensagem do sorteio`);
        await message.edit({ embeds: [embed], components }).catch(err => {
            console.error(`Erro ao atualizar mensagem do sorteio: ${err.message}`);
        });

        // Anunciar vencedores no canal
        if (winners.length > 0) {
            //console.log(`Enviando mensagem de anúncio de vencedores`);
            await channel.send({
                content: `🎉 Parabéns ${winners.map(id => `<@${id}>`).join(', ')}! Você${winners.length > 1 ? 's' : ''} ganhou ${sorteio.prize}!`,
                allowedMentions: { users: winners }
            }).catch(err => {
                console.error(`Erro ao enviar mensagem de anúncio: ${err.message}`);
            });

            // Enviar mensagem privada para cada vencedor
            for (const winnerId of winners) {
                try {
                    //console.log(`Enviando mensagem privada para o vencedor ${winnerId}`);
                    const user = await client.users.fetch(winnerId);

                    const dmEmbed = new EmbedBuilder()
                        .setTitle(`🎉 Parabéns! Você ganhou um sorteio!`)
                        .setDescription(`Você ganhou o sorteio **${sorteio.prize}**!\n\n${sorteio.description}\n\nClique no botão abaixo para ir ao canal do sorteio.`)
                        .setColor('#00FF00')
                        .setFooter({ text: `Sorteio criado por: ${(await client.users.fetch(sorteio.hostedBy).catch(() => ({ username: 'Desconhecido' }))).username}` })
                        .setTimestamp();

                    const returnButton = new ButtonBuilder()
                        .setLabel('Ir para o canal do sorteio')
                        .setStyle(5)
                        .setURL(`https://discord.com/channels/${sorteio.guildId}/${sorteio.channelId}/${sorteio.messageId}`);

                    const row = new ActionRowBuilder().addComponents(returnButton);

                    await user.send({ embeds: [dmEmbed], components: [row] }).catch(err => {
                        //console.log(`Não foi possível enviar mensagem privada para ${user.tag}: ${err.message}`);
                    });
                } catch (error) {
                    console.error(`Erro ao processar mensagem privada para ${winnerId}:`, error);
                }
            }

            // Adicionar cargo ao vencedor, se configurado
            if (sorteio.winnerRole) {
                const role = guild.roles.cache.get(sorteio.winnerRole);
                if (role) {
                    for (const winnerId of winners) {
                        try {
                            //console.log(`Adicionando cargo ${role.name} ao vencedor ${winnerId}`);
                            const member = await guild.members.fetch(winnerId);
                            await member.roles.add(role);
                        } catch (err) {
                            console.error(`Erro ao adicionar cargo ao vencedor ${winnerId}:`, err);
                        }
                    }
                } else {
                    console.error(`Cargo ${sorteio.winnerRole} não encontrado no servidor`);
                }
            }
        } else {
            //console.log(`Enviando mensagem de sorteio sem vencedores`);
            await channel.send(`😢 Não houve participantes suficientes para o sorteio **${sorteio.prize}**!`).catch(err => {
                console.error(`Erro ao enviar mensagem de sorteio sem vencedores: ${err.message}`);
            });
        }

        // Atualizar o sorteio no banco de dados
        //console.log(`Atualizando sorteio no banco de dados como finalizado`);
        updateGiveaway(sorteio.messageId, {
            ended: true,
            winners
        });

        //console.log(`Sorteio ${sorteio.prize} finalizado com sucesso`);
    } catch (error) {
        console.error(`Erro crítico ao finalizar sorteio ${sorteio.messageId}:`, error);

        // Marcar o sorteio como finalizado com erro
        updateGiveaway(sorteio.messageId, {
            ended: true,
            error: true,
            errorMessage: error.message
        });
    }
}


async function forcarFinalizacaoSorteio(client, messageId, forceWinner = true) {
    const sorteio = findGiveawayByMessageId(messageId);

    if (!sorteio) {
        return { success: false, message: 'Sorteio não encontrado' };
    }

    try {
        // Se forceWinner for true, garante que haja pelo menos um vencedor
        // se houver pelo menos um participante
        if (forceWinner && sorteio.participants.length > 0 &&
            (sorteio.winners.length === 0 || sorteio.winners.length < sorteio.winnerCount)) {

            // Forçar a seleção de vencedores
            const participants = [...sorteio.participants];
            const winners = [];

            for (let i = 0; i < Math.min(sorteio.winnerCount, participants.length); i++) {
                const winnerIndex = Math.floor(Math.random() * participants.length);
                winners.push(participants[winnerIndex]);
                participants.splice(winnerIndex, 1);
            }

            // Atualizar o sorteio com os vencedores forçados
            sorteio.winners = winners;
        }

        // Forçar a finalização
        await finalizarSorteio(client, sorteio);

        return {
            success: true,
            message: 'Sorteio finalizado com sucesso',
            winners: sorteio.winners
        };
    } catch (error) {
        console.error('Erro ao forçar finalização do sorteio:', error);
        return {
            success: false,
            message: 'Erro ao finalizar sorteio',
            error: error.message
        };
    }
}

module.exports = {
    setupGiveawayEnding,
    finalizarSorteio,
    forcarFinalizacaoSorteio,
    findGiveawayByMessageId
};