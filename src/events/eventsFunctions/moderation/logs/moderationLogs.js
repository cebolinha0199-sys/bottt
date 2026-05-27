const { EmbedBuilder, AuditLogEvent } = require('discord.js');

async function logMemberUpdate(oldMember, newMember, config) {
    try {
        // Inicializar array de mudanças
        const changes = [];

        await new Promise(resolve => setTimeout(resolve, 20000));

        const auditLogs = await newMember.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberUpdate,
            limit: 1
        });

        const log = auditLogs.entries.first();
        const executor = log?.executor;

        // Se não houver log ou não corresponder ao membro, retornar
        if (!log || log.target.id !== newMember.id) return;

        // Verificar mudanças de nickname
        if (oldMember.nickname !== newMember.nickname) {
            changes.push({
                name: '📝 Nickname Alterado',
                value: `**Antigo:** ${oldMember.nickname || 'Nenhum'}\n**Novo:** ${newMember.nickname || 'Nenhum'}`
            });
        }

        // Verificar mudanças de cargos
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

        if (addedRoles.size > 0) {
            changes.push({
                name: '➕ Cargos Adicionados',
                value: addedRoles.map(r => `\`${r.name}\``).join(', ') || 'Nenhum'
            });
        }

        if (removedRoles.size > 0) {
            changes.push({
                name: '➖ Cargos Removidos',
                value: removedRoles.map(r => `\`${r.name}\``).join(', ') || 'Nenhum'
            });
        }

        // Verificar mudanças de timeout
        if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
            changes.push({
                name: '🔇 Timeout Aplicado',
                value: `Duração: ${getDuration(newMember.communicationDisabledUntil)}`
            });
        } else if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
            changes.push({
                name: '🔊 Timeout Removido',
                value: 'O usuário pode falar novamente'
            });
        }

        // Se houver mudanças, criar e enviar o embed
        if (changes.length > 0) {
            //console.log('Mudanças detectadas:', changes);

            const embed = new EmbedBuilder()
                .setTitle('👤 Membro Atualizado')
                .setColor('#FFAA00')
                .setTimestamp()
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { 
                        name: '👤 Usuário', 
                        value: `${newMember.user.tag} (${newMember.id})`, 
                        inline: true 
                    },
                    { 
                        name: '🛠️ Moderador', 
                        value: executor ? `${executor.tag} (${executor.id})` : 'Desconhecido', 
                        inline: true 
                    },
                    { 
                        name: '\u200B', 
                        value: '\u200B', 
                        inline: true 
                    },
                    ...changes
                )
                .setFooter({ text: `ID: ${newMember.id}` });

            const logChannel = newMember.guild.channels.cache.get(config.logs.moderationChannel);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] })
                    //.then(() => console.log('Log de atualização enviado com sucesso'))
                    .catch(err => console.error('Erro ao enviar log:', err));
            } else {
                console.log('Canal de logs não encontrado:', config.logs.moderationChannel);
            }
        } else {
            //console.log('Nenhuma mudança significativa detectada');
        }
    } catch (error) {
        console.error('Erro ao registrar atualização de membro:', error);
    }
}

async function logMessageDelete(message, config) {
    try {
        // console.log('Iniciando logMessageDelete:', {
        //     channelId: message.channel.id,
        //     messageId: message.id,
        //     content: message.content,
        //     hasAttachments: message.attachments.size > 0,
        //     hasEmbeds: message.embeds.length > 0
        // });

        // Melhorar a verificação de conteúdo
        if (!message.content && !message.attachments.size && !message.embeds.length) {
            //console.log('Mensagem sem conteúdo, anexos ou embeds, ignorando');
            return;
        }

        const logChannel = message.guild.channels.cache.get(config.logs.moderationChannel);
        if (!logChannel) {
            console.error('Canal de logs não encontrado:', config.logs.moderationChannel);
            return;
        }

        let executor = 'Sistema/Usuário';
        try {
            const auditLogs = await message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 5
            });

            const log = auditLogs.entries.find(entry => {
                // Verificar se o log corresponde à mensagem deletada
                return entry.target?.id === message.author.id &&
                       Date.now() - entry.createdTimestamp < 5000;
            });

            if (log) {
                executor = log.executor ? `${log.executor.tag} (${log.executor.id})` : 'Sistema';
            }
        } catch (err) {
            console.error('Erro ao buscar audit logs:', err);
        }

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Mensagem Excluída')
            .setColor('#FF0000')
            .setTimestamp()
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: '📝 Canal', value: `${message.channel.name} (${message.channel.id})`, inline: true },
                { name: '🛠️ Deletado por', value: executor, inline: true }
            );

        // Adicionar conteúdo da mensagem se existir
        if (message.content) {
            embed.addFields({
                name: '📄 Conteúdo',
                value: message.content.length > 1024 ? 
                    message.content.slice(0, 1021) + '...' : 
                    message.content
            });
        }

        // Adicionar informações sobre anexos
        if (message.attachments.size > 0) {
            embed.addFields({
                name: '📎 Anexos',
                value: message.attachments.map(a => a.name).join(', ')
            });
        }

        // Adicionar informações sobre embeds
        if (message.embeds.length > 0) {
            embed.addFields({
                name: '🔗 Embeds',
                value: `${message.embeds.length} embed(s)`
            });
        }

        await logChannel.send({ embeds: [embed] })
            //.then(() => console.log('Log de mensagem deletada enviado com sucesso'))
            .catch(err => console.error('Erro ao enviar log:', err));

    } catch (error) {
        console.error('Erro em logMessageDelete:', error);
    }
}

async function logBulkDelete(messages, config) {
    try {
        const firstMessage = messages.first();
        const auditLogs = await firstMessage.guild.fetchAuditLogs({
            type: AuditLogEvent.MessageBulkDelete,
            limit: 1,
        });
        const log = auditLogs.entries.first();
        const executor = log?.executor;

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Mensagens Excluídas em Massa')
            .setColor('#FF0000')
            .setTimestamp()
            .addFields(
                { name: '📊 Quantidade', value: `${messages.size} mensagens`, inline: true },
                { name: '📝 Canal', value: `${firstMessage.channel.name} (${firstMessage.channel.id})`, inline: true },
                { name: '🛠️ Executado por', value: executor ? `${executor.tag} (${executor.id})` : 'Desconhecido', inline: true }
            );

        // Criar um arquivo de texto com as mensagens
        let messageLog = '';
        messages.forEach(msg => {
            messageLog += `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
        });

        const logChannel = firstMessage.guild.channels.cache.get(config.logs.moderationChannel);
        if (logChannel) {
            await logChannel.send({
                embeds: [embed],
                files: [{
                    attachment: Buffer.from(messageLog, 'utf8'),
                    name: 'mensagens-deletadas.txt'
                }]
            });
        }
    } catch (error) {
        console.error('Erro ao registrar exclusão em massa de mensagens:', error);
    }
}

// Funções auxiliares
function getDuration(date) {
    if (!date) return 'Indefinido';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

module.exports = {
    logMemberUpdate,
    logMessageDelete,
    logBulkDelete
};