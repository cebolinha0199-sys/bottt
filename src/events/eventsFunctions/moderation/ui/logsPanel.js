const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');
const { saveConfig } = require('../config/saveConfig');
const { createConfigEmbed } = require('./utils');

async function handleInteraction(interaction, client, guildConfig) {
    try {
        // Log para debug
        //console.log('Interação recebida:', interaction.customId);

        switch (interaction.customId) {
            case 'mod_logs_panel':
                await showLogsPanel(interaction, guildConfig);
                break;
            case 'mod_logs_toggle':
                await toggleLogs(interaction, guildConfig);
                break;
            case 'mod_logs_security':
                await configureSecurityLogs(interaction, guildConfig);
                break;
            case 'mod_logs_moderation':
                await configureModerationLogs(interaction, guildConfig);
                break;
            case 'mod_logs_server':
                await configureServerLogs(interaction, guildConfig);
                break;
        }

        // Handler para seleção de canais
        try {
            if (interaction.isChannelSelectMenu()) {
                switch (interaction.customId) {
                    case 'mod_logs_security_channel':
                        await handleSecurityChannelSelect(interaction, guildConfig);
                        break;
                    case 'mod_logs_moderation_channel':
                        await handleModerationChannelSelect(interaction, guildConfig);
                        break;
                    case 'mod_logs_server_channel':
                        await handleServerChannelSelect(interaction, guildConfig);
                        break;
                }
                return;
            }
        } catch (error) {
            console.error('Erro ao processar interação:', error);
            await interaction.update({
                content: '❌ Ocorreu um erro ao processar sua solicitação.',
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('mod_logs_panel')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('<:voltar:1365849508059287633>')
                    )
                ],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Erro ao processar interação:', error);
        await handleError(interaction);
    }
}

async function showLogsPanel(interaction, guildConfig) {
    if (!guildConfig.logs) {
        guildConfig.logs = {
            enabled: false,
            securityChannel: null,
            moderationChannel: null,
            serverChannel: null
        };
        await saveConfig(interaction.guild.id, guildConfig);
    }

    const embed = createConfigEmbed(
        '📝 Configuração de Logs',
        'Configure os canais onde serão registrados os eventos do servidor.',
        '#00FF00'
    )
        .addFields(
            {
                name: '📊 Status',
                value: guildConfig.logs.enabled ? '✅ Ativado' : '❌ Desativado',
                inline: false
            },
            {
                name: '🛡️ Logs de Segurança',
                value: guildConfig.logs.securityChannel ?
                    `<#${guildConfig.logs.securityChannel}>` :
                    'Não configurado',
                inline: true
            },
            {
                name: '👮 Logs de Moderação',
                value: guildConfig.logs.moderationChannel ?
                    `<#${guildConfig.logs.moderationChannel}>` :
                    'Não configurado',
                inline: true
            },
            {
                name: '🏢 Logs do Servidor',
                value: guildConfig.logs.serverChannel ?
                    `<#${guildConfig.logs.serverChannel}>` :
                    'Não configurado',
                inline: true
            }
        );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_logs_security')
            .setLabel('Logs de Segurança')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛡️'),
        new ButtonBuilder()
            .setCustomId('mod_logs_moderation')
            .setLabel('Logs de Moderação')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👮'),
        new ButtonBuilder()
            .setCustomId('mod_logs_server')
            .setLabel('Logs do Servidor')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏢')
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('configModeracao')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>'),
        new ButtonBuilder()
            .setCustomId('mod_logs_toggle')
            .setLabel(guildConfig.logs.enabled ? 'Desativar Logs' : 'Ativar Logs')
            .setStyle(guildConfig.logs.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.logs.enabled ? '⏸️' : '▶️')
    );

    await interaction.update({
        embeds: [embed],
        components: [row2, row3],
        ephemeral: true
    });
}

async function toggleLogs(interaction, guildConfig) {
    guildConfig.logs.enabled = !guildConfig.logs.enabled;
    await saveConfig(interaction.guild.id, guildConfig);
    await showLogsPanel(interaction, guildConfig);
}

async function configureSecurityLogs(interaction, guildConfig) {
    const embed = createConfigEmbed(
        '🛡️ Configuração de Logs de Segurança',
        'Selecione o canal onde serão registrados os eventos de segurança.',
        '#FF0000'
    )
        .addFields(
            {
                name: 'Canal Atual',
                value: guildConfig.logs.securityChannel ?
                    `<#${guildConfig.logs.securityChannel}>` :
                    'Nenhum canal configurado',
                inline: false
            }
        );

    const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('mod_logs_security_channel')
        .setPlaceholder('Selecione o canal de logs')
        .setChannelTypes([ChannelType.GuildText]);

    const row1 = new ActionRowBuilder().addComponents(channelSelect);
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_logs_panel')
            .setLabel('Voltar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>')
    );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2],
        ephemeral: true
    });
}

