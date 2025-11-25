// ⚙️ CONFIGURACIÓN - Tu backend en Railway
const BACKEND_URL = 'https://zephiryxproxy-production.up.railway.app';

// Estado de la aplicación
let history = [];
let favorites = JSON.parse(localStorage.getItem('zephiryx-favorites') || '[]');
let historyIndex = -1;
let loadingTimeout;

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
        updateStatus('Verificando conexión...');
        connectionStatus.style.display = 'flex';
        
        const response = await fetch(`${BACKEND_URL}/`, { 
            method: 'GET',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            updateStatus('✓ Conectado y listo');
            goBtn.disabled = false;
            connectionStatus.style.display = 'none';
            return true;
        } else {
            throw new Error('Backend no responde correctamente');
        }
    } catch (error) {
        console.error('Error conectando con backend:', error);
        updateStatus('⚠️ Error de conexión');
        connectionStatus.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>No se pudo conectar con Railway. Verifica que el backend esté activo: <a href="${BACKEND_URL}" target="_blank" style="color: #fbbf24; text-decoration: underline;">${BACKEND_URL}</a></span>
        `;
        connectionStatus.style.display = 'flex';
        goBtn.disabled = true;
        return false;
    }
}

function updateStatus(text) {
    statusText.textContent = text;
}

// Timeout de seguridad para el loading
function setLoadingTimeout() {
    clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
        if (loadingScreen.style.display === 'flex') {
            console.log('Timeout alcanzado, mostrando iframe');
            loadingScreen.style.display = 'none';
            proxyFrame.style.display = 'block';
        }
    }, 8000); // 8 segundos máximo
}

// Navegar a URL
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

    // URL del backend con hash
    const encodedUrl = encodeURIComponent(formattedUrl);
    const proxyUrl = `${BACKEND_URL}/#q=${encodedUrl}`;
    
    console.log('Navegando a:', formattedUrl);
    console.log('URL del proxy:', proxyUrl);
    
    // Actualizar historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formattedUrl);
    history = newHistory;
    historyIndex = newHistory.length - 1;

    // Cargar en iframe
    proxyFrame.src = proxyUrl;
    urlInput.value = formattedUrl;
    
    // Establecer timeout de seguridad
    setLoadingTimeout();
    
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
        setLoadingTimeout();
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
        setLoadingTimeout();
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
        setLoadingTimeout();
    }
}

// Ir a inicio
function goHome() {
    homePage.style.display = 'block';
    loadingScreen.style.display = 'none';
    proxyFrame.style.display = 'none';
    proxyFrame.src = '';
    urlInput.value = '';
    starBtn.style.display = 'none';
    clearTimeout(loadingTimeout);
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
    if (e.key === 'Enter' && !goBtn.disabled) {
        navigate(urlInput.value);
    }
});

goBtn.addEventListener('click', () => {
    if (!goBtn.disabled) {
        navigate(urlInput.value);
    }
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
        if (!goBtn.disabled) {
            const url = card.dataset.url;
            urlInput.value = url;
            navigate(url);
        } else {
            alert('Conectando con el servidor, espera un momento...');
        }
    });
});

// Iframe load event - con timeout de seguridad
proxyFrame.addEventListener('load', () => {
    clearTimeout(loadingTimeout);
    // Pequeño delay para que el contenido se renderice
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        proxyFrame.style.display = 'block';
    }, 1000);
});

// Manejo de errores del iframe
proxyFrame.addEventListener('error', (e) => {
    console.error('Error en iframe:', e);
    clearTimeout(loadingTimeout);
    loadingScreen.style.display = 'none';
    alert('Error al cargar el sitio. Posibles causas:\n\n1. El backend de Railway no está activo\n2. El sitio web bloquea ser cargado en iframes\n3. Problema de conexión\n\nIntenta con otro sitio o verifica Railway.');
    goHome();
});

// Inicializar - Verificar conexión al cargar la página
checkBackendConnection();
renderFavorites();

// Re-verificar conexión cada 30 segundos
setInterval(() => {
    if (goBtn.disabled) {
        checkBackendConnection();
    }
}, 30000);
