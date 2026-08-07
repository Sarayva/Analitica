// CONTROLES APP
let isDarkMode = localStorage.getItem('sppharma_darkmode') === 'true';
if (isDarkMode) document.body.classList.add('dark-mode');

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('sppharma_darkmode', document.body.classList.contains('dark-mode'));
}

let historicoConsultas = JSON.parse(localStorage.getItem('sppharma_history') || '[]');

function salvarHistorico(itemName, eanNum, top3Array, sugestaoValor) {
    const registro = {
        id: Date.now(),
        data: new Date().toLocaleString('pt-BR'),
        item: itemName,
        ean: eanNum,
        top3: top3Array.map(t => ({ farmacia: t.farmacia, preco: t.preco, count: t.count })),
        sugestao: sugestaoValor
    };
    historicoConsultas.unshift(registro);
    if (historicoConsultas.length > 50) historicoConsultas.pop();
    localStorage.setItem('sppharma_history', JSON.stringify(historicoConsultas));
}

function abrirHistorico() {
    document.getElementById('mainHome').style.display = 'none';
    document.getElementById('historyView').style.display = 'block';
    document.getElementById('btnHist').style.display = 'none';
    document.getElementById('btnHome').style.display = 'flex';
    document.getElementById('historySearch').value = "";
    renderHistorico();
}

function fecharHistorico() {
    document.getElementById('historyView').style.display = 'none';
    document.getElementById('mainHome').style.display = 'block';
    document.getElementById('btnHome').style.display = 'none';
    document.getElementById('btnHist').style.display = 'flex';
}

function limparAnalise() {
    document.getElementById('dados').value = '';
    document.getElementById('results').style.display = 'none';
    document.getElementById('btnPdf').style.display = 'none';
    document.getElementById('currentEanTag').style.display = 'none';
    document.getElementById('dados').focus();
}

function limparHistorico() {
    if (confirm('Tem certeza que deseja apagar todo o histórico de buscas?')) {
        historicoConsultas = [];
        localStorage.setItem('sppharma_history', JSON.stringify(historicoConsultas));
        renderHistorico();
    }
}

function renderHistorico() {
    const grid = document.getElementById('historyGrid');
    let query = document.getElementById('historySearch').value.toLowerCase().trim();
    let dadosFiltrados = query ? historicoConsultas.filter(h => (h.item && h.item.toLowerCase().includes(query)) || (h.ean && h.ean.includes(query))) : historicoConsultas;

    if (dadosFiltrados.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; font-size:1.1rem;">Nenhum resultado.</p>';
        document.querySelector('#historyView button[onclick="limparHistorico()"]').style.display = 'none';
        return;
    }

    document.querySelector('#historyView button[onclick="limparHistorico()"]').style.display = 'flex';

    grid.innerHTML = '';
    dadosFiltrados.forEach(h => {
        let rows = h.top3.map((t, idx) => {
            let countLabel = t.count ? ` <span style="font-size:0.75rem; display:inline-block; font-weight:600; color:var(--text-main); background:var(--glass-bg); border: 1px solid var(--glass-border); padding:0.1rem 0.5rem; border-radius:12px; margin-left:0.5rem; transform: translateY(-1px);">🔥 ${t.count}x</span>` : '';
            return `
                    <div class="history-row">
                        <span class="history-row-pharma">${idx + 1}º ${t.farmacia}${countLabel}</span>
                        <span class="history-row-price">R$ ${t.preco.toFixed(2).replace('.', ',')}</span>
                    </div>`
        }).join('');

        let suggestStr = `R$ ${h.sugestao.toFixed(2).replace('.', ',')}`;
        let eanHtml = h.ean ? `<span class="history-ean-tag">EAN: ${h.ean}</span>` : '';

        grid.innerHTML += `
                    <div class="history-card">
                        <div class="history-date"><span>${h.data}</span>${eanHtml}</div>
                        <div class="history-title">${h.item}</div>
                        <div class="history-top3">${rows}</div>
                        <div class="history-suggested">Sugestão: ${suggestStr}</div>
                    </div>`;
    });
}

