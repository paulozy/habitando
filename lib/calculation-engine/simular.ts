import type {
  AtoResult,
  ParecerItem,
  ResultadoSimulacao,
  RowSimulacao,
  SimulacaoConfig,
  StatsSimulacao,
} from "./schema";
import { EVOLUCAO_TOTAL_MAX, gerarEvolucao } from "./evolucao";
import { calcularITBI } from "./itbi";
import { resolveMesesAnual } from "./anuais";

function rendaTotal(config: SimulacaoConfig): number {
  const compradoresSum = (config?.renda?.compradores ?? []).reduce(
    (a, c) => a + (c?.renda_liquida ?? 0),
    0,
  );
  return compradoresSum + (config?.renda?.outros_rendimentos ?? 0);
}

function disponivel(config: SimulacaoConfig): number {
  return rendaTotal(config) - (config?.gastos?.gastos_fixos_mensais ?? 0);
}

function parseDataInicio(s: string): Date {
  const [y, m, d] = s.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dataDoMes(dataInicio: Date, mes: number): Date {
  return new Date(dataInicio.getFullYear(), dataInicio.getMonth() + (mes - 1), 1);
}

/**
 * Loop principal — saldo devedor com correção INCC + ato parcelado.
 *
 * Saldo[0] = valor_total - (fgts se fgts_abate_saldo). ATO **não** abate saldo
 * de cara: vira fluxo (uma ou mais parcelas em meses específicos).
 *
 * Se ato.parcelas > 1 → durante esses meses, o cliente paga só a parcela do ato
 * (parcela mensal e INCC ficam suspensos para não sobrecarregar). Cartoriais
 * diluídos sofrem shift automático para depois do ato.
 *
 * A cada mês:
 *   inccDoMes      = saldo × INCC                  ← juros do mês sobre o saldo
 *   saldoCorrigido = saldo + inccDoMes
 *   parcelaBase    = isMesAto ? 0 : config.parcela_mensal_base
 *   atoPagoMes     = isMesAto ? valor_total/parcelas : 0
 *   inccPagoCliente= clientePagaINCC && !isMesAto ? inccDoMes : 0
 *   saldo[m]       = saldoCorrigido − parcelaBase − inccPagoCliente − atoPagoMes − anual
 */
export function calcSimulacao(config: SimulacaoConfig): ResultadoSimulacao {
  // Defensive defaults — config pode estar parcial durante hidratação do form
  const numMeses = config?.imovel?.periodos_construcao ?? 35;
  const incc = config?.entrada?.incc_mensal_percent ?? 0.0045;
  const dataInicio = parseDataInicio(config?.imovel?.data_inicio ?? "2026-01-01");
  const evolucao = gerarEvolucao(numMeses, config?.evolucao ?? { tipo: "progressivo" });

  const renda = rendaTotal(config);
  const dispMes = disponivel(config);

  // Ato — duas regras distintas conforme parcelas:
  //  - 1× (à vista): pago na assinatura (m0), abate o saldo inicial. Mensais
  //    rolam normalmente desde m1. Não ocupa meses; não suspende mensal.
  //  - N× (parcelado): vira fluxo distribuído em N meses. Durante esses meses,
  //    a parcela mensal e o INCC do cliente ficam suspensos (regra do usuário).
  const ato = config?.entrada?.ato ?? {
    valor_total: 0,
    parcelas: 1,
    primeiro_mes: 1,
    corrige_incc: false,
  };
  const atoValor = ato.valor_total ?? 0;
  const atoParcelas = Math.max(1, ato.parcelas ?? 1);
  const atoPrimeiroMes = Math.max(1, ato.primeiro_mes ?? 1);
  const atoEhAVista = atoParcelas === 1;
  const atoUltimoMes = atoEhAVista ? 0 : atoPrimeiroMes + atoParcelas - 1;
  const atoBaseParcelado = atoEhAVista ? 0 : atoValor / atoParcelas;
  const mesesAtoSet = new Set<number>();
  if (!atoEhAVista) {
    for (let m = atoPrimeiroMes; m <= atoUltimoMes; m++) mesesAtoSet.add(m);
  }
  const atoResult: AtoResult = {
    valor_nominal: atoValor,
    // Se 1× (à vista): valor pago = valor nominal (sem correção INCC, pois é m0).
    // Se N×: valor é somado durante o loop (substituído depois).
    valor_pago: atoEhAVista ? atoValor : 0,
    corrige_incc: ato.corrige_incc ?? false,
  };

  // Custos cartoriais — fallback para valor_total 0 se ausente
  const custos = config?.custosCartoriais ?? {
    calculo: { tipo: "valor_total" as const, valor_itbi_total: 0 },
    diluir: false,
    parcelas: 1,
    mes_inicio: 1,
    corrige_incc: false,
  };
  const ccResult = calcularITBI(custos.calculo);
  // Shift automático: se diluir e mes_inicio cair durante o ato parcelado,
  // pula para depois. Ato à vista (1×) não causa shift (não ocupa meses).
  const docMesInicio =
    custos.diluir &&
    !atoEhAVista &&
    custos.mes_inicio < atoUltimoMes + 1 &&
    atoValor > 0
      ? atoUltimoMes + 1
      : custos.mes_inicio;
  const docBase =
    custos.diluir && custos.parcelas > 0 ? ccResult.total / custos.parcelas : 0;
  const docFimExclusivo = docMesInicio + custos.parcelas;

  // Saldo devedor inicial:
  //   valor_imovel − (fgts se aplicável) − (ato se à vista)
  // Ato parcelado N× NÃO abate aqui (vira fluxo nos meses do ato).
  const fgtsAbate = config?.imovel?.fgts_abate_saldo
    ? (config?.imovel?.fgts_disponivel ?? 0)
    : 0;
  const atoAbateInicio = atoEhAVista ? atoValor : 0;
  const saldoInicial = Math.max(
    0,
    (config?.imovel?.valor_total ?? 0) - fgtsAbate - atoAbateInicio,
  );

  // Modo INCC (default = cliente_paga_mensal se não declarado)
  const clientePagaINCC = config?.entrada?.modo_incc !== "saldo_acumula";

  // Pré-calcula em quais meses cada anual incide (resolve dataInicio + numMeses)
  const anuaisResolvidos = (config?.entrada?.anuais ?? []).map((a) => ({
    valor: a.valor,
    corrige_incc: a.corrige_incc,
    meses: new Set(resolveMesesAnual(a, dataInicio, numMeses)),
  }));

  const rows: RowSimulacao[] = [];
  let saldo = saldoInicial;
  let evAcum = 0;
  let acumuladoMensal = 0;
  let inccAcumuladoTotal = 0;
  let totalINCCPagoCliente = 0;
  let totalAtoPagoSomado = 0;

  const parcelaBaseCfg = config?.entrada?.parcela_mensal_base ?? 0;

  for (let m = 1; m <= numMeses; m++) {
    const ev = evolucao[m - 1] ?? 0;
    evAcum += ev;

    // Juros INCC sobre o saldo devedor
    const saldoAntes = saldo;
    const inccDoMes = saldo * incc;
    inccAcumuladoTotal += inccDoMes;
    const saldoCorrigido = saldoAntes + inccDoMes;

    // Mês de ato (só ato parcelado): parcela mensal e INCC do cliente
    // ficam suspensos. Ato à vista não cai em mês algum.
    const isMesAto = mesesAtoSet.has(m);
    const atoPagoMes = isMesAto
      ? ato.corrige_incc
        ? atoBaseParcelado * (1 + incc)
        : atoBaseParcelado
      : 0;
    if (atoPagoMes > 0) totalAtoPagoSomado += atoPagoMes;

    // Anuais
    let anualBase = 0;
    for (const a of anuaisResolvidos) {
      if (a.meses.has(m)) anualBase += a.valor;
    }
    const anualPago = anualBase;

    // Parcela mensal: zero nos meses de ato
    const parcelaBase = isMesAto ? 0 : parcelaBaseCfg;
    const inccPagoCliente = clientePagaINCC && !isMesAto ? inccDoMes : 0;
    const parcelaCliente = parcelaBase + inccPagoCliente;
    totalINCCPagoCliente += inccPagoCliente;

    // Documentação (custos cartoriais diluídos, com mes_inicio shifted se aplicável)
    let documentacao = m >= docMesInicio && m < docFimExclusivo ? docBase : 0;
    if (documentacao > 0 && custos.corrige_incc) {
      documentacao *= 1 + inccAcumuladoTotal / Math.max(saldoInicial, 1);
    }

    // Saldo final do mês — o que abate é tudo que vai à construtora
    saldo = saldoCorrigido - parcelaCliente - atoPagoMes - anualPago;
    if (saldo < 0) saldo = 0;

    // TEO = parcela_pós-entrega × (% acumulado de obra), com cap em EVOLUCAO_TOTAL_MAX.
    // É o que o cliente paga ao banco proporcional ao % de obra concluída até o mês.
    const evAcumCap = Math.min(evAcum, EVOLUCAO_TOTAL_MAX);
    const teo = (evAcumCap / 100) * (config?.entrada?.parcela_pos_entrega ?? 0);
    const total = parcelaCliente + atoPagoMes + anualPago + documentacao + teo;
    acumuladoMensal += total;

    rows.push({
      mes: m,
      data: dataDoMes(dataInicio, m),
      evolucao: ev,
      evolucaoAcum: evAcum,
      saldoAntes,
      inccDoMes,
      saldoCorrigido,
      saldoDepois: saldo,
      inccAcumulado: inccAcumuladoTotal,
      parcelaBase,
      inccPagoCliente,
      parcelaCliente,
      atoPagoMes,
      isMesAto,
      anual: anualPago,
      documentacao,
      teo,
      total,
      acumulado: acumuladoMensal,
      disponivel: dispMes - total,
      pctRenda: renda > 0 ? (total / renda) * 100 : 0,
    });
  }

  const totalAnuaisNominal = anuaisResolvidos.reduce(
    (a, an) => a + an.valor * an.meses.size,
    0,
  );
  // Mensais rolam em (numMeses − mesesAto parcelado). Para ato à vista, mensais
  // ocorrem em todos os meses. Saldo nominal já desconta o ato à vista no início.
  const mesesMensaisEfetivos = Math.max(0, numMeses - mesesAtoSet.size);
  const totalAtoFluxoNominal = atoEhAVista ? 0 : atoValor;
  const saldoFinalNominal = Math.max(
    0,
    saldoInicial -
      totalAtoFluxoNominal -
      parcelaBaseCfg * mesesMensaisEfetivos -
      totalAnuaisNominal,
  );

  // Atualiza atoResult.valor_pago para o ato parcelado (à vista já vem certo).
  if (!atoEhAVista) {
    atoResult.valor_pago = totalAtoPagoSomado;
  }

  const stats = computeStats(
    rows,
    renda,
    dispMes,
    atoResult,
    ccResult.total,
    custos.diluir,
    saldoInicial,
    saldoFinalNominal,
    inccAcumuladoTotal,
    totalINCCPagoCliente,
    mesesAtoSet.size,
  );
  const parecer = gerarParecer(rows, stats, config, dispMes);

  return {
    rows,
    stats,
    parecer,
    ato: atoResult,
    custosCartoriaisResult: ccResult,
  };
}

function computeStats(
  rows: RowSimulacao[],
  renda: number,
  dispMes: number,
  ato: AtoResult,
  totalCustosCartoriais: number,
  custosDiluidos: boolean,
  saldoInicial: number,
  saldoFinalNominal: number,
  totalINCC: number,
  totalINCCPagoCliente: number,
  mesesAto: number,
): StatsSimulacao {
  const totals = rows.map((r) => r.total);
  const totalMensalSomado = rows.length > 0 ? rows[rows.length - 1].acumulado : 0;
  // Se ato é parcelado, atoPagoMes já entra em row.total → totalMensalSomado inclui.
  // Se ato é à vista (mesesAto === 0), o valor está em ato.valor_pago e precisa somar.
  const atoAVistaForaDoFluxo = mesesAto === 0 ? ato.valor_pago : 0;
  const totalGeral =
    totalMensalSomado +
    atoAVistaForaDoFluxo +
    (custosDiluidos ? 0 : totalCustosCartoriais);
  const media = rows.length > 0 ? totalMensalSomado / rows.length : 0;
  const maximo = totals.length ? Math.max(...totals) : 0;
  const minimo = totals.length ? Math.min(...totals.filter((t) => t > 0)) : 0;
  const dezembros = rows.filter((r) => r.anual > 0);
  const normais = rows.filter((r) => r.anual === 0);
  const picoDez = dezembros.length ? Math.max(...dezembros.map((r) => r.total)) : 0;
  const maxNormal = normais.length ? Math.max(...normais.map((r) => r.total)) : maximo;
  const totalTEO = rows.reduce((a, r) => a + r.teo, 0);
  const totalDoc = rows.reduce((a, r) => a + r.documentacao, 0);
  const mesesCriticos = rows.filter((r) => r.disponivel < 0).length;

  // INCC mensal (max/min)
  const inccs = rows.map((r) => r.inccDoMes).filter((v) => v > 0);
  const maxINCC = inccs.length ? Math.max(...inccs) : 0;
  const minINCC = inccs.length ? Math.min(...inccs) : 0;

  // Evolução de obra (%)
  const evs = rows.map((r) => r.evolucao).filter((v) => v > 0);
  const maxEvolucao = evs.length ? Math.max(...evs) : 0;
  const minEvolucao = evs.length ? Math.min(...evs) : 0;
  const evolucaoTotal =
    rows.length > 0 ? rows[rows.length - 1].evolucaoAcum : 0;

  // TEO mensal (R$) — taxa de evolução de obra paga ao banco
  const teos = rows.map((r) => r.teo).filter((v) => v > 0);
  const maxTEO = teos.length ? Math.max(...teos) : 0;
  const minTEO = teos.length ? Math.min(...teos) : 0;

  const saldoFinal = rows.length > 0 ? rows[rows.length - 1].saldoDepois : saldoInicial;
  const totalINCCAbsorvidoSaldo = totalINCC - totalINCCPagoCliente;
  const diferencaFinanciamento = saldoFinal - saldoFinalNominal;

  return {
    totalGeral: Math.round(totalGeral),
    totalMensalSomado: Math.round(totalMensalSomado),
    mediaGeral: Math.round(media),
    maximo: Math.round(maximo),
    minimo: Math.round(minimo),
    maxNormal: Math.round(maxNormal),
    picoDezembros: Math.round(picoDez),
    totalINCC: Math.round(totalINCC),
    maxINCC: Math.round(maxINCC),
    minINCC: Math.round(minINCC),
    totalINCCPagoCliente: Math.round(totalINCCPagoCliente),
    totalINCCAbsorvidoSaldo: Math.round(totalINCCAbsorvidoSaldo),
    evolucaoTotal: Math.round(evolucaoTotal * 100) / 100,
    maxEvolucao: Math.round(maxEvolucao * 100) / 100,
    minEvolucao: Math.round(minEvolucao * 100) / 100,
    maxTEO: Math.round(maxTEO),
    minTEO: Math.round(minTEO),
    totalTEO: Math.round(totalTEO),
    totalAto: Math.round(ato.valor_pago),
    mesesAto,
    totalCustosCartoriais: Math.round(totalCustosCartoriais),
    totalDocumentacao: Math.round(totalDoc),
    saldoInicial: Math.round(saldoInicial),
    saldoFinal: Math.round(saldoFinal),
    saldoFinalNominal: Math.round(saldoFinalNominal),
    diferencaFinanciamento: Math.round(diferencaFinanciamento),
    mesesCriticos,
    rendaTotal: renda,
    disponivelTotal: dispMes,
  };
}

function gerarParecer(
  rows: RowSimulacao[],
  stats: StatsSimulacao,
  config: SimulacaoConfig,
  dispMes: number,
): ParecerItem[] {
  const items: ParecerItem[] = [];
  if (rows.length === 0) return items;

  const normais = rows.filter((r) => r.anual === 0);
  const mediaNormais =
    normais.length > 0 ? normais.reduce((a, r) => a + r.total, 0) / normais.length : 0;
  const pctNormais = stats.rendaTotal > 0 ? (mediaNormais / stats.rendaTotal) * 100 : 0;

  // Saldo devedor — destaque
  if (config.entrada.modo_incc === "saldo_acumula") {
    items.push({
      tom: stats.diferencaFinanciamento > 0 ? "alerta" : "info",
      icone: "⚠️",
      titulo: "INCC absorvido pelo saldo",
      texto: `Cliente paga só a parcela contratual. INCC infla o saldo: financiamento bancário sairá ${stats.diferencaFinanciamento > 0 ? "+R$ " + stats.diferencaFinanciamento.toLocaleString("pt-BR") : "igual"} do nominal (${formatBR(stats.saldoFinal)} vs ${formatBR(stats.saldoFinalNominal)}).`,
    });
  } else {
    items.push({
      tom: "info",
      icone: "💸",
      titulo: "INCC pago mensalmente",
      texto: `Cliente cobre o INCC todo mês (~R$ ${Math.round(stats.totalINCC / rows.length).toLocaleString("pt-BR")}/mês em média). Total pago: ${formatBR(stats.totalINCCPagoCliente)}. Saldo na entrega: ${formatBR(stats.saldoFinal)}.`,
    });
  }

  if (stats.totalAto > 0) {
    items.push({
      tom: "info",
      icone: "✍️",
      titulo: "Ato (à vista)",
      texto: `${formatBR(stats.totalAto)} pagos na assinatura, separados das parcelas mensais. Abate o saldo devedor inicial.`,
    });
  }

  if (stats.totalDocumentacao > 0) {
    const inicio = rows.find((r) => r.documentacao > 0);
    const fim = [...rows].reverse().find((r) => r.documentacao > 0);
    items.push({
      tom: "info",
      icone: "📄",
      titulo: "Custos cartoriais diluídos",
      texto: `~R$ ${Math.round(rows.find((r) => r.documentacao > 0)?.documentacao ?? 0).toLocaleString("pt-BR")}/mês entre os meses ${inicio?.mes}–${fim?.mes}. Total ${formatBR(stats.totalDocumentacao)} já incluído no fluxo.`,
    });
  } else if (stats.totalCustosCartoriais > 0) {
    items.push({
      tom: "info",
      icone: "📄",
      titulo: "Custos cartoriais (à vista)",
      texto: `${formatBR(stats.totalCustosCartoriais)} (ITBI + cartórios + taxas) pagos no registro/entrega — fora do fluxo mensal.`,
    });
  }

  if (mediaNormais > 0) {
    const tom = pctNormais < 30 ? "ok" : "alerta";
    items.push({
      tom,
      icone: pctNormais < 30 ? "💚" : "⚠️",
      titulo: "Meses normais",
      texto: `~${formatBR(mediaNormais)}/mês = ~${pctNormais.toFixed(0)}% da renda. Sobram ~${formatBR(dispMes - mediaNormais)}/mês.`,
    });
  }

  if (stats.picoDezembros > 0) {
    const tom = stats.picoDezembros <= dispMes + stats.rendaTotal ? "ok" : "alerta";
    items.push({
      tom,
      icone: "📅",
      titulo: "Pico nos meses anuais",
      texto: `Pico de ${formatBR(stats.picoDezembros)}. ${tom === "ok" ? "Coberto pelo 13º com folga." : "Atenção: pode estourar o 13º."}`,
    });
  }

  if (stats.totalTEO > 0) {
    items.push({
      tom: "info",
      icone: "🏦",
      titulo: "TEO Banco",
      texto: `${formatBR(stats.totalTEO)} totais ao longo da obra (proporcional à evolução).`,
    });
  }

  if (stats.mesesCriticos > 0) {
    items.push({
      tom: "alerta",
      icone: "🚨",
      titulo: `${stats.mesesCriticos} mês(es) com disponibilidade negativa`,
      texto: `Em alguns meses o desembolso supera o disponível mensal. Revise gastos, anuais ou conte com 13º/reservas.`,
    });
  }

  const _rotulo = config.rotulo;
  void _rotulo;

  return items;
}

function formatBR(v: number): string {
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}
