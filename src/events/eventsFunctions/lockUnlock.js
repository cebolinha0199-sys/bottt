const {
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");
const { JsonDatabase } = require("wio.db");
const dbLockUnlock = new JsonDatabase({ databasePath: "./databases/dbLock_unlock.json" });

// Função para inicializar o sistema de fechamento/abertura de canais
function initializeLockUnlockSystem(client) {
    // Verificar a cada minuto se há canais para fechar/abrir
    setInterval(() => {
        checkChannelsToLockUnlock(client);
    }, 60000); // 60000 ms = 1 minuto
}

// Função para converter horário de Nova York para Brasília (UTC-3)
function getCurrentBrasiliaTime() {
    // Obter a data atual em UTC
    const now = new Date();

    // Ajustar para o fuso horário de Brasília (UTC-3)
    // Obtém o offset em minutos e converte para milissegundos
    const brasiliaOffset = -3 * 60 * 60 * 1000;
    const utcOffset = now.getTimezoneOffset() * 60 * 1000;

    // Criar nova data ajustada para Brasília
    const brasiliaTime = new Date(now.getTime() + utcOffset + brasiliaOffset);

    return {
        hours: brasiliaTime.getHours(),
        minutes: brasiliaTime.getMinutes(),
        formatted: `${String(brasiliaTime.getHours()).padStart(2, '0')}:${String(brasiliaTime.getMinutes()).padStart(2, '0')}`
    };
}

// Função para verificar canais que precisam ser fechados ou abertos
async function checkChannelsToLockUnlock(client) {
    try {
        const lockConfigs = dbLockUnlock.get("channels") || [];
        if (lockConfigs.length === 0) return;

        // Obter a hora atual no fuso horário de Brasília
        const currentTime = getCurrentBrasiliaTime();
        const currentTimeFormatted = currentTime.formatted;

        for (const config of lockConfigs) {
            // Verificar se é hora de fechar o canal
            if (config.lockTime === currentTimeFormatted) {
                await lockChannel(client, config, currentTimeFormatted);
            }

            // Verificar se é hora de abrir o canal
            if (config.unlockTime === currentTimeFormatted) {
                await unlockChannel(client, config);
            }
        }
    } catch (error) {
        console.error("Erro ao verificar canais para fechar/abrir:", error);
    }
}

// Função para fechar um canal
async function lockChannel(client, config, currentTimeFormatted) {
    try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(config.channelId);
        if (!channel) return;

        // Modificar as permissões para impedir que @everyone envie mensagens
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false
        });

        // Se a configuração pedir para limpar o chat
        if (config.clearMessages) {
            await clearAllMessages(channel);
        } else {
            // Excluir a mensagem de abertura anterior, se existir
            if (config.lastUnlockMessageId) {
                try {
                    const oldMessage = await channel.messages.fetch(config.lastUnlockMessageId).catch(() => null);
                    if (oldMessage) await oldMessage.delete().catch(err => console.error("Erro ao excluir mensagem antiga:", err));
                } catch (error) {
                    console.error("Erro ao buscar/excluir mensagem antiga:", error);
                }
            }
        }

        // Calcular o tempo de abertura em formato legível
        const unlockTimeFormatted = config.unlockTime;

        // Criar embed para notificar sobre o fechamento
        const embed = new EmbedBuilder()
            .setTitle("🔒 Canal Fechado")
            .setDescription(`Este canal foi fechado automaticamente e será reaberto às **${unlockTimeFormatted}** (Horário de Brasília).`)
            .setColor(0xE74C3C) // Vermelho
            .setTimestamp()
            .setFooter({ text: `ID de Configuração: ${config.id} • Hoje às ${currentTimeFormatted}` });

        // Botão desativado "Mensagem do Sistema"
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('systemMessage')
                    .setLabel('Mensagem do Sistema')
                    .setStyle(2) // Estilo secundário (cinza)
                    .setDisabled(true)
            );

        // Enviar a mensagem e armazenar sua ID
        const sentMessage = await channel.send({ embeds: [embed], components: [row] });

        // Atualizar a configuração com a ID da nova mensagem de fechamento
        const lockConfigs = dbLockUnlock.get("channels") || [];
        const configIndex = lockConfigs.findIndex(c =>
            c.id === config.id && c.guildId === config.guildId
        );

        if (configIndex !== -1) {
            lockConfigs[configIndex].lastLockMessageId = sentMessage.id;
            dbLockUnlock.set("channels", lockConfigs);
        }

        //console.log(`Canal ${channel.name} fechado automaticamente às ${currentTimeFormatted}`);
    } catch (error) {
        console.error("Erro ao fechar canal:", error);
    }
}

