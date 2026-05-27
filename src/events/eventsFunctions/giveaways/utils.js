const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de banco de dados
const DB_PATH = path.join(__dirname, '../../../../databases/dbGiveaways.json');


function loadGiveaways() {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }
        // Se o arquivo não existir, cria um novo com estrutura básica
        const defaultData = { giveaways: [] };
        saveGiveaways(defaultData);
        return defaultData;
    } catch (err) {
        console.error('Erro ao carregar o banco de dados de sorteios:', err);
        // Em caso de erro, retorna um objeto vazio
        return { giveaways: [] };
    }
}

function saveGiveaways(data) {
    try {
        // Garante que o diretório existe
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro ao salvar o banco de dados de sorteios:', err);
    }
}

function addGiveaway(giveaway) {
    const data = loadGiveaways();
    data.giveaways.push(giveaway);
    saveGiveaways(data);
}

function updateGiveaway(messageId, updatedData) {
    const data = loadGiveaways();
    const index = data.giveaways.findIndex(g => g.messageId === messageId);

    if (index !== -1) {
        data.giveaways[index] = { ...data.giveaways[index], ...updatedData };
        saveGiveaways(data);
        return true;
    }
    return false;
}


function findGiveawayByMessageId(messageId) {
    const data = loadGiveaways();
    return data.giveaways.find(g => g.messageId === messageId) || null;
}

function parseDuration(text) {
    const regex = /(\d+)\s*(minuto|minutos|min|hora|horas|h|dia|dias|d|semana|semanas|s)/gi;
    let matches;
    let duration = 0;

    while ((matches = regex.exec(text)) !== null) {
        const value = parseInt(matches[1]);
        const unit = matches[2].toLowerCase();

        if (unit.startsWith('minuto') || unit === 'min') {
            duration += value * 60 * 1000;
        } else if (unit.startsWith('hora') || unit === 'h') {
            duration += value * 60 * 60 * 1000;
        } else if (unit.startsWith('dia') || unit === 'd') {
            duration += value * 24 * 60 * 60 * 1000;
        } else if (unit.startsWith('semana') || unit === 's') {
            duration += value * 7 * 24 * 60 * 60 * 1000;
        }
    }

    return duration > 0 ? duration : null;
}

function verificarIntegridadeSorteios(client) {
    //console.log('Iniciando verificação de integridade do sistema de sorteios...');
    
    try {
        // Carregar todos os sorteios
        const data = loadGiveaways();
        const now = Date.now();
        
        //console.log(`Total de sorteios no banco de dados: ${data.giveaways.length}`);
        
        // Estatísticas
        const estatisticas = {
            total: data.giveaways.length,
            ativos: 0,
            finalizados: 0,
            pendentes: 0,
            corrigidos: 0,
            erros: 0
        };
        
        // Verificar cada sorteio
        for (const sorteio of data.giveaways) {
            try {
                // Verificar se o sorteio está finalizado
                if (sorteio.ended) {
                    estatisticas.finalizados++;
                    
                    // Verificar se há inconsistências em sorteios finalizados
                    if (sorteio.endAt <= now && sorteio.participants.length > 0 && sorteio.winners.length === 0) {
                        //console.log(`Inconsistência detectada: Sorteio ${sorteio.messageId} está finalizado mas não tem vencedores apesar de ter participantes`);
                        estatisticas.corrigidos++;
                    }
                } 
                // Verificar sorteios que deveriam estar finalizados
                else if (sorteio.endAt <= now) {
                    //console.log(`Sorteio ${sorteio.messageId} deveria estar finalizado. Agendando finalização imediata.`);
                    estatisticas.pendentes++;
                } 
                // Sorteios ativos
                else {
                    estatisticas.ativos++;
                    //console.log(`Sorteio ${sorteio.messageId} está ativo e terminará em ${Math.floor((sorteio.endAt - now) / 1000 / 60)} minutos`);
                }
            } catch (err) {
                console.error(`Erro ao verificar sorteio ${sorteio.messageId}:`, err);
                estatisticas.erros++;
            }
        }
        
        //console.log('Verificação de integridade concluída:', estatisticas);
        return {
            success: true,
            estatisticas
        };
    } catch (err) {
        console.error('Erro ao verificar integridade do sistema de sorteios:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

function permitirAutoParticipacao(sorteio) {
    // Por padrão, permitir que o criador participe
    return true;

    // Se quiser desabilitar a auto-participação:
    // return false;
}

module.exports = {
    loadGiveaways,
    saveGiveaways,
    addGiveaway,
    updateGiveaway,
    findGiveawayByMessageId,
    parseDuration,
    permitirAutoParticipacao,
    verificarIntegridadeSorteios
};