// ALGORITMOS NÚCLEO
function aplicarPrecoPsicologico(precoAlvo) {
    let tentarPreco = precoAlvo - 0.01;
    let inteiro = Math.floor(tentarPreco);
    let centavos = Math.round((tentarPreco - inteiro) * 100);

    if (centavos === 99) return inteiro + 0.99;
    let ultimoDigito = centavos % 10;
    if (ultimoDigito === 9) {
        return inteiro + (centavos / 100);
    } else {
        let novosCentavos = Math.floor(centavos / 10) * 10 - 1;
        if (novosCentavos < 0) { novosCentavos = 99; inteiro -= 1; }
        return inteiro + (novosCentavos / 100);
    }
}

function normalizarNome(nome) {
    const regras = {
        "RAIA": "RD SAÚDE",
        "DROGA RAIA": "RD SAÚDE",
        "DROGARIA RAIA": "RD SAÚDE",
        "DROGASIL": "RD SAÚDE",
        "RD SAUDE": "RD SAÚDE",
        "RD SAÚDE": "RD SAÚDE",
        "RAIA DROGASIL": "RD SAÚDE",
        "DROGARIA SÃO PAULO": "GRUPO DPSP",
        "DROGARIA SAO PAULO": "GRUPO DPSP",
        "DROGARIAS PACHECO": "GRUPO DPSP",
        "PACHECO": "GRUPO DPSP",
        "DPSP": "GRUPO DPSP",
        "REDE DE FARMÁCIAS SÃO PAULO": "REDE DE FARMÁCIAS SÃO PAULO",
        "REDE DE FARMACIAS SAO PAULO": "REDE DE FARMÁCIAS SÃO PAULO",
        "FARMÁCIAS SÃO PAULO": "REDE DE FARMÁCIAS SÃO PAULO",
        "FARMACIAS SAO PAULO": "REDE DE FARMÁCIAS SÃO PAULO",
        "REDE SAO PAULO": "REDE DE FARMÁCIAS SÃO PAULO",
        "REDE SÃO PAULO": "REDE DE FARMÁCIAS SÃO PAULO",
        "PAGUE MENOS": "GRUPO PAGUE MENOS",
        "EXTRAFARMA": "GRUPO PAGUE MENOS",
        "SÃO JOÃO": "FARMÁCIAS SÃO JOÃO",
        "SAO JOAO": "FARMÁCIAS SÃO JOÃO",
        "FARMÁCIAS SÃO JOÃO": "FARMÁCIAS SÃO JOÃO",
        "FARMACIAS SAO JOAO": "FARMÁCIAS SÃO JOÃO",
        "BRAIR": "FARMÁCIAS SÃO JOÃO",
        "PANVEL": "PANVEL",
        "FARMÁCIAS PANVEL": "PANVEL",
        "DIMED": "PANVEL",
        "NISSEI": "FARMÁCIAS NISSEI",
        "FARMÁCIAS NISSEI": "FARMÁCIAS NISSEI",
        "FARMACIAS NISSEI": "FARMÁCIAS NISSEI",
        "ARAUJO": "DROGARIA ARAUJO",
        "DROGARIA ARAUJO": "DROGARIA ARAUJO",
        "DROGAL": "DROGAL",
        "ULTRAFARMA": "ULTRAFARMA",
        "ULTRAFARMA POPULAR": "ULTRAFARMA",
        "REDEPHARMA": "REDEPHARMA",
        "INDIANA": "FARMÁCIA INDIANA",
        "FARMÁCIA INDIANA": "FARMÁCIA INDIANA",
        "SANTA MARTA": "SANTA MARTA",
        "GLOBO": "FARMÁCIAS GLOBO",
        "FARMÁCIAS GLOBO": "FARMÁCIAS GLOBO",
        "FARMA CONDE": "FARMA CONDE",
        "CONDE": "FARMA CONDE",
        "VENANCIO": "DROGARIAS VENANCIO",
        "DROGARIAS VENANCIO": "DROGARIAS VENANCIO",
        "ROSÁRIO": "DROGARIA ROSÁRIO",
        "ROSARIO": "DROGARIA ROSÁRIO",
        "DROGARIA ROSÁRIO": "DROGARIA ROSÁRIO",
        "PERMANENTE": "FARMÁCIA PERMANENTE",
        "FARMÁCIA PERMANENTE": "FARMÁCIA PERMANENTE",
        "POUPE JÁ": "POUPE JÁ",
        "POUPE JA": "POUPE JÁ",
        "FARMAÚTIL": "FARMAÚTIL",
        "FARMAUTIL": "FARMAÚTIL",
        "MORIFARMA": "MORIFARMA",
        "VALE VERDE": "VALE VERDE",
        "MAXFARMA": "MAXFARMA",
        "UNIPREÇO": "UNIPREÇO",
        "UNIPRECO": "UNIPREÇO",
        "FLEMING": "FARMÁCIAS FLEMING",
        "BRAVA": "FARMÁCIAS BRAVA",
        "FARMÁCIAS BRAVA": "FARMÁCIAS BRAVA",
        "CATARINENSE": "FARMÁCIA CATARINENSE",
        "FARMÁCIA CATARINENSE": "FARMÁCIA CATARINENSE",
        "SANTO REMÉDIO": "SANTO REMÉDIO",
        "SANTO REMEDIO": "SANTO REMÉDIO",
        "FLEXFARMA": "FLEXFARMA",
        "FARMABEM": "FARMABEM",
        "MINAS BRASIL": "FARMÁCIAS MINAS BRASIL",
        "SÃO RAFAEL": "FARMÁCIAS SÃO RAFAEL",
        "SAO RAFAEL": "FARMÁCIAS SÃO RAFAEL",
        "IGUATEMI": "FARMÁCIAS IGUATEMI",
        "TODO DIA": "FARMÁCIA TODO DIA",
        "PREÇO POPULAR": "PREÇO POPULAR",
        "PRECO POPULAR": "PREÇO POPULAR"
    };

    let n = nome.toUpperCase();
    const chaves = Object.keys(regras).sort((a, b) => b.length - a.length);

    for (let chave of chaves) {
        if (n.includes(chave)) return regras[chave];
    }
    return nome;
}

