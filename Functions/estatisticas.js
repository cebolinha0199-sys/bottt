const { default: axios } = require("axios");

/**
 * Calcula estatísticas de vendas para um período específico
 * @param {Object} client - Cliente da API
 * @param {number} dias - Dias para filtrar (1 = hoje, 7 = semana, etc)
 * @param {string} guild - ID do guild para buscar dados
 * @returns {Promise<Object>} Estatísticas calculadas
 */
async function Estatisticas(client, dias, guild) {
  // Funções utilitárias para manipulação de datas
  const createDateHelpers = () => {
    const startOfDay = (date) => new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    );

    const endOfDay = (date) => new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23, 59, 59, 999
    );

    const parseTimestamp = (timestampStr) => {
      try {
        // Se for uma string vazia ou não for um número, retorna null
        if (!timestampStr || !/^\d+$/.test(timestampStr)) return null;
        
        const timestamp = parseInt(timestampStr, 10);
        
        // Verifica se o timestamp está em milissegundos (13 dígitos normalmente)
        if (String(timestamp).length >= 13) {
          const date = new Date(timestamp);
          // Verifica se a data é válida (não é NaN) e está em um período razoável
          if (!isNaN(date) && date.getFullYear() >= 2010 && date.getFullYear() <= 2030) {
            return date;
          }
        }
        
        // Tenta interpretar como timestamp Unix (segundos)
        const secondsDate = new Date(timestamp * 1000);
        if (!isNaN(secondsDate) && secondsDate.getFullYear() >= 2010 && secondsDate.getFullYear() <= 2030) {
          return secondsDate;
        }
        
        return null;
      } catch (error) {
        console.error(`Erro ao analisar timestamp: ${timestampStr}`, error);
        return null;
      }
    };

    return { startOfDay, endOfDay, parseTimestamp };
  };

  // Busca os dados da API
  const fetchSalesData = async (guildId) => {
    try {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://nevermiss-api.squareweb.app/getCompra2/${guildId}`,
        headers: {
          'Authorization': 'wj5O7E82dG4t'
        }
      };

      const response = await axios.request(config);
      //console.log(`Dados recebidos da API: ${response.data.length} registros`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error.message);
      return [];
    }
  };

  // Calcula o intervalo de datas para filtrar
  const calculateDateRange = (dias) => {
    const { startOfDay, endOfDay } = createDateHelpers();
    const now = new Date();
    
    // CORREÇÃO: Para "hoje" (dias = 1), usamos o início e fim do dia atual
    if (dias === 1) {
      return { 
        start: startOfDay(now), 
        end: endOfDay(now),
        label: "Hoje"
      };
    }
    
    // Para outros períodos, calculamos a partir de X dias atrás até o fim de hoje
    const daysAgo = new Date(now);
    daysAgo.setDate(daysAgo.getDate() - (dias - 1)); // Ajuste para incluir hoje
    
    return { 
      start: startOfDay(daysAgo), 
      end: endOfDay(now),
      label: dias === 0 ? "Todo o período" : `Últimos ${dias} dias`
    };
  };

  // Processa os dados de vendas e calcula estatísticas
  const processSalesData = (salesData, dateRange) => {
    const { parseTimestamp } = createDateHelpers();
    const { start, end, label } = dateRange;

    // Acumuladores para estatísticas
    const stats = {
      intervalo: {
        dias,
        label,
        valorTotal: 0,
        quantidadePedidos: 0,
        totalProdutos: 0,
      },
      total: {
        valorTotal: 0,
        quantidadePedidos: 0,
        totalProdutos: 0,
      }
    };

    // Log para debug
    //console.log(`Filtrando vendas de ${start.toISOString()} até ${end.toISOString()}`);
    
    // Processa cada venda
    for (const sale of salesData) {
      // Adiciona ao total geral independente da data
      stats.total.valorTotal += Number(sale.price) || 0;
      stats.total.quantidadePedidos += 1;
      stats.total.totalProdutos += Number(sale.QtdProdutos) || 0;

      // Tenta converter a data da venda
      const saleDate = parseTimestamp(sale.date);

      // Pula se a data for inválida
      if (!saleDate) {
        console.warn(`Data inválida encontrada: ${sale.date}`);
        continue;
      }

      // Log para debug de cada venda
      //console.log(`Venda: ${saleDate.toISOString()}, Preço: ${sale.price}, Dentro do intervalo: ${saleDate >= start && saleDate <= end}`);
      
      // Adiciona ao intervalo específico se estiver dentro do range de datas
      if (saleDate >= start && saleDate <= end) {
        stats.intervalo.valorTotal += Number(sale.price) || 0;
        stats.intervalo.quantidadePedidos += 1;
        stats.intervalo.totalProdutos += Number(sale.QtdProdutos) || 0;
      }
    }

    return stats;
  };

  // Execução principal da função
  try {
    const salesData = await fetchSalesData(guild);
    const dateRange = calculateDateRange(dias);
    return processSalesData(salesData, dateRange);
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    // Retorna valores padrão em caso de erro
    return {
      intervalo: { dias, valorTotal: 0, quantidadePedidos: 0, totalProdutos: 0 },
      total: { valorTotal: 0, quantidadePedidos: 0, totalProdutos: 0 }
    };
  }
}

module.exports = Estatisticas;