const userLinkCache = new Map();
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

async function checkMessage(message, guildConfig) {
    try {
        const configType = 'linkFilter'; // Tipo de configuração para links
        const content = message.content;
        const { member } = message;
        const config = guildConfig.autoMod[configType]; // configType será 'spamDetection', 'linkFilter' ou 'mentionFilter'

        // Verificar se o membro tem cargo isento
        if (member && config.whitelistedRoles?.some(roleId => member.roles.cache.has(roleId))) {
            console.log(`Usuário ${member.user.tag} possui cargo isento desta moderação`);
            return;
        }

        // Verificar se a mensagem contém URLs
        const links = content.match(URL_REGEX);
        if (!links) {
            //console.log('Nenhum link encontrado');
            return;
        }

        //console.log('Links encontrados:', links);

        // Verificar cada link
        let hasDisallowedLink = true; // Por padrão, considera link não permitido

        if (config.whitelistedDomains && config.whitelistedDomains.length > 0) {
            hasDisallowedLink = !links.some(link => {
                try {
                    const domain = new URL(link).hostname.toLowerCase();
                    return config.whitelistedDomains.some(allowed => 
                        domain.includes(allowed.toLowerCase())
                    );
                } catch (e) {
                    console.error('Erro ao processar URL:', e);
                    return false;
                }
            });
        }

        //console.log('Link permitido?', !hasDisallowedLink);

        if (hasDisallowedLink) {
            //console.log('Link não permitido detectado, executando ações...');
            //console.log('Ação configurada:', config.action);

            // Tentar deletar a mensagem primeiro
            try {
                await message.delete();
                //.log('Mensagem deletada com sucesso');
            } catch (error) {
                console.error('Erro ao deletar mensagem:', error);
            }

            // Executar ação configurada
            if (config.action) {
                try {
                    const member = await guild.members.fetch(author.id);
                    
                    switch (config.action) {
                        case 'timeout':
                            if (member.moderatable) {
                                await member.timeout(
                                    (config.duration || 5) * 60 * 1000,
                                    'Auto-Moderação: Link não permitido'
                                );
                                await channel.send(`${author}, você foi silenciado por ${config.duration || 5} minutos por enviar links não permitidos.`);
                            }
                            break;

                        case 'kick':
                            if (member.kickable) {
                                await member.kick('Auto-Moderação: Link não permitido');
                                await channel.send(`${author.tag} foi expulso por enviar links não permitidos.`);
                            }
                            break;

                        case 'ban':
                            if (member.bannable) {
                                await member.ban({
                                    reason: 'Auto-Moderação: Link não permitido'
                                });
                                await channel.send(`${author.tag} foi banido por enviar links não permitidos.`);
                            }
                            break;

                        case 'warn':
                            await channel.send(`${author}, **AVISO**: Links não são permitidos neste servidor!`);
                            break;

                        default:
                            //console.log('Nenhuma ação adicional configurada');
                            break;
                    }

                    //console.log(`Ação ${config.action} executada com sucesso`);

                } catch (error) {
                    console.error(`Erro ao executar ação ${config.action}:`, error);
                }
            }

            // Logging
            if (guildConfig.logs?.enabled && guildConfig.logs.moderationChannel) {
                try {
                    const logChannel = guild.channels.cache.get(guildConfig.logs.moderationChannel);
                    if (logChannel) {
                        await logChannel.send({
                            content: `🔗 **LINK FILTRADO**\n` +
                                    `**Usuário:** ${author.tag} (${author.id})\n` +
                                    `**Canal:** ${channel.name}\n` +
                                    `**Ação:** ${getActionName(config.action)}\n` +
                                    `**Links:** ${links.join(', ')}`
                        });
                    }
                } catch (error) {
                    console.error('Erro ao enviar log:', error);
                }
            }
        }

    } catch (error) {
        console.error('Erro no filtro de links:', error);
    }
}

function getActionName(actionCode) {
    const actions = {
        'delete': 'Deletar Mensagem',
        'timeout': 'Timeout (Castigo)',
        'warn': 'Avisar Usuário',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário'
    };
    return actions[actionCode] || 'Desconhecida';
}

module.exports = { checkMessage };