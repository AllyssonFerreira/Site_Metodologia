let data = null;
let eventInfo = null;
let currentView = 'home';
let selectedCategory = null;
let selectedSubcategory = null;
let breadcrumb = [];

function buildHierarchy(artigos) {
    const categorias = {};

    artigos.forEach(artigo => {
        const catKey = artigo.categoria_principal;
        const subKey = artigo.subcategoria;

        if (!categorias[catKey]) {
            categorias[catKey] = { nome: catKey, subcategorias: {} };
        }
        if (!categorias[catKey].subcategorias[subKey]) {
            categorias[catKey].subcategorias[subKey] = { nome: subKey, artigos: [] };
        }
        categorias[catKey].subcategorias[subKey].artigos.push(artigo);
    });

    return {
        nome: "ENCompIF",
        categorias: Object.values(categorias).map(cat => ({
            ...cat,
            subcategorias: Object.values(cat.subcategorias)
        }))
    };
}

function countArticles(category) {
    return category.subcategorias.reduce((sum, sub) => sum + sub.artigos.length, 0);
}

function renderNode(cat, index) {
    return `
        <div class="node stagger-in" style="animation-delay: ${index * 80}ms" onclick="selectCategory(${index})">
            <span class="node-label">${cat.nome}</span>
            <span class="node-count">${countArticles(cat)} artigos · ${cat.subcategorias.length} áreas</span>
            <span class="node-arrow">→</span>
        </div>
    `;
}

function renderLoading() {
    document.getElementById('app').innerHTML = `
        <div class="loading-state fade-in">
            <div class="spinner"></div>
            <span>Carregando artigos...</span>
        </div>
    `;
}

function renderError(message) {
    document.getElementById('app').innerHTML = `
        <div class="error-state fade-in">
            <h2>⚠️ Erro ao carregar</h2>
            <p>${message}</p>
            <button class="retry-button" onclick="loadData()">Tentar Novamente</button>
        </div>
    `;
}

async function loadData() {
    renderLoading();
    try {
        const response = await fetch('./Artigos.json');
        if (!response.ok) throw new Error('Arquivo não encontrado (HTTP ' + response.status + ')');
        const allEntries = await response.json();

        // Separate event metadata from articles
        const metaEntry = allEntries.find(e => !e.categoria_principal);
        if (metaEntry) {
            eventInfo = metaEntry;
        }
        const artigos = allEntries.filter(e => e.categoria_principal);
        data = buildHierarchy(artigos);
        renderHome();
    } catch (err) {
        renderError(err.message);
    }
}

const LS = 'stroke="rgba(13,148,136,0.5)" stroke-width="3" fill="none"';

