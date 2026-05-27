const { readFile } = require('fs/promises');
const path = require('path');
const { existsSync } = require('fs');
const { defaultConfig } = require('./defaultConfig');

/**
 * Carrega a configuração de moderação para um servidor
 * @param {string} guildId - ID do servidor
 * @returns {Promise<Object>} - Objeto de configuração
 */
async function loadConfig(guildId) {
    try {
        // Caminho para o arquivo de configuração
        const configPath = path.join(process.cwd(), 'databases', `dbModeration.json`);
        
        // Verificar se o arquivo existe
        if (!existsSync(configPath)) {
            // Retornar configuração padrão
            return JSON.parse(JSON.stringify(defaultConfig));
        }
        
        // Ler e analisar o arquivo
        const configData = await readFile(configPath, 'utf-8');
        return JSON.parse(configData);
    } catch (error) {
        console.error(`Erro ao carregar configuração para o servidor ${guildId}:`, error);
        return JSON.parse(JSON.stringify(defaultConfig));
    }
}

module.exports = { loadConfig };