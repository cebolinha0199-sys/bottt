const { writeFile } = require('fs/promises');
const path = require('path');
const { loadConfig } = require('./loadConfig');

/**
 * Salva a configuração de moderação para um servidor
 * @param {string} guildId - ID do servidor
 * @param {Object} config - Objeto de configuração
 * @returns {Promise<boolean>} - Sucesso da operação
 */
async function saveConfig(guildId, config) {
    try {
        // Certifique-se de que o diretório existe
        const configDir = path.join(process.cwd(), 'databases');
        await ensureDir(configDir);
        
        // Caminho para o arquivo de configuração
        const configPath = path.join(configDir, `dbModeration.json`);
        
        // Salvar configuração
        await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`Erro ao salvar configuração para o servidor ${guildId}:`, error);
        return false;
    }
}

/**
 * Garante que um diretório exista
 * @param {string} dir - Caminho do diretório
 */
async function ensureDir(dir) {
    const { mkdir } = require('fs/promises');
    const { existsSync } = require('fs');
    
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
}

/**
 * Atualiza parcialmente a configuração de um servidor
 * @param {string} guildId - ID do servidor
 * @param {string} path - Caminho da propriedade a ser atualizada (ex: 'antiRaid.enabled')
 * @param {any} value - Novo valor
 * @returns {Promise<boolean>} - Sucesso da operação
 */
async function updateConfig(guildId, path, value) {
    try {
        // Carregar configuração atual
        const config = await loadConfig(guildId);
        
        // Atualizar propriedade
        const keys = path.split('.');
        let current = config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        // Salvar configuração atualizada
        return await saveConfig(guildId, config);
    } catch (error) {
        console.error(`Erro ao atualizar configuração para o servidor ${guildId}:`, error);
        return false;
    }
}

module.exports = { saveConfig, updateConfig };