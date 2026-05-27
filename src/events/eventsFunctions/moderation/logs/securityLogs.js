const { EmbedBuilder, AuditLogEvent } = require('discord.js');


async function logBan(banInfo, config) {
    try {
        //console.log('[logBan] Iniciando log de banimento para:', banInfo.user.tag);

        const logChannel = banInfo.guild.channels.cache.get(config.logs.securityChannel);
        if (!logChannel) {
            console.error('[logBan] Canal de logs não encontrado');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🔨 Usuário Banido')
            .setColor('#FF0000')
            .setThumbnail(banInfo.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .addFields(
                {
                    name: '👤 Usuário Banido',
                    value: `${banInfo.user.tag} (${banInfo.user.id})`,
                    inline: true
                },
                {
                    name: '🛠️ Moderador',
                    value: banInfo.executor ? `${banInfo.executor.tag} (${banInfo.executor.id})` : 'Desconhecido',
                    inline: true
                },
                {
                    name: '📝 Razão',
                    value: banInfo.reason || 'Nenhuma razão fornecida',
                    inline: false
                }
            )
            .setFooter({ text: `ID do Usuário: ${banInfo.user.id}` });

        await logChannel.send({ embeds: [embed] });
        //console.log('[logBan] Log enviado com sucesso');

    } catch (error) {
        console.error('[logBan] Erro ao processar log:', error);
        console.error(error);
    }
}

async function logUnban(unbanInfo, config) {
    try {
        // console.log('[DEBUG] Iniciando logUnban:', {
        //     user: unbanInfo.user.tag,
        //     guild: unbanInfo.guild.name,
        //     channelId: config.logs.securityChannel
        // });

        const logChannel = unbanInfo.guild.channels.cache.get(config.logs.securityChannel);
        if (!logChannel) {
            throw new Error(`Canal de logs não encontrado: ${config.logs.securityChannel}`);
        }

        // Verificar permissões do bot no canal
        const botPermissions = logChannel.permissionsFor(unbanInfo.guild.members.me);
        if (!botPermissions?.has('SendMessages') || !botPermissions.has('EmbedLinks')) {
            throw new Error('Bot não tem permissões necessárias no canal de logs');
        }

        const embed = new EmbedBuilder()
            .setTitle('🔓 Usuário Desbanido')
            .setColor('#00FF00')
            .setThumbnail(unbanInfo.user.displayAvatarURL({ dynamic: true, size: 128 }))
            .setDescription(`**Usuário ${unbanInfo.user} foi desbanido do servidor**`)
            .addFields([
                {
                    name: '👤 Usuário',
                    value: `${unbanInfo.user.tag}\n(${unbanInfo.user.id})`,
                    inline: true
                },
                {
                    name: '🛠️ Desbanido por',
                    value: unbanInfo.executor 
                        ? `${unbanInfo.executor.tag}\n(${unbanInfo.executor.id})`
                        : 'Sistema/Desconhecido',
                    inline: true
                },
                {
                    name: '📝 Motivo',
                    value: unbanInfo.reason || 'Nenhum motivo fornecido',
                    inline: false
                }
            ])
            .setTimestamp(unbanInfo.timestamp)
            .setFooter({ 
                text: `ID: ${unbanInfo.auditLogId || 'N/A'} • ${unbanInfo.guild.name}`,
                iconURL: unbanInfo.guild.iconURL({ dynamic: true })
            });

        const sent = await logChannel.send({ embeds: [embed] });
        //console.log('[DEBUG] Log de unban enviado com sucesso:', sent.id);

        return true;
    } catch (error) {
        console.error('[ERRO] Falha ao enviar log de unban:', {
            error: error.message,
            stack: error.stack,
            guildId: unbanInfo.guild.id,
            userId: unbanInfo.user.id
        });
        return false;
    }
}

async function logKick(member, config, kickLog) {
    try {
        // console.log('Processando kick:', {
        //     userId: member.user.id,
        //     guildId: member.guild.id
        // });

        const executor = kickLog.executor;
        const reason = kickLog.reason || 'Nenhuma razão fornecida';

        const embed = new EmbedBuilder()
            .setTitle('👢 Usuário Expulso')
            .setColor('#FFA500')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .addFields(
                {
                    name: '👤 Usuário Expulso',
                    value: `${member.user.tag} (${member.user.id})`,
                    inline: true
                },
                {
                    name: '🛠️ Moderador',
                    value: executor ? `${executor.tag} (${executor.id})` : 'Desconhecido',
                    inline: true
                },
                {
                    name: '📝 Razão',
                    value: reason,
                    inline: false
                }
            )
            .setFooter({ text: `ID do Usuário: ${member.user.id}` });

        const logChannel = member.guild.channels.cache.get(config.logs.securityChannel);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
            //console.log('Log de expulsão enviado com sucesso');
        }

    } catch (error) {
        console.error('Erro ao registrar expulsão:', error);
    }
}



module.exports = {
    logBan,
    logUnban,
    logKick
};