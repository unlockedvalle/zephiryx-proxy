// ⚙️ CONFIGURACIÓN - Tu backend en Railway
const BACKEND_URL = 'https://zephiryxproxy-production.up.railway.app';

// Estado de la aplicación
let history = [];
let favorites = JSON.parse(localStorage.getItem('zephiryx-favorites') || '[]');
let historyIndex = -1;
let swReady = false;

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
        connectionStatus.style.display = 'flex';
        const response = await fetch(`${BACKEND_URL}/`, { 
            method: 'HEAD',
            mode: 'no-cors'
        });
        connectionStatus.style.display = 'none';
        return true;
    } catch (error) {
        console.error('Error conectando con backend:', error);
        connectionStatus.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Verificando conexión con Railway...</span>
        `;
        connectionStatus.style.display = 'flex';
        return true; // Continuar de todas formas
    }
}

// Registrar Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await checkBackendConnection();
            updateStatus('Iniciando proxy...');
            
            // El Service Worker ahora se cargará desde el backend
            const swUrl = `${BACKEND_URL}/uv/uv.sw.js`;
            
            const registration = await navigator.serviceWorker.register(swUrl, {
                scope: '/service/',
                type: 'classic'
            });

            // Función para verificar si el SW está activo
            const checkSWReady = () => {
                if (registration.active) {
                    swReady = true;
                    updateStatus('✓ Conectado y listo');
                    goBtn.disabled = false;
                    connectionStatus.style.display = 'none';
                    return true;
                }
                return false;
            };

            // Verificar inmediatamente
            if (checkSWReady()) return;

            // Esperar a que se active
            if (registration.installing) {
                registration.installing.addEventListener('statechange', function() {
                    if (this.state === 'activated') {
                        checkSWReady();
                    }
                });
            } else if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                registration.waiting.addEventListener('statechange', function() {
                    if (this.state === 'activated') {
                        checkSWReady();
                    }
                });
            }

            // Timeout de seguridad
            setTimeout(() => {
                if (!swReady && registration.active) {
                    checkSWReady();
                }
            }, 2000);

        } catch (error) {
            console.error('Error registrando Service Worker:', error);
            updateStatus('Iniciando proxy...');
            
            // Intentar de todas formas después de un delay
            setTimeout(() => {
                swReady = true;
                updateStatus('✓ Modo directo activo');
                goBtn.disabled = false;
                connectionStatus.style.display = 'none';
            }, 1000);
        }
    } else {
        updateStatus('Navegador no compatible');
        alert('Tu navegador no soporta Service Workers. Usa Chrome, Firefox o Edge moderno.');
    }
}

function updateStatus(text) {
    statusText.textContent = text;
}

// Codificar URL para Ultraviolet
function encodeUrl(url) {
    return encodeURIComponent(url);
}

// Navegar a URL
function navigate(url) {
    if (!url) return;

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
    }

    if (!swReady) {
        alert('Espera un momento mientras se inicializa el proxy...');
        return;
    }

    // Mostrar loading
    homePage.style.display = 'none';
    loadingScreen.style.display = 'flex';
    proxyFrame.style.display = 'none';

    // Generar URL proxeada
    const proxyUrl = `${BACKEND_URL}/service/${encodeUrl(formattedUrl)}`;
    
    // Actualizar historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formattedUrl);
    history = newHistory;
    historyIndex = newHistory.length - 1;

    // Cargar en iframe
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
        proxyFrame.src = `${BACKEND_URL}/service/${encodeUrl(url)}`;
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
        proxyFrame.src = `${BACKEND_URL}/service/${encodeUrl(url)}`;
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
        proxyFrame.src = `${BACKEND_URL}/service/${encodeUrl(url)}`;
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

    // Event listeners
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

    // Event listeners para navegar
    document.querySelectorAll('#favorites-list .sidebar-item-text').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            urlInput.value = url;
            navigate(url);
            favoritesSidebar.classList.remove('active');
        });
    });

    // Event listeners para eliminar
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
    if (e.key === 'Enter' && swReady) {
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
        if (swReady) {
            const url = card.dataset.url;
            urlInput.value = url;
            navigate(url);
        } else {
            alert('Iniciando proxy, espera un momento...');
        }
    });
});

// Iframe load event
proxyFrame.addEventListener('load', () => {
    loadingScreen.style.display = 'none';
    proxyFrame.style.display = 'block';
});

// Manejo de errores del iframe
proxyFrame.addEventListener('error', () => {
    loadingScreen.style.display = 'none';
    alert('Error al cargar el sitio. Verifica que el backend esté funcionando.');
    goHome();
});

// Inicializar
registerServiceWorker();
renderFavorites();
