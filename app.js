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
        nome: 'ENCOMPIF',
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
            <span class="node-count">${countArticles(cat)} artigos &middot; ${cat.subcategorias.length} áreas</span>
            <span class="node-arrow">&rarr;</span>
        </div>
    `;
}

function renderSubcategoryNode(catIndex, subcat, subIndex) {
    return `
        <div class="node stagger-in" style="animation-delay: ${subIndex * 100}ms" onclick="selectSubcategory(${catIndex}, ${subIndex})">
            <span class="node-label">${subcat.nome}</span>
            <span class="node-count">${subcat.artigos.length} artigos</span>
            <span class="node-arrow">&rarr;</span>
        </div>
    `;
}

function renderMobileChain(rootNodeHtml, childNodesHtml) {
    const chainedNodes = childNodesHtml.map(nodeHtml => `
        <span class="mobile-org-connector" aria-hidden="true"></span>
        <div class="mobile-org-item">${nodeHtml}</div>
    `).join('');

    return `
        <div class="mobile-organogram">
            <div class="mobile-org-item">${rootNodeHtml}</div>
            ${chainedNodes}
        </div>
    `;
}

function renderScrollTopButton() {
    return `
        <button
            id="scrollTopButton"
            class="scroll-top-button"
            type="button"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
            onclick="scrollToTop()"
        >
            ↑
        </button>
    `;
}

function updateScrollTopButtonVisibility() {
    const button = document.getElementById('scrollTopButton');
    if (!button) return;

    const shouldShow = window.scrollY > 280;
    button.classList.toggle('visible', shouldShow);
}

function initScrollTopButtonBehavior() {
    if (window.__scrollTopButtonBound) return;

    window.addEventListener('scroll', updateScrollTopButtonVisibility, { passive: true });
    window.addEventListener('resize', updateScrollTopButtonVisibility);
    window.__scrollTopButtonBound = true;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderApp(content) {
    const app = document.getElementById('app');
    app.innerHTML = `${content}${renderScrollTopButton()}`;
    initScrollTopButtonBehavior();
    updateScrollTopButtonVisibility();
}

function renderLoading() {
    renderApp(`
        <div class="loading-state fade-in">
            <div class="spinner"></div>
            <span>Carregando artigos...</span>
        </div>
    `);
}

function renderError(message) {
    renderApp(`
        <div class="error-state fade-in">
            <h2>⚠️ Erro ao carregar</h2>
            <p>${message}</p>
            <button class="retry-button" onclick="loadData()">Tentar Novamente</button>
        </div>
    `);
}

async function loadData() {
    renderLoading();

    try {
        const response = await fetch('./Artigos.json');
        if (!response.ok) {
            throw new Error('Arquivo não encontrado (HTTP ' + response.status + ')');
        }

        const allEntries = await response.json();
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
    const mobileChain = renderMobileChain(
        `<div class="central-node clickable" onclick="showEventInfo()">${data.nome}</div>`,
        cats.map((cat, i) => renderNode(cat, i))
    );

    const html = `
        <div class="hierarchy-view fade-in">
            <div class="organogram organogram-desktop">
                <div class="org-row">
                    ${topRow.map((cat, i) => renderNode(cat, i)).join('')}
                </div>

                <svg class="org-lines" viewBox="0 0 960 80" preserveAspectRatio="xMidYMid meet">
                    <line x1="160" y1="0" x2="160" y2="30" ${LS}/>
                    <line x1="480" y1="0" x2="480" y2="30" ${LS}/>
                    <line x1="800" y1="0" x2="800" y2="30" ${LS}/>
                    <line x1="160" y1="30" x2="800" y2="30" ${LS}/>
                    <line x1="480" y1="30" x2="480" y2="80" ${LS}/>
                </svg>

                <div class="org-center">
                    <div class="central-node clickable" onclick="showEventInfo()">${data.nome}</div>
                </div>

                <svg class="org-lines" viewBox="0 0 960 80" preserveAspectRatio="xMidYMid meet">
                    <line x1="480" y1="0" x2="480" y2="50" ${LS}/>
                    <line x1="160" y1="50" x2="800" y2="50" ${LS}/>
                    <line x1="160" y1="50" x2="160" y2="80" ${LS}/>
                    <line x1="480" y1="50" x2="480" y2="80" ${LS}/>
                    <line x1="800" y1="50" x2="800" y2="80" ${LS}/>
                </svg>

                <div class="org-row">
                    ${bottomRow.map((cat, i) => renderNode(cat, i + 3)).join('')}
                </div>
            </div>
            ${mobileChain}
        </div>
    `;

    renderApp(html);
}

function showEventInfo() {
    if (!eventInfo) return;

    currentView = 'event';
    breadcrumb = [data.nome];

    const totalArticles = data.categorias.reduce((sum, cat) => sum + countArticles(cat), 0);

    const html = `
        <div class="breadcrumb fade-in">
            <span class="breadcrumb-item" onclick="renderHome()">&larr; Voltar</span>
            <span class="breadcrumb-separator">&rsaquo;</span>
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
                    ${(eventInfo.topicos_interesse || []).map(t => `<span class="keyword-tag">${t}</span>`).join('')}
                </div>
            </div>
        </div>
    `;

    renderApp(html);
}

function selectCategory(index) {
    currentView = 'category';
    selectedCategory = index;
    breadcrumb = [data.nome, data.categorias[index].nome];

    const category = data.categorias[index];
    const count = category.subcategorias.length;

    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push((960 / (count + 1)) * (i + 1));
    }
    const leftX = positions[0];
    const rightX = positions[positions.length - 1];

    const svgLines = `
        <line x1="480" y1="0" x2="480" y2="50" ${LS}/>
        <line x1="${leftX}" y1="50" x2="${rightX}" y2="50" ${LS}/>
        ${positions.map(x => `<line x1="${x}" y1="50" x2="${x}" y2="80" ${LS}/>`).join('')}
    `;

    const gridCols = count <= 3 ? count : 3;
    const mobileChain = renderMobileChain(
        `<div class="central-node">${category.nome}</div>`,
        category.subcategorias.map((subcat, subIndex) => renderSubcategoryNode(index, subcat, subIndex))
    );

    const html = `
        <div class="breadcrumb fade-in">
            <span class="breadcrumb-item" onclick="renderHome()">${data.nome}</span>
            <span class="breadcrumb-separator">&rsaquo;</span>
            <span class="breadcrumb-current">${category.nome}</span>
        </div>
        <div class="hierarchy-view fade-in">
            <div class="organogram organogram-desktop">
                <div class="org-center">
                    <div class="central-node">${category.nome}</div>
                </div>

                <svg class="org-lines" viewBox="0 0 960 80" preserveAspectRatio="xMidYMid meet">
                    ${svgLines}
                </svg>

                <div class="org-row org-row-dynamic" style="--org-cols: ${gridCols}">
                    ${category.subcategorias.map((subcat, subIndex) => renderSubcategoryNode(index, subcat, subIndex)).join('')}
                </div>
            </div>
            ${mobileChain}
        </div>
    `;

    renderApp(html);
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
            <span class="breadcrumb-separator">&rsaquo;</span>
            <span class="breadcrumb-item" onclick="selectCategory(${catIndex})">${category.nome}</span>
            <span class="breadcrumb-separator">&rsaquo;</span>
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
                        <div class="article-institutions">${article.instituicoes.join(' &middot; ')}</div>
                        <div class="article-abstract">${article.resumo}</div>
                        ${article.palavras_chave && article.palavras_chave.length > 0 ? `<div class="keywords">${article.palavras_chave.map(k => `<span class="keyword-tag">${k}</span>`).join('')}</div>` : ''}
                        <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="article-button">
                            Acessar Artigo &rarr;
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    renderApp(html);
}

loadData();