async function configureModerationLogs(interaction, guildConfig) {
    const embed = createConfigEmbed(
        '👮 Configuração de Logs de Moderação',
        'Selecione o canal onde serão registrados os eventos de moderação.',
        '#0099FF'
    )
        .addFields(
            {
                name: 'Canal Atual',
                value: guildConfig.logs.moderationChannel ?
                    `<#${guildConfig.logs.moderationChannel}>` :
                    'Nenhum canal configurado',
                inline: false
            }
        );

    const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('mod_logs_moderation_channel')
        .setPlaceholder('Selecione o canal de logs')
        .setChannelTypes([ChannelType.GuildText]);

    const row1 = new ActionRowBuilder().addComponents(channelSelect);
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_logs_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>')
    );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2],
        ephemeral: true
    });
}

async function configureServerLogs(interaction, guildConfig) {
    const embed = createConfigEmbed(
        '🏢 Configuração de Logs do Servidor',
        'Selecione o canal onde serão registrados os eventos do servidor.',
        '#00FF00'
    )
        .addFields(
            {
                name: 'Canal Atual',
                value: guildConfig.logs.serverChannel ?
                    `<#${guildConfig.logs.serverChannel}>` :
                    'Nenhum canal configurado',
                inline: false
            }
        );

    const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('mod_logs_server_channel')
        .setPlaceholder('Selecione o canal de logs')
        .setChannelTypes([ChannelType.GuildText]);

    const row1 = new ActionRowBuilder().addComponents(channelSelect);
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_logs_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>')
    );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2],
        ephemeral: true
    });
}

// Handlers para seleção de canais
async function handleSecurityChannelSelect(interaction, guildConfig) {
    try {
        const selectedChannel = interaction.values[0];
        guildConfig.logs.securityChannel = selectedChannel;
        await saveConfig(interaction.guild.id, guildConfig);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Configuração de Logs de Segurança')
            .setDescription(`Canal de logs configurado com sucesso para <#${selectedChannel}>`)
            .setColor('#00FF00')
            .addFields({
                name: 'Status',
                value: '✅ Configuração salva com sucesso!',
                inline: true
            });

        // Usar update ao invés de reply
        await interaction.update({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_logs_panel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:voltar:1365849508059287633>')
                )
            ],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao configurar canal de segurança:', error);

        // Em caso de erro, também usar update
        await interaction.update({
            content: '❌ Erro ao salvar configuração. Tente novamente.',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_logs_panel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:voltar:1365849508059287633>')
                )
            ],
            ephemeral: true
        });
    }
}

// Aplicar a mesma lógica para os outros handlers
async function handleModerationChannelSelect(interaction, guildConfig) {
    try {
        const selectedChannel = interaction.values[0];
        guildConfig.logs.moderationChannel = selectedChannel;
        await saveConfig(interaction.guild.id, guildConfig);

        const embed = new EmbedBuilder()
            .setTitle('👮 Configuração de Logs de Moderação')
            .setDescription(`Canal de logs configurado com sucesso para <#${selectedChannel}>`)
            .setColor('#00FF00')
            .addFields({
                name: 'Status',
                value: '✅ Configuração salva com sucesso!',
                inline: true
            });

        await interaction.update({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_logs_panel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:voltar:1365849508059287633>')
                )
            ],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao configurar canal de moderação:', error);
        await interaction.update({
            content: '❌ Erro ao salvar configuração. Tente novamente.',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_logs_panel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:voltar:1365849508059287633>')
                )
            ],
            ephemeral: true
        });
    }
}

async function handleServerChannelSelect(interaction, guildConfig) {
    try {
        const selectedChannel = interaction.values[0];
        guildConfig.logs.serverChannel = selectedChannel;
        await saveConfig(interaction.guild.id, guildConfig);

        const embed = new EmbedBuilder()
            .setTitle('🏢 Configuração de Logs do Servidor')
            .setDescription(`Canal de logs configurado com sucesso para <#${selectedChannel}>`)
            .setColor('#00FF00')
            .addFields({
                name: 'Status',
                value: '✅ Configuração salva com sucesso!',
                inline: true
            });

        await interaction.update({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_logs_panel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:voltar:1365849508059287633>')
                )
            ],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao configurar canal do servidor:', error);
        await interaction.update({
            content: '❌ Erro ao salvar configuração. Tente novamente.',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_logs_panel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:voltar:1365849508059287633>')
                )
            ],
            ephemeral: true
        });
    }
}

async function handleError(interaction) {
    const errorMessage = {
        content: '❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMessage);
    } else {
        await interaction.update(errorMessage);
    }
}

module.exports = { handleInteraction };