function renderHome() {
    if (!data) return loadData();
    currentView = 'home';
    selectedCategory = null;
    selectedSubcategory = null;
    breadcrumb = [];

    const cats = data.categorias;
    const topRow = cats.slice(0, 3);
    const bottomRow = cats.slice(3, 6);

    // Positions: left=160, center=480, right=800 in a 960 viewBox
    const html = `
        <div class="hierarchy-view fade-in">
            <div class="organogram">
                <!-- Top row -->
                <div class="org-row">
                    ${topRow.map((cat, i) => renderNode(cat, i)).join('')}
                </div>

                <!-- Top connectors: 3 stubs down → horizontal bar → vertical to center -->
                <svg class="org-lines" viewBox="0 0 960 80" preserveAspectRatio="xMidYMid meet">
                    <!-- 3 short stubs from each node bottom -->
                    <line x1="160" y1="0" x2="160" y2="30" ${LS}/>
                    <line x1="480" y1="0" x2="480" y2="30" ${LS}/>
                    <line x1="800" y1="0" x2="800" y2="30" ${LS}/>
                    <!-- Horizontal bar connecting all 3 -->
                    <line x1="160" y1="30" x2="800" y2="30" ${LS}/>
                    <!-- Vertical from center of bar down -->
                    <line x1="480" y1="30" x2="480" y2="80" ${LS}/>
                </svg>

                <!-- Central node -->
                <div class="org-center">
                    <div class="central-node clickable" onclick="showEventInfo()">${data.nome}</div>
                </div>

                <!-- Bottom connectors: vertical from center → horizontal bar → 3 stubs down -->
                <svg class="org-lines" viewBox="0 0 960 80" preserveAspectRatio="xMidYMid meet">
                    <!-- Vertical from center down -->
                    <line x1="480" y1="0" x2="480" y2="50" ${LS}/>
                    <!-- Horizontal bar connecting all 3 -->
                    <line x1="160" y1="50" x2="800" y2="50" ${LS}/>
                    <!-- 3 short stubs from bar to each node -->
                    <line x1="160" y1="50" x2="160" y2="80" ${LS}/>
                    <line x1="480" y1="50" x2="480" y2="80" ${LS}/>
                    <line x1="800" y1="50" x2="800" y2="80" ${LS}/>
                </svg>

                <!-- Bottom row -->
                <div class="org-row">
                    ${bottomRow.map((cat, i) => renderNode(cat, i + 3)).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = html;
}

function showEventInfo() {
    if (!eventInfo) return;
    currentView = 'event';
    breadcrumb = [data.nome];

    const totalArticles = data.categorias.reduce((sum, cat) => sum + countArticles(cat), 0);

    const html = `
        <div class="breadcrumb fade-in">
            <span class="breadcrumb-item" onclick="renderHome()">← Voltar</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">Sobre o ${eventInfo.titulo}</span>
        </div>
        <div class="articles-section fade-in">
            <div class="subcategory-header">${eventInfo.titulo}</div>
            <div class="event-info-content">
                <p class="event-description">${eventInfo['descrição']}</p>

                <div class="event-stats">
                    <div class="event-stat">
                        <span class="event-stat-number">${totalArticles}</span>
                        <span class="event-stat-label">Artigos</span>
                    </div>
                    <div class="event-stat">
                        <span class="event-stat-number">${data.categorias.length}</span>
                        <span class="event-stat-label">Categorias</span>
                    </div>
                    <div class="event-stat">
                        <span class="event-stat-number">${data.categorias.reduce((s, c) => s + c.subcategorias.length, 0)}</span>
                        <span class="event-stat-label">Subcategorias</span>
                    </div>
                    ${eventInfo['Edição Catalagada'] ? `
                    <div class="event-stat">
                        <span class="event-stat-number" style="font-size:22px">${eventInfo['Edição Catalagada']}</span>
                        <span class="event-stat-label">Edições Catalogadas</span>
                    </div>
                    ` : ''}
                </div>

                <h3 class="event-topics-title">Tópicos de Interesse</h3>
                <div class="keywords">
                    ${eventInfo.topicos_interesse.map(t => `<span class="keyword-tag">${t}</span>`).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = html;
}

function selectCategory(index) {
    currentView = 'category';
    selectedCategory = index;
    breadcrumb = [data.nome, data.categorias[index].nome];

    const category = data.categorias[index];
    const count = category.subcategorias.length;

    // Calculate X positions for each subcategory in a 960-wide viewBox
    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push(960 / (count + 1) * (i + 1));
    }
    const leftX = positions[0];
    const rightX = positions[positions.length - 1];

    // Build SVG connector lines (always T-connector style)
    const svgLines = `
        <!-- Vertical from center down -->
        <line x1="480" y1="0" x2="480" y2="50" ${LS}/>
        <!-- Horizontal bar -->
        <line x1="${leftX}" y1="50" x2="${rightX}" y2="50" ${LS}/>
        <!-- Stubs down to each node -->
        ${positions.map(x => `<line x1="${x}" y1="50" x2="${x}" y2="80" ${LS}/>`).join('')}
    `;

    const gridCols = count <= 3 ? count : 3;

    const html = `
        <div class="breadcrumb fade-in">
            <span class="breadcrumb-item" onclick="renderHome()">${data.nome}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${category.nome}</span>
        </div>
        <div class="hierarchy-view fade-in">
            <div class="organogram">
                <div class="org-center">
                    <div class="central-node">${category.nome}</div>
                </div>

                <svg class="org-lines" viewBox="0 0 960 80" preserveAspectRatio="xMidYMid meet">
                    ${svgLines}
                </svg>

                <div class="org-row" style="grid-template-columns: repeat(${gridCols}, 1fr)">
                    ${category.subcategorias.map((subcat, subIndex) => `
                        <div class="node stagger-in" style="animation-delay: ${subIndex * 100}ms" onclick="selectSubcategory(${index}, ${subIndex})">
                            <span class="node-label">${subcat.nome}</span>
                            <span class="node-count">${subcat.artigos.length} artigos</span>
                            <span class="node-arrow">→</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = html;
}

function selectSubcategory(catIndex, subIndex) {
    currentView = 'subcategory';
    selectedSubcategory = subIndex;

    const category = data.categorias[catIndex];
    const subcategory = category.subcategorias[subIndex];
    breadcrumb = [data.nome, category.nome, subcategory.nome];

    const html = `
        <div class="breadcrumb fade-in">
            <span class="breadcrumb-item" onclick="renderHome()">${data.nome}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item" onclick="selectCategory(${catIndex})">${category.nome}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${subcategory.nome}</span>
        </div>
        <div class="articles-section fade-in">
            <div class="subcategory-header">${subcategory.nome}</div>
            <div class="articles-grid">
                ${subcategory.artigos.map((article, i) => `
                    <div class="article-card stagger-in" style="animation-delay: ${i * 60}ms">
                        <div class="article-title">${article.titulo}</div>
                        <div class="article-authors">${article.autores.join(', ')}</div>
                        <div class="article-meta">
                            <span class="badge">${article.edicao}</span>
                            ${article.paginas ? `<span class="badge">${article.paginas} págs.</span>` : ''}
                        </div>
                        <div class="article-institutions">${article.instituicoes.join(' · ')}</div>
                        <div class="article-abstract">${article.resumo}</div>
                        ${article.palavras_chave && article.palavras_chave.length > 0 ? `<div class="keywords">${article.palavras_chave.map(k => `<span class="keyword-tag">${k}</span>`).join('')}</div>` : ''}
                        <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="article-button">
                            Acessar Artigo →
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('app').innerHTML = html;
}

// Inicializar a aplicação
loadData();
