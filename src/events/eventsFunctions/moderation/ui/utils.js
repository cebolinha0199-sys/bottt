const { EmbedBuilder } = require('discord.js');

/**
 * Cria um embed padrão para painéis de configuração
 * @param {string} title - Título do embed
 * @param {string} description - Descrição do embed
 * @param {string} color - Cor do embed em hexadecimal
 * @returns {EmbedBuilder} Embed configurado
 */
function createConfigEmbed(title, description, color) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}

/**
 * Verifica se um usuário tem permissões administrativas
 * @param {GuildMember} member - Membro do servidor
 * @returns {boolean} Verdadeiro se tem permissões administrativas
 */
function hasAdminPermissions(member) {
    return member.permissions.has('ADMINISTRATOR') || 
           member.permissions.has('MANAGE_GUILD') ||
           member.id === member.guild.ownerId;
}

/**
 * Formata duração em milissegundos para formato legível
 * @param {number} ms - Duração em milissegundos
 * @returns {string} Duração formatada
 */
function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
}

/**
 * Gera um ID único para logs
 * @returns {string} ID único
 */
function generateLogId() {
    return `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
    createConfigEmbed,
    hasAdminPermissions,
    formatDuration,
    generateLogId
};