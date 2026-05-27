const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadConfig } = require('../config/loadConfig');

/**
 * Exibe o painel principal de configuração de moderação
 * @param {Interaction} interaction - Interação do Discord
 * @param {Client} client - Cliente do Discord.js
 */
async function mainPanel(interaction, client) {
    // Carregar configuração atual
    const guildConfig = await loadConfig(interaction.guild.id);
    
    // Criar embed informativa
    const embed = new EmbedBuilder()
        .setTitle('🛡️ Configuração de Moderação')
        .setDescription('Configure os sistemas de proteção e moderação para seu servidor')
        .setColor('#FF5555')
        .addFields(
            { 
                name: '🔒 Sistema Anti-Raid', 
                value: 'Proteja seu servidor contra ataques coordenados e ações maliciosas de administradores.',
                inline: false 
            },
            { 
                name: '🤖 Auto-Moderador', 
                value: 'Configure o sistema que detecta e age contra spam, links maliciosos e menções em massa.',
                inline: false 
            },
            { 
                name: '📝 Logs de Segurança', 
                value: 'Defina canais para registrar todas as ações importantes de moderação e segurança.',
                inline: false 
            },
            { 
                name: '👤 Detecção de Contas Alternativas', 
                value: 'Configure verificação adicional para contas recém-criadas.',
                inline: false 
            }
        )
        .setFooter({ text: 'Todas as configurações são salvas automaticamente' });

    // Criar botões para cada subsistema
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_antiraid_panel')
            .setLabel('Sistema Anti-Raid')
            .setEmoji('<:cadeado:1364987321576853626>')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('mod_automod_panel')
            .setLabel('Auto-Moderador')
            .setEmoji('<:bot:1365017108345258135>')
            .setStyle(ButtonStyle.Primary)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_logs_panel')
            .setLabel('Logs de Segurança')
            .setEmoji('<:1245612394634543134:1364987275208953888>')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('mod_altdetect_panel')
            .setLabel('Detecção de Alt Accounts')
            .setEmoji('<:1289360606952030290:1364987294301294653>')
            .setStyle(ButtonStyle.Secondary)
    );

    // Status atual
    const statusRow = createStatusRow(guildConfig);

    // Responder à interação
    await interaction.update({
        embeds: [embed],
        components: [row1, row2, statusRow],
        files: [],
        ephemeral: true
    });
}


function createStatusRow(config) {
    const antiRaidStatus = config.antiRaid?.enabled ? 'Ativado ✅' : 'Desativado ❌';
    const autoModStatus = config.autoMod?.enabled ? 'Ativado ✅' : 'Desativado ❌';
    const logsStatus = config.logs?.enabled ? 'Ativado ✅' : 'Desativado ❌';
    const altDetectionStatus = config.altDetection?.enabled ? 'Ativado ✅' : 'Desativado ❌';

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_status_antiraid')
            .setLabel(`Anti-Raid: ${antiRaidStatus}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('mod_status_automod')
            .setLabel(`Auto-Mod: ${autoModStatus}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );
}

module.exports = { mainPanel };