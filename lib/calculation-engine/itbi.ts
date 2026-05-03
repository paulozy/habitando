import type { ITBIConfig, ITBIResult } from "./schema";

/** Calcula resultado de ITBI a partir dos 3 modos do regras_itbi.md. */
export function calcularITBI(config: ITBIConfig): ITBIResult {
  switch (config.tipo) {
    case "aliquota": {
      const itbi = config.valor_imovel * config.aliquota_percent;
      const cartorios = config.include_cartorios ? config.valor_imovel * 0.03 : 0;
      return {
        tipo: "aliquota",
        itbi: Math.round(itbi),
        cartorios: Math.round(cartorios),
        outras: 0,
        total: Math.round(itbi + cartorios),
        detalhes: {
          aliquota_percent: config.aliquota_percent,
          valor_imovel: config.valor_imovel,
          cartorios_estimado: config.include_cartorios,
        },
      };
    }
    case "valor_total": {
      return {
        tipo: "valor_total",
        itbi: config.valor_itbi_total,
        cartorios: 0,
        outras: 0,
        total: config.valor_itbi_total,
        detalhes: { origem: "usuario_informou_direto" },
      };
    }
    case "itemizado": {
      const cartorios = config.cartorio + config.taxas_diversas;
      const total = config.itbi + cartorios + config.outras_despesas;
      return {
        tipo: "itemizado",
        itbi: config.itbi,
        cartorios,
        outras: config.outras_despesas,
        total: Math.round(total),
        detalhes: {
          itbi: config.itbi,
          cartorio: config.cartorio,
          taxas_diversas: config.taxas_diversas,
          outras_despesas: config.outras_despesas,
        },
      };
    }
  }
}