/**
 * Função recursiva para limpar todas as mensagens do canal até que não seja mais possível
 * @param {TextChannel} channel - O canal para limpar mensagens
 * @param {number} attempt - Número da tentativa atual (para logs)
 * @param {number} totalDeleted - Total de mensagens excluídas até agora
 * @returns {Promise<void>}
 */
async function clearAllMessages(channel, attempt = 1, totalDeleted = 0) {
    try {
        // Buscar mensagens (limite de 100 por vez)
        const messages = await channel.messages.fetch({ limit: 100 });

        if (messages.size === 0) {
            //console.log(`Todas as mensagens possíveis foram excluídas do canal ${channel.name}. Total: ${totalDeleted}`);
            return;
        }

        // Tentar excluir em massa primeiro (mais eficiente)
        try {
            const deletedCount = await channel.bulkDelete(messages, true)
                .then(deleted => deleted.size)
                .catch(() => 0);

            // Se conseguimos excluir algumas mensagens em massa
            if (deletedCount > 0) {
                //console.log(`Excluídas ${deletedCount} mensagens em massa na tentativa ${attempt}.`);
                // Chamar recursivamente para continuar excluindo
                return clearAllMessages(channel, attempt + 1, totalDeleted + deletedCount);
            }
        } catch (bulkError) {
            console.log(`Erro na exclusão em massa: ${bulkError.message}`);
            // Continua para tentar excluir individualmente
        }

        // Se bulkDelete falhar ou não excluir nada, tentar excluir individualmente
        let individualDeleted = 0;
        const messagesToDelete = Array.from(messages.values());

        for (const msg of messagesToDelete) {
            try {
                await msg.delete();
                individualDeleted++;
                totalDeleted++;

                // Pequeno atraso para evitar rate limits
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (individualError) {
                // Ignora erros individuais e continua tentando com outras mensagens
                if (individualError.code !== 10008) { // Ignora erro de mensagem já excluída
                    console.log(`Não foi possível excluir mensagem: ${individualError.message}`);
                }
            }
        }

        if (individualDeleted > 0) {
            //console.log(`Excluídas ${individualDeleted} mensagens individualmente na tentativa ${attempt}.`);
            // Chamar recursivamente para continuar excluindo
            return clearAllMessages(channel, attempt + 1, totalDeleted);
        } else {
            console.log(`Não foi possível excluir mais mensagens após ${attempt} tentativas. Total excluído: ${totalDeleted}`);
            return;
        }
    } catch (error) {
        console.error(`Erro ao limpar mensagens (tentativa ${attempt}):`, error);
        // Se ocorrer um erro, mas já tivermos excluído algumas mensagens, tentar novamente após um atraso
        if (totalDeleted > 0) {
            //console.log(`Aguardando 5 segundos antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return clearAllMessages(channel, attempt + 1, totalDeleted);
        }
    }
}

// Função para abrir um canal
async function unlockChannel(client, config) {
    try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(config.channelId);
        if (!channel) return;

        // Modificar as permissões para permitir que @everyone envie mensagens novamente
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: true
        });

        // Excluir a mensagem de fechamento anterior, se existir
        if (config.lastLockMessageId) {
            try {
                const oldMessage = await channel.messages.fetch(config.lastLockMessageId).catch(() => null);
                if (oldMessage) await oldMessage.delete().catch(err => console.error("Erro ao excluir mensagem antiga:", err));
            } catch (error) {
                console.error("Erro ao buscar/excluir mensagem antiga:", error);
            }
        }

        // Obter o horário atual no formato de Brasília
        const currentTime = getCurrentBrasiliaTime();
        const currentTimeFormatted = currentTime.formatted;

        // Criar embed para notificar sobre a abertura
        const embed = new EmbedBuilder()
            .setTitle("🔓 Canal Aberto")
            .setDescription("Este canal foi aberto automaticamente e agora está disponível para envio de mensagens.")
            .setColor(0x2ECC71) // Verde
            .setTimestamp()
            .setFooter({ text: `ID de Configuração: ${config.id} • Hoje às ${currentTimeFormatted}` });

        // Botão desativado "Mensagem do Sistema"
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('systemMessage')
                    .setLabel('Mensagem do Sistema')
                    .setStyle(2) // Estilo secundário (cinza)
                    .setDisabled(true)
            );

        // Enviar a mensagem e armazenar sua ID
        const sentMessage = await channel.send({ embeds: [embed], components: [row] });

        // Atualizar a configuração com a ID da nova mensagem de abertura
        const lockConfigs = dbLockUnlock.get("channels") || [];
        const configIndex = lockConfigs.findIndex(c =>
            c.id === config.id && c.guildId === config.guildId
        );

        if (configIndex !== -1) {
            lockConfigs[configIndex].lastUnlockMessageId = sentMessage.id;
            dbLockUnlock.set("channels", lockConfigs);
        }

        //console.log(`Canal ${channel.name} aberto automaticamente às ${currentTimeFormatted}`);
    } catch (error) {
        console.error("Erro ao abrir canal:", error);
    }
}

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        try {
            // Manipulador do botão principal de configuração de lock/unlock
            if (interaction.isButton() && interaction.customId === "configLockUnlock") {
                // Verificar permissões do usuário
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({
                        content: "❌ Você não tem permissão para gerenciar canais.",
                        ephemeral: true
                    });
                }

                // Buscar configurações existentes para exibir na mensagem
                const lockConfigs = dbLockUnlock.get("channels") || [];

                // Filtrar apenas as configurações do servidor atual
                const serverConfigs = lockConfigs.filter(config => config.guildId === interaction.guild.id);

                // Criar uma lista formatada de configurações existentes
                let listaConfigs = "";
                if (serverConfigs.length > 0) {
                    listaConfigs = "**Configurações de Fechamento/Abertura de Canais:**\n";
                    serverConfigs.forEach((config, index) => {
                        const channel = interaction.guild.channels.cache.get(config.channelId);
                        const channelName = channel ? channel.name : "Canal não encontrado";
                        listaConfigs += `${index + 1}. **ID:** \`${config.id}\` | **Canal:** <#${config.channelId}> (${channelName})\n`;
                        listaConfigs += `   **Fecha às:** ${config.lockTime} | **Abre às:** ${config.unlockTime} | **Limpar mensagens:** ${config.clearMessages ? "Sim" : "Não"}\n`;
                    });
                    listaConfigs += "\n";
                } else {
                    listaConfigs = "**Não há configurações de fechamento/abertura para este servidor.**\n\n";
                }

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('addLockUnlock')
                            .setLabel('Adicionar Configuração')
                            .setStyle(3) // Verde
                            .setEmoji('🔒'),
                        new ButtonBuilder()
                            .setCustomId('removeLockUnlock')
                            .setLabel('Remover Configuração')
                            .setStyle(4) // Vermelho
                            .setEmoji('🗑️')
                    );

                // Construir a mensagem com a lista de configurações
                const mensagem = `**Sistema de Fechamento/Abertura Automática de Canais**\n\n${listaConfigs}Escolha uma opção:`;

                await interaction.reply({
                    content: mensagem,
                    components: [row],
                    ephemeral: true
                });
            }

            // Manipulador para o botão de adicionar configuração
            if (interaction.isButton() && interaction.customId === "addLockUnlock") {
                // Verificar permissões do usuário
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({
                        content: "❌ Você não tem permissão para gerenciar canais.",
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('modalAddLockUnlock')
                    .setTitle('Configurar Fechamento/Abertura de Canal');

                const configIdInput = new TextInputBuilder()
                    .setCustomId('configId')
                    .setLabel('Nome/ID da configuração (identificação)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: noite-geral')
                    .setRequired(true);

                const channelIdInput = new TextInputBuilder()
                    .setCustomId('channelId')
                    .setLabel('ID do Canal')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 123456789012345678')
                    .setRequired(true);

                const lockTimeInput = new TextInputBuilder()
                    .setCustomId('lockTime')
                    .setLabel('Horário de fechamento (formato 24h)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 22:00 (horário de Brasília)')
                    .setRequired(true);

                const unlockTimeInput = new TextInputBuilder()
                    .setCustomId('unlockTime')
                    .setLabel('Horário de abertura (formato 24h)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 08:00 (horário de Brasília)')
                    .setRequired(true);

                const clearMessagesInput = new TextInputBuilder()
                    .setCustomId('clearMessages')
                    .setLabel('Limpar mensagens ao fechar? (sim/não)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Digite sim ou não')
                    .setRequired(true);

                const actionRow1 = new ActionRowBuilder().addComponents(configIdInput);
                const actionRow2 = new ActionRowBuilder().addComponents(channelIdInput);
                const actionRow3 = new ActionRowBuilder().addComponents(lockTimeInput);
                const actionRow4 = new ActionRowBuilder().addComponents(unlockTimeInput);
                const actionRow5 = new ActionRowBuilder().addComponents(clearMessagesInput);

                modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4, actionRow5);

                await interaction.showModal(modal);
            }

            // Manipulador para o botão de remover configuração
            if (interaction.isButton() && interaction.customId === "removeLockUnlock") {
                // Verificar permissões do usuário
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({
                        content: "❌ Você não tem permissão para gerenciar canais.",
                        ephemeral: true
                    });
                }

                // Buscar configurações existentes no banco de dados
                const lockConfigs = dbLockUnlock.get("channels") || [];

                // Filtrar apenas as configurações do servidor atual
                const serverConfigs = lockConfigs.filter(config => config.guildId === interaction.guild.id);

                if (serverConfigs.length === 0) {
                    return interaction.reply({
                        content: "❌ Não há configurações de fechamento/abertura para remover neste servidor.",
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('modalRemoveLockUnlock')
                    .setTitle('Remover Configuração de Fechamento/Abertura');

                const configIdInput = new TextInputBuilder()
                    .setCustomId('configId')
                    .setLabel('ID da configuração a ser removida')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Digite o ID exato da configuração')
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(configIdInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }

            // Processando o modal de adição de configuração
            if (interaction.type == InteractionType.ModalSubmit && interaction.customId === "modalAddLockUnlock") {
                try {
                    // Verificar permissões do usuário
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                        return interaction.reply({
                            content: "❌ Você não tem permissão para gerenciar canais.",
                            ephemeral: true
                        });
                    }

                    const configId = interaction.fields.getTextInputValue('configId');
                    const channelId = interaction.fields.getTextInputValue('channelId');
                    const lockTime = interaction.fields.getTextInputValue('lockTime');
                    const unlockTime = interaction.fields.getTextInputValue('unlockTime');
                    const clearMessagesInput = interaction.fields.getTextInputValue('clearMessages').toLowerCase();

                    // Validar formato das horas
                    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

                    if (!timeRegex.test(lockTime)) {
                        return interaction.reply({
                            content: "❌ Formato de horário de fechamento inválido. Use o formato HH:MM (ex: 22:00).",
                            ephemeral: true
                        });
                    }

                    if (!timeRegex.test(unlockTime)) {
                        return interaction.reply({
                            content: "❌ Formato de horário de abertura inválido. Use o formato HH:MM (ex: 08:00).",
                            ephemeral: true
                        });
                    }

                    // Validar opção de limpar mensagens
                    if (clearMessagesInput !== "sim" && clearMessagesInput !== "não" &&
                        clearMessagesInput !== "s" && clearMessagesInput !== "n") {
                        return interaction.reply({
                            content: "❌ Opção de limpar mensagens inválida. Digite 'sim' ou 'não'.",
                            ephemeral: true
                        });
                    }

                    const clearMessages = clearMessagesInput === "sim" || clearMessagesInput === "s";

                    // Verificar se o canal existe
                    const channel = interaction.guild.channels.cache.get(channelId);
                    if (!channel) {
                        return interaction.reply({
                            content: `❌ Erro: O canal com ID ${channelId} não foi encontrado no servidor.`,
                            ephemeral: true
                        });
                    }

                    // Verificar se o ID da configuração já existe para este servidor
                    const lockConfigs = dbLockUnlock.get("channels") || [];
                    if (lockConfigs.some(config => config.id === configId && config.guildId === interaction.guild.id)) {
                        return interaction.reply({
                            content: `❌ Erro: Já existe uma configuração com o ID "${configId}" neste servidor. Por favor, escolha outro ID.`,
                            ephemeral: true
                        });
                    }

                    // Adicionar nova configuração ao banco de dados
                    lockConfigs.push({
                        id: configId,
                        guildId: interaction.guild.id,
                        channelId: channelId,
                        lockTime: lockTime,
                        unlockTime: unlockTime,
                        clearMessages: clearMessages,
                        lastLockMessageId: null,
                        lastUnlockMessageId: null
                    });

                    dbLockUnlock.set("channels", lockConfigs);

                    // Criar um embed para a resposta de sucesso
                    const embed = new EmbedBuilder()
                        .setTitle("✅ Configuração de Fechamento/Abertura Adicionada")
                        .setDescription("A configuração foi adicionada com sucesso!")
                        .addFields(
                            { name: "ID da Configuração", value: configId, inline: true },
                            { name: "Canal", value: `<#${channelId}>`, inline: true },
                            { name: "Horário de Fechamento", value: lockTime + " (Brasília)", inline: true },
                            { name: "Horário de Abertura", value: unlockTime + " (Brasília)", inline: true },
                            { name: "Limpar Mensagens", value: clearMessages ? "Sim" : "Não", inline: true }
                        )
                        .setColor(0x2ECC71) // Verde
                        .setTimestamp();

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error("Erro ao adicionar configuração de fechamento/abertura:", error);
                    await interaction.reply({
                        content: "❌ Ocorreu um erro ao configurar o fechamento/abertura do canal.",
                        ephemeral: true
                    });
                }
            }

            // Processando o modal de remoção de configuração
            if (interaction.type == InteractionType.ModalSubmit && interaction.customId === "modalRemoveLockUnlock") {
                try {
                    // Verificar permissões do usuário
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                        return interaction.reply({
                            content: "❌ Você não tem permissão para gerenciar canais.",
                            ephemeral: true
                        });
                    }

                    const configId = interaction.fields.getTextInputValue('configId');

                    // Buscar configurações existentes
                    const lockConfigs = dbLockUnlock.get("channels") || [];
                    const configIndex = lockConfigs.findIndex(config =>
                        config.id === configId && config.guildId === interaction.guild.id
                    );

                    if (configIndex === -1) {
                        return interaction.reply({
                            content: `❌ Erro: Não foi encontrada nenhuma configuração com o ID "${configId}" neste servidor.`,
                            ephemeral: true
                        });
                    }

                    // Remover a configuração do array
                    const configRemovida = lockConfigs[configIndex];
                    lockConfigs.splice(configIndex, 1);

                    // Atualizar o banco de dados
                    dbLockUnlock.set("channels", lockConfigs);

                    // Criar um embed para a resposta de sucesso
                    const embed = new EmbedBuilder()
                        .setTitle("✅ Configuração de Fechamento/Abertura Removida")
                        .setDescription("A configuração foi removida com sucesso!")
                        .addFields(
                            { name: "ID da Configuração", value: configRemovida.id, inline: true },
                            { name: "Canal", value: `<#${configRemovida.channelId}>`, inline: true },
                            { name: "Horário de Fechamento", value: configRemovida.lockTime + " (Brasília)", inline: true },
                            { name: "Horário de Abertura", value: configRemovida.unlockTime + " (Brasília)", inline: true },
                            { name: "Limpar Mensagens", value: configRemovida.clearMessages ? "Sim" : "Não", inline: true }
                        )
                        .setColor(0xE74C3C) // Vermelho
                        .setTimestamp();

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error("Erro ao remover configuração de fechamento/abertura:", error);
                    await interaction.reply({
                        content: "❌ Ocorreu um erro ao remover a configuração de fechamento/abertura.",
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error("Erro no manipulador de interações de fechamento/abertura de canais:", error);
            // Tentar enviar uma mensagem de erro genérica caso algo dê errado
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: "❌ Ocorreu um erro ao processar sua solicitação.",
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: "❌ Ocorreu um erro ao processar sua solicitação.",
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error("Erro ao enviar mensagem de erro:", followUpError);
            }
        }
    },
    initializeLockUnlockSystem // Exportar a função de inicialização
};