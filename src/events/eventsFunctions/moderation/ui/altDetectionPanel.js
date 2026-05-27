const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { saveConfig } = require('../config/saveConfig');
const { createConfigEmbed } = require('./utils');

async function handleInteraction(interaction, client, guildConfig) {
    if (interaction.customId === 'mod_altdetect_panel') {
        await showAltDetectionPanel(interaction, guildConfig);
    } else if (interaction.customId === 'mod_altdetect_toggle') {
        await toggleAltDetection(interaction, guildConfig);
    } else if (interaction.customId === 'mod_altdetect_config') {
        await configureAltDetection(interaction, guildConfig);
    }
}

async function showAltDetectionPanel(interaction, guildConfig) {
    if (!guildConfig.altDetection) {
        guildConfig.altDetection = {
            enabled: false,
            minAccountAge: 7,
            action: 'notify',
            notificationChannel: null,
            whitelist: []
        };
        await saveConfig(interaction.guild.id, guildConfig);
    }

    const embed = createConfigEmbed(
        '👤 Detecção de Contas Alternativas',
        'Configure a proteção contra contas recém-criadas.',
        '#FF9900'
    )
        .addFields(
            {
                name: '📊 Status',
                value: guildConfig.altDetection.enabled ? '✅ Ativado' : '❌ Desativado',
                inline: true
            },
            {
                name: '⏰ Idade Mínima',
                value: `${guildConfig.altDetection.minAccountAge} dias`,
                inline: true
            },
            {
                name: '🎯 Ação',
                value: getActionName(guildConfig.altDetection.action),
                inline: true
            },
            {
                name: '📢 Canal de Notificação',
                value: guildConfig.altDetection.notificationChannel ?
                    `<#${guildConfig.altDetection.notificationChannel}>` :
                    'Não configurado',
                inline: true
            }
        );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_altdetect_config')
            .setLabel('Configurar')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:config:1365943645303214080>')
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('configModeracao')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>'),
        new ButtonBuilder()
            .setCustomId('mod_altdetect_toggle')
            .setLabel(guildConfig.altDetection.enabled ? 'Desativar' : 'Ativar')
            .setStyle(guildConfig.altDetection.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.altDetection.enabled ? '🔓' : '🔒')
    );

    await interaction.update({
        embeds: [embed],
        components: [row2, row3],
        ephemeral: true
    });
}

async function toggleAltDetection(interaction, guildConfig) {
    guildConfig.altDetection.enabled = !guildConfig.altDetection.enabled;
    await saveConfig(interaction.guild.id, guildConfig);
    await showAltDetectionPanel(interaction, guildConfig);
}

async function configureAltDetection(interaction, guildConfig) {
    const embed = createConfigEmbed(
        '⚙️ Configuração de Detecção de Alts',
        'Personalize as configurações de detecção de contas alternativas.',
        '#FF9900'
    );

    const ageSelect = new StringSelectMenuBuilder()
        .setCustomId('mod_altdetect_age')
        .setPlaceholder('Selecione a idade mínima da conta')
        .addOptions([
            { label: '1 dia', value: '1', emoji: '1️⃣' },
            { label: '3 dias', value: '3', emoji: '3️⃣' },
            { label: '7 dias', value: '7', emoji: '7️⃣' },
            { label: '14 dias', value: '14', emoji: '🔢' },
            { label: '30 dias', value: '30', emoji: '📅' }
        ]);

    const actionSelect = new StringSelectMenuBuilder()
        .setCustomId('mod_altdetect_action')
        .setPlaceholder('Selecione a ação a ser tomada')
        .addOptions([
            { label: 'Apenas Notificar', value: 'notify', emoji: '📢' },
            { label: 'Bloquear Entrada', value: 'block', emoji: '🚫' },
            { label: 'Requisitar Verificação', value: 'verify', emoji: '✅' }
        ]);

    const row1 = new ActionRowBuilder().addComponents(ageSelect);
    const row2 = new ActionRowBuilder().addComponents(actionSelect);
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_altdetect_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>')
    );

    await interaction.update({
        embeds: [embed],
        components: [row1, row2, row3],
        ephemeral: true
    });
}

function getActionName(actionCode) {
    const actions = {
        'notify': 'Apenas Notificar',
        'block': 'Bloquear Entrada',
        'verify': 'Requisitar Verificação'
    };
    return actions[actionCode] || 'Desconhecida';
}

module.exports = { handleInteraction };