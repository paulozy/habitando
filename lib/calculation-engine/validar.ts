import type {
  MensagemValidacao,
  ResultadoSimulacao,
  SimulacaoConfig,
  ValidacaoResultado,
} from "./schema";

function rendaTotal(config: SimulacaoConfig): number {
  const compradores = config?.renda?.compradores ?? [];
  const compradoresSum = compradores.reduce(
    (a, c) => a + (c?.renda_liquida ?? 0),
    0,
  );
  return compradoresSum + (config?.renda?.outros_rendimentos ?? 0);
}

export function validarInput(config: SimulacaoConfig): ValidacaoResultado {
  const erros: MensagemValidacao[] = [];
  const avisos: MensagemValidacao[] = [];
  const info: MensagemValidacao[] = [];

  // Defensive: campos podem estar parcialmente undefined durante hidratação
  if (!config?.imovel || !config?.entrada || !config?.gastos) {
    return { valido: false, erros, avisos, info };
  }

  const renda = rendaTotal(config);
  if (renda <= 0) {
    erros.push({ campo: "renda", texto: "Renda total deve ser maior que zero." });
  }

  if (config.gastos.gastos_fixos_mensais >= renda) {
    erros.push({
      campo: "gastos",
      texto: "Gastos fixos não podem igualar ou superar a renda total.",
    });
  }

  if (config.imovel.valor_total <= 0) {
    erros.push({ campo: "imovel", texto: "Valor do imóvel deve ser maior que zero." });
  }

  if (config.imovel.valor_financiado_banco > config.imovel.valor_total) {
    erros.push({
      campo: "imovel",
      texto: "Financiamento bancário não pode ser maior que o valor total.",
    });
  }

  if (
    config.imovel.periodos_construcao < 12 ||
    config.imovel.periodos_construcao > 60
  ) {
    avisos.push({
      campo: "imovel",
      texto: `Período de construção (${config.imovel.periodos_construcao}m) fora do intervalo típico 12–60.`,
    });
  }

  const incc = config.entrada.incc_mensal_percent ?? 0;
  if (incc < 0.002 || incc > 0.01) {
    avisos.push({
      campo: "incc",
      texto: `INCC mensal de ${(incc * 100).toFixed(2)}% fora do intervalo típico 0,2%–1,0%.`,
    });
  }

  for (const a of config.entrada.anuais ?? []) {
    if (a?.tipo === "manual") {
      for (const m of a.meses ?? []) {
        if (m < 1 || m > config.imovel.periodos_construcao) {
          erros.push({
            campo: "anuais",
            texto: `Anual configurada para mês ${m}, fora do período (1–${config.imovel.periodos_construcao}).`,
          });
        }
      }
    } else if (a?.tipo === "intervalo") {
      if (
        a.primeiro_mes < 1 ||
        a.primeiro_mes > config.imovel.periodos_construcao
      ) {
        erros.push({
          campo: "anuais",
          texto: `Anual (intervalo) começa no mês ${a.primeiro_mes}, fora de 1–${config.imovel.periodos_construcao}.`,
        });
      }
    }
  }

  // Ato parcelado
  const ato = config.entrada.ato;
  const numMeses = config.imovel.periodos_construcao;
  if (ato) {
    const parcelas = ato.parcelas ?? 1;
    const primeiro = ato.primeiro_mes ?? 1;
    const ultimoAto = primeiro + parcelas - 1;
    if (parcelas > numMeses) {
      erros.push({
        campo: "ato",
        texto: `Ato parcelado em ${parcelas}× ultrapassa o período de construção (${numMeses} meses).`,
      });
    }
    if (ultimoAto > numMeses) {
      erros.push({
        campo: "ato",
        texto: `Última parcela do ato cai no mês ${ultimoAto}, fora do período (1–${numMeses}).`,
      });
    }
    if (parcelas === numMeses && parcelas > 1) {
      avisos.push({
        campo: "ato",
        texto: `Ato ocupa TODOS os ${numMeses} meses — não há mês com parcela mensal regular.`,
      });
    }

    // Anuais que colidem com mês de ato
    const mesesAtoSet = new Set<number>();
    for (let m = primeiro; m <= ultimoAto; m++) mesesAtoSet.add(m);
    // (resolveMesesAnual seria ideal, mas como pode não ter dataInicio carregada, faço aproximação)
    for (const a of config.entrada.anuais ?? []) {
      if (a?.tipo === "manual") {
        for (const m of a.meses ?? []) {
          if (mesesAtoSet.has(m)) {
            avisos.push({
              campo: "anuais",
              texto: `Anual configurada para o mês ${m} colide com mês de ato — pode sobrecarregar o orçamento.`,
            });
          }
        }
      }
    }
  }

  const cc = config.custosCartoriais;
  if (
    cc?.diluir &&
    (cc.parcelas ?? 0) > 0 &&
    (cc.mes_inicio ?? 1) + (cc.parcelas ?? 0) - 1 > numMeses
  ) {
    avisos.push({
      campo: "custosCartoriais",
      texto: "Diluição dos custos cartoriais ultrapassa o período de construção.",
    });
  }
  if (
    cc?.diluir &&
    ato &&
    (ato.valor_total ?? 0) > 0 &&
    (cc.mes_inicio ?? 1) <
      (ato.primeiro_mes ?? 1) + (ato.parcelas ?? 1)
  ) {
    info.push({
      campo: "custosCartoriais",
      texto: `Custos cartoriais shifted automaticamente para o mês ${(ato.primeiro_mes ?? 1) + (ato.parcelas ?? 1)} (depois do ato), evitando colisão.`,
    });
  }

  // Endividamento pós-entrega
  if (renda > 0) {
    const coef = ((config.entrada.parcela_pos_entrega ?? 0) / renda) * 100;
    if (coef > 30) {
      avisos.push({
        campo: "endividamento",
        texto: `Parcela pós-entrega é ${coef.toFixed(1)}% da renda (limite recomendado: 30%).`,
      });
    } else {
      info.push({
        campo: "endividamento",
        texto: `Parcela pós-entrega ocupa ${coef.toFixed(1)}% da renda. Dentro do limite de 30%.`,
      });
    }
  }

  // LTV
  if (config.imovel.valor_total > 0) {
    const ltv =
      ((config.imovel.valor_financiado_banco ?? 0) / config.imovel.valor_total) * 100;
    if (ltv > 90) {
      avisos.push({
        campo: "ltv",
        texto: `LTV de ${ltv.toFixed(1)}% acima do limite bancário típico (90%).`,
      });
    }
  }

  return { valido: erros.length === 0, erros, avisos, info };
}

export function validarOutput(result: ResultadoSimulacao): ValidacaoResultado {
  const erros: MensagemValidacao[] = [];
  const avisos: MensagemValidacao[] = [];
  const info: MensagemValidacao[] = [];

  if (!result?.stats || !result?.rows) {
    return { valido: false, erros, avisos, info };
  }

  if (result.stats.totalGeral <= 0) {
    erros.push({ texto: "Total geral deve ser positivo." });
  }
  if (result.rows.length > 0) {
    const evTotal = result.rows[result.rows.length - 1].evolucaoAcum;
    if (Math.abs(evTotal - 95) > 1) {
      avisos.push({
        texto: `Evolução total é ${evTotal.toFixed(1)}%, esperado ~95%.`,
      });
    }
  }
  return { valido: erros.length === 0, erros, avisos, info };
}