let relatorioAtualNome = "Analítica - Farmácias São Paulo";

function exportarPDF() {
    let tituloOriginal = document.title;
    // O navegador utiliza a tag <title> atual como nome primário do arquivo de PDF
    document.title = relatorioAtualNome;
    window.print();
    // Retorna o título ao padrão após renderização local
    setTimeout(() => { document.title = tituloOriginal; }, 2000);
}

function analisar() {
    const texto = document.getElementById('dados').value;
    const minhaFarmacia = 'SÃO PAULO';

    if (!texto.trim()) { alert("Por favor, cole os dados para analisar."); return; }

    let eanCapturado = "";
    let eanMatches = texto.match(/\b\d{8,14}\b/g);
    if (eanMatches && eanMatches.length > 0) eanCapturado = eanMatches[0];

    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l !== '');
    const entries = [];

    let nomeProdutoCapturado = "Produto Desconhecido";
    let produtoJáCapturado = false;

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i];
        let match = linha.match(/^R\$\s*([\d.]+(?:,\d+)?)$/);

        if (match) {
            let precoStr = match[1].replace(/\./g, '').replace(',', '.');
            let preco = parseFloat(precoStr);

            if (!produtoJáCapturado && (i + 1) < linhas.length) {
                nomeProdutoCapturado = linhas[i + 1];
                produtoJáCapturado = true;
            }

            let farmaciaOriginal = "";
            if (i + 2 < linhas.length) farmaciaOriginal = linhas[i + 2];

            entries.push({ preco: preco, farmaciaOriginal: farmaciaOriginal, farmacia: normalizarNome(farmaciaOriginal) });
        }
    }

    if (entries.length === 0) { alert("Não foram identificados blocos de preços válidos."); return; }

    const freqMap = {};
    entries.forEach(e => {
        let key = e.farmacia + '|' + e.preco;
        if (!freqMap[key]) freqMap[key] = { farmacia: e.farmacia, preco: e.preco, count: 0, original: e.farmaciaOriginal };
        freqMap[key].count++;
    });

    let grouped = Object.values(freqMap);
    grouped.sort((a, b) => a.preco - b.preco);

    let ignorados = [];
    if (grouped.length > 2 && grouped[0].count === 1) ignorados.push(grouped.shift());
    if (grouped.length > 2 && grouped[grouped.length - 1].count === 1) ignorados.push(grouped.pop());

    grouped.sort((a, b) => b.count - a.count || a.preco - b.preco);

    const top3 = grouped.slice(0, 3);
    const topCards = document.getElementById('topCards');
    topCards.innerHTML = '';

    top3.forEach((item, index) => {
        let isFirst = index === 0;
        let classe = isFirst ? 'rank-card first' : 'rank-card';
        let positionText = index === 0 ? '1' : (index === 1 ? '2' : '3');
        let precoFormatado = item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        topCards.innerHTML += `
                    <div class="${classe}">
                        <div class="badge">${positionText}</div>
                        <div class="pharmacy-name">${item.farmacia}</div>
                        <div class="price"><span style="font-size:1.5rem;font-weight:400;margin-right:0.2rem;">R$</span>${precoFormatado}</div>
                        <div class="frequency">Constatado ${item.count} vez(es)</div>
                    </div>`;
    });

    if (top3.length > 0) {
        let primeiroPreco = top3[0].preco;
        let precoPsicologico = aplicarPrecoPsicologico(primeiroPreco);
        document.getElementById('suggestedPrice').innerText = precoPsicologico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        relatorioAtualNome = nomeProdutoCapturado + (eanCapturado ? ` - ${eanCapturado}` : "");

        let eanTag = document.getElementById('currentEanTag');
        if (eanCapturado) {
            eanTag.innerText = "EAN: " + eanCapturado;
            eanTag.style.display = "inline-block";
        } else { eanTag.style.display = "none"; }

        let tempoAtual = Date.now();
        if (historicoConsultas.length === 0 || historicoConsultas[0].item !== nomeProdutoCapturado || (tempoAtual - historicoConsultas[0].id) > 5000) {
            salvarHistorico(nomeProdutoCapturado, eanCapturado, top3, precoPsicologico);
        }
    }

    let ignoredMsg = document.getElementById('ignoredMsg');
    if (ignorados.length > 0) {
        let msg = ignorados.map(ig => `${ig.farmacia} (R$ ${ig.preco.toFixed(2).replace('.', ',')})`).join(', ');
        ignoredMsg.innerHTML = `<li>Extremos cortados: ${msg}.</li>`;
    } else {
        ignoredMsg.innerHTML = `<li>Todos os preços lidos foram estatisticamente válidos. Nenhuma anomalia removida.</li>`;
    }

    let myStatsText = "A Farmácia São Paulo não apareceu nestes resultados (ou seus preços foram considerados extremos e filtrados pela margem de anomalias estatísticas).";
    let regex = new RegExp(minhaFarmacia, 'i');
    let minha = grouped.find(x => x.farmacia.match(regex) || x.original.match(regex));
    if (minha) {
        let posIdx = grouped.indexOf(minha) + 1;
        myStatsText = `A São Paulo ranqueou na <b>posição ${posIdx}</b> da lista em volumetria. Com o preço constatado de <b>R$ ${minha.preco.toFixed(2).replace('.', ',')}</b> (${minha.count} ocorrências no banco).`;
    }
    document.getElementById('myPharmacyStats').innerHTML = myStatsText;

    document.getElementById('results').style.display = 'block';
    document.getElementById('btnPdf').style.display = 'flex';
}