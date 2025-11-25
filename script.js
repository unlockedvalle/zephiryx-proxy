// ⚙️ CONFIGURACIÓN - Tu backend en Railway
const BACKEND_URL = 'https://zephiryxproxy-production.up.railway.app';

// Estado de la aplicación
let history = [];
let favorites = JSON.parse(localStorage.getItem('zephiryx-favorites') || '[]');
let historyIndex = -1;

// Elementos DOM
const urlInput = document.getElementById('url-input');
const goBtn = document.getElementById('go-btn');
const clearBtn = document.getElementById('clear-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const starBtn = document.getElementById('star-btn');
const statusText = document.getElementById('status-text');
const connectionStatus = document.getElementById('connection-status');

const historyBtn = document.getElementById('history-btn');
const favoritesBtn = document.getElementById('favorites-btn');
const historySidebar = document.getElementById('history-sidebar');
const favoritesSidebar = document.getElementById('favorites-sidebar');
const closeHistory = document.getElementById('close-history');
const closeFavorites = document.getElementById('close-favorites');

const historyList = document.getElementById('history-list');
const favoritesList = document.getElementById('favorites-list');

const homePage = document.getElementById('home-page');
const loadingScreen = document.getElementById('loading-screen');
const proxyFrame = document.getElementById('proxy-frame');

// Verificar conexión con el backend
async function checkBackendConnection() {
    try {
        updateStatus('Conectando...');
        connectionStatus.style.display = 'flex';
        
        const response = await fetch(`${BACKEND_URL}/`, { 
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            updateStatus('✓ Conectado y listo');
            goBtn.disabled = false;
            connectionStatus.style.display = 'none';
            return true;
        }
    } catch (error) {
        console.error('Error conectando con backend:', error);
        updateStatus('Error de conexión');
        connectionStatus.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>No se pudo conectar con Railway. Verifica que el backend esté activo en: ${BACKEND_URL}</span>
        `;
        connectionStatus.style.display = 'flex';
        return false;
    }
}

function updateStatus(text) {
    statusText.textContent = text;
}

// Crear iframe para cargar el proxy del backend
function createProxyIframe() {
    const iframe = document.createElement('iframe');
    iframe.id = 'backend-frame';
    iframe.style.cssText = 'position:absolute;width:100%;height:100%;border:none;';
    iframe.src = BACKEND_URL;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    return iframe;
}

// Navegar a URL - Solución: redirigir al backend directamente
function navigate(url) {
    if (!url) return;

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
    }

    // Mostrar loading
    homePage.style.display = 'none';
    loadingScreen.style.display = 'flex';
    proxyFrame.style.display = 'none';

    // SOLUCIÓN: Redirigir directamente al backend con el proxy
    // El backend manejará todo internamente con su Service Worker
    const encodedUrl = encodeURIComponent(formattedUrl);
    const proxyUrl = `${BACKEND_URL}/#q=${encodedUrl}`;
    
    // Actualizar historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formattedUrl);
    history = newHistory;
    historyIndex = newHistory.length - 1;

    // Cargar en iframe apuntando al backend
    proxyFrame.src = proxyUrl;
    urlInput.value = formattedUrl;
    
    // Actualizar botones
    updateNavigationButtons();
    starBtn.style.display = 'block';
    updateStarButton();
    renderHistory();
}

// Actualizar botones de navegación
function updateNavigationButtons() {
    backBtn.disabled = historyIndex <= 0;
    forwardBtn.disabled = historyIndex >= history.length - 1;
    refreshBtn.disabled = historyIndex < 0;
}

// Actualizar botón de favorito
function updateStarButton() {
    if (historyIndex >= 0) {
        const currentUrl = history[historyIndex];
        if (favorites.includes(currentUrl)) {
            starBtn.classList.add('active');
        } else {
            starBtn.classList.remove('active');
        }
    }
}

// Ir atrás
function goBack() {
    if (historyIndex > 0) {
        historyIndex--;
        const url = history[historyIndex];
        urlInput.value = url;
        loadingScreen.style.display = 'flex';
        proxyFrame.style.display = 'none';
        const encodedUrl = encodeURIComponent(url);
        proxyFrame.src = `${BACKEND_URL}/#q=${encodedUrl}`;
        updateNavigationButtons();
        updateStarButton();
    }
}

// Ir adelante
function goForward() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const url = history[historyIndex];
        urlInput.value = url;
        loadingScreen.style.display = 'flex';
        proxyFrame.style.display = 'none';
        const encodedUrl = encodeURIComponent(url);
        proxyFrame.src = `${BACKEND_URL}/#q=${encodedUrl}`;
        updateNavigationButtons();
        updateStarButton();
    }
}

// Recargar
function refresh() {
    if (historyIndex >= 0) {
        const url = history[historyIndex];
        loadingScreen.style.display = 'flex';
        proxyFrame.style.display = 'none';
        const encodedUrl = encodeURIComponent(url);
        proxyFrame.src = `${BACKEND_URL}/#q=${encodedUrl}`;
    }
}

// Ir a inicio
function goHome() {
    homePage.style.display = 'block';
    loadingScreen.style.display = 'none';
    proxyFrame.style.display = 'none';
    urlInput.value = '';
    starBtn.style.display = 'none';
}

// Toggle favorito
function toggleFavorite() {
    if (historyIndex >= 0) {
        const url = history[historyIndex];
        const index = favorites.indexOf(url);
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(url);
        }
        
        localStorage.setItem('zephiryx-favorites', JSON.stringify(favorites));
        updateStarButton();
        renderFavorites();
    }
}

// Renderizar historial
function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No hay historial aún</p>';
        return;
    }

    const reversedHistory = [...history].reverse();
    historyList.innerHTML = reversedHistory.map((url, idx) => `
        <div class="sidebar-item" data-url="${url}">
            <div class="sidebar-item-text">${url}</div>
        </div>
    `).join('');

    document.querySelectorAll('#history-list .sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            urlInput.value = url;
            navigate(url);
            historySidebar.classList.remove('active');
        });
    });
}

// Renderizar favoritos
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-message">No hay favoritos aún</p>';
        return;
    }

    favoritesList.innerHTML = favorites.map(url => `
        <div class="sidebar-item">
            <div class="sidebar-item-text" data-url="${url}">${url}</div>
            <button class="delete-btn" data-url="${url}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');

    document.querySelectorAll('#favorites-list .sidebar-item-text').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            urlInput.value = url;
            navigate(url);
            favoritesSidebar.classList.remove('active');
        });
    });

    document.querySelectorAll('#favorites-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            favorites = favorites.filter(fav => fav !== url);
            localStorage.setItem('zephiryx-favorites', JSON.stringify(favorites));
            renderFavorites();
            updateStarButton();
        });
    });
}

// Event Listeners
urlInput.addEventListener('input', (e) => {
    clearBtn.style.display = e.target.value ? 'block' : 'none';
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigate(urlInput.value);
    }
});

goBtn.addEventListener('click', () => {
    navigate(urlInput.value);
});

clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    urlInput.focus();
});

backBtn.addEventListener('click', goBack);
forwardBtn.addEventListener('click', goForward);
refreshBtn.addEventListener('click', refresh);
homeBtn.addEventListener('click', goHome);
starBtn.addEventListener('click', toggleFavorite);

historyBtn.addEventListener('click', () => {
    historySidebar.classList.toggle('active');
    favoritesSidebar.classList.remove('active');
});

favoritesBtn.addEventListener('click', () => {
    favoritesSidebar.classList.toggle('active');
    historySidebar.classList.remove('active');
});

closeHistory.addEventListener('click', () => {
    historySidebar.classList.remove('active');
});

closeFavorites.addEventListener('click', () => {
    favoritesSidebar.classList.remove('active');
});

// Site cards
document.querySelectorAll('.site-card').forEach(card => {
    card.addEventListener('click', () => {
        const url = card.dataset.url;
        urlInput.value = url;
        navigate(url);
    });
});

// Iframe load event
proxyFrame.addEventListener('load', () => {
    loadingScreen.style.display = 'none';
    proxyFrame.style.display = 'block';
});

// Inicializar
checkBackendConnection();
renderFavorites();
