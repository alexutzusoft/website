const shellEl = document.querySelector(".app-shell");
const headerEl = document.querySelector(".terminal-header");
const outputEl = document.getElementById("output");
const inputEl = document.getElementById("command-input");
const lineTemplate = document.getElementById("line-template");

const state = {
    history: [],
    historyIndex: -1,
    theme: "default",
    currentDir: "/home/guest",
    processes: [
        { pid: 1, name: "systemd", cpu: 0.1, mem: 2.4 },
        { pid: 42, name: "webshell", cpu: 1.2, mem: 15.8 },
        { pid: 128, name: "node", cpu: 0.5, mem: 8.2 },
        { pid: 256, name: "chrome", cpu: 2.1, mem: 124.5 },
    ],
};

// Virtual File System
const vfs = {
    "/": {
        type: "dir",
        children: {
            "home": { type: "dir", children: {
                "guest": { type: "dir", children: {
                    "documents": { type: "dir", children: {
                        "readme.txt": { type: "file", content: "Welcome to the guest terminal!\nThis is a virtual file system." },
                        "portfolio.md": { type: "file", content: "# My Portfolio\n\nBuilding amazing web experiences with AI." }
                    }},
                    "projects": { type: "dir", children: {} },
                    ".bashrc": { type: "file", content: "# Guest shell configuration\nexport PS1='guest λ '" }
                }}
            }},
            "etc": { type: "dir", children: {
                "hosts": { type: "file", content: "127.0.0.1 localhost\n::1 localhost" }
            }},
            "tmp": { type: "dir", children: {} }
        }
    }
};

// Save/load filesystem from localStorage
function saveVFS() {
    try {
        localStorage.setItem('webshell_vfs', JSON.stringify(vfs));
        localStorage.setItem('webshell_currentDir', state.currentDir);
    } catch (e) { /* ignore */ }
}

function loadVFS() {
    try {
        const saved = localStorage.getItem('webshell_vfs');
        const savedDir = localStorage.getItem('webshell_currentDir');
        if (saved) Object.assign(vfs, JSON.parse(saved));
        if (savedDir) state.currentDir = savedDir;
    } catch (e) { /* ignore */ }
}

// Cookie utilities for GitHub sync timing
function setCookie(name, value, hours) {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function shouldAutoSync() {
    const lastSync = getCookie('github_last_sync');
    if (!lastSync) return true; // First time
    
    const lastSyncTime = parseInt(lastSync);
    const now = Date.now();
    const fiveHours = 5 * 60 * 60 * 1000;
    
    return (now - lastSyncTime) >= fiveHours;
}

function markSynced() {
    setCookie('github_last_sync', Date.now().toString(), 6); // 6 hours to be safe
}

const layoutState = {
    isFreeform: false,
    dragging: false,
    resizing: false,
    resizeDirection: '',
    dragOffsetX: 0,
    dragOffsetY: 0,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
    minWidth: 340,
    minHeight: 360,
    maxWidth: null,
    maxHeight: null,
    snapThreshold: 20,
    animationFrame: null,
    lastPointerEvent: null,
    isTouch: false,
    resizeThreshold: 8,
};

const windowManager = {
    boundaries: { top: 0, left: 0, right: 0, bottom: 0 },
    
    updateBoundaries() {
        const margin = 16;
        this.boundaries = {
            top: margin,
            left: margin,
            right: window.innerWidth - margin,
            bottom: window.innerHeight - margin,
        };
    },
    
    constrainPosition(x, y, width, height) {
        const maxLeft = Math.max(this.boundaries.left, this.boundaries.right - width);
        const maxTop = Math.max(this.boundaries.top, this.boundaries.bottom - height);
        
        return {
            x: Math.max(this.boundaries.left, Math.min(x, maxLeft)),
            y: Math.max(this.boundaries.top, Math.min(y, maxTop)),
        };
    },
    
    constrainSize(width, height, x, y) {
        const maxWidth = this.boundaries.right - x;
        const maxHeight = this.boundaries.bottom - y;
        
        return {
            width: Math.max(layoutState.minWidth, Math.min(width, maxWidth)),
            height: Math.max(layoutState.minHeight, Math.min(height, maxHeight)),
        };
    },
    
    snapToEdges(x, y, width, height) {
        const threshold = layoutState.snapThreshold;
        let snappedX = x;
        let snappedY = y;
        
        // Snap to left edge
        if (Math.abs(x - this.boundaries.left) < threshold) {
            snappedX = this.boundaries.left;
        }
        // Snap to right edge
        else if (Math.abs(x + width - this.boundaries.right) < threshold) {
            snappedX = this.boundaries.right - width;
        }
        
        // Snap to top edge
        if (Math.abs(y - this.boundaries.top) < threshold) {
            snappedY = this.boundaries.top;
        }
        // Snap to bottom edge
        else if (Math.abs(y + height - this.boundaries.bottom) < threshold) {
            snappedY = this.boundaries.bottom - height;
        }
        
        return { x: snappedX, y: snappedY };
    },
};

const THEMES = {
    default: {
        scheme: "dark",
        palette: {
            "--terminal-bg": "#0f172a",
            "--terminal-fg": "#d1fae5",
            "--terminal-accent": "#34d399",
            "--terminal-shadow": "rgba(15, 118, 110, 0.28)",
            "--terminal-glass": "rgba(30, 41, 59, 0.8)",
            "--terminal-grid": "rgba(52, 211, 153, 0.04)",
            "--terminal-border": "rgba(52, 211, 153, 0.32)",
            "--terminal-muted": "rgba(148, 163, 184, 0.88)",
        },
    },
    mint: {
        scheme: "light",
        palette: {
            "--terminal-bg": "#f7fff9",
            "--terminal-fg": "#047857",
            "--terminal-accent": "#10b981",
            "--terminal-shadow": "rgba(16, 185, 129, 0.2)",
            "--terminal-glass": "rgba(255, 255, 255, 0.75)",
            "--terminal-grid": "rgba(16, 185, 129, 0.06)",
            "--terminal-border": "rgba(16, 185, 129, 0.32)",
            "--terminal-muted": "rgba(15, 118, 110, 0.48)",
        },
    },
    matrix: {
        scheme: "dark",
        palette: {
            "--terminal-bg": "#0b0f0c",
            "--terminal-fg": "#bfffb3",
            "--terminal-accent": "#22c55e",
            "--terminal-shadow": "rgba(34, 197, 94, 0.28)",
            "--terminal-glass": "rgba(12, 20, 15, 0.84)",
            "--terminal-grid": "rgba(34, 197, 94, 0.08)",
            "--terminal-border": "rgba(34, 197, 94, 0.34)",
            "--terminal-muted": "rgba(226, 232, 240, 0.64)",
        },
    },
    midnight: {
        scheme: "dark",
        palette: {
            "--terminal-bg": "#020617",
            "--terminal-fg": "#eff6ff",
            "--terminal-accent": "#38bdf8",
            "--terminal-shadow": "rgba(56, 189, 248, 0.22)",
            "--terminal-glass": "rgba(15, 23, 42, 0.78)",
            "--terminal-grid": "rgba(56, 189, 248, 0.08)",
            "--terminal-border": "rgba(56, 189, 248, 0.34)",
            "--terminal-muted": "rgba(148, 163, 184, 0.78)",
        },
    },
};

class Soundboard {
    constructor() {
        this.ctx = null;
        this.unlocked = false;
    }

    async unlock() {
        if (this.unlocked) return;
        try {
            if (!this.ctx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContextClass();
            }
            if (this.ctx.state === "suspended") {
                await this.ctx.resume();
            }
            this.unlocked = true;
        } catch (err) {
            console.warn("Audio context init failed", err);
            this.unlocked = false;
        }
    }

    async play(type) {
        await this.unlock();
        if (!this.ctx || this.ctx.state !== "running") return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const profiles = {
            key: { freq: 530, duration: 0.04, decay: 0.018 },
            enter: { freq: 420, duration: 0.12, decay: 0.06 },
            success: { freq: 660, duration: 0.16, decay: 0.08 },
            error: { freq: 210, duration: 0.26, decay: 0.18 },
        };

        const profile = profiles[type] || profiles.key;

        osc.frequency.setValueAtTime(profile.freq, now);
        osc.type = "sine";

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.decay);

        osc.connect(gain).connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + profile.duration);
    }
}

const soundboard = new Soundboard();

function applyTheme(name) {
    const descriptor = THEMES[name];
    if (!descriptor) return false;

    Object.entries(descriptor.palette).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
    });

    if (descriptor.scheme) {
        document.documentElement.style.setProperty("color-scheme", descriptor.scheme);
    }

    state.theme = name;
    return true;
}

function ensureFreeformPosition() {
    if (layoutState.isFreeform) return;
    
    // Get current visual position BEFORE changing any styles
    const rect = shellEl.getBoundingClientRect();
    const visualLeft = rect.left;
    const visualTop = rect.top;
    const visualWidth = rect.width;
    const visualHeight = rect.height;
    
    console.log('Switching to freeform. Current position:', { visualLeft, visualTop, visualWidth, visualHeight });
    
    // Temporarily disable all transitions and animations
    shellEl.style.transition = 'none !important';
    shellEl.style.animation = 'none !important';
    
    // Completely reset all positioning-related properties with !important
    shellEl.style.setProperty('position', 'fixed', 'important');
    shellEl.style.setProperty('top', '0px', 'important');
    shellEl.style.setProperty('left', '0px', 'important');
    shellEl.style.setProperty('right', 'auto', 'important');
    shellEl.style.setProperty('bottom', 'auto', 'important');
    shellEl.style.setProperty('transform', 'none', 'important');
    shellEl.style.setProperty('margin', '0', 'important');
    shellEl.style.setProperty('margin-top', '0', 'important');
    shellEl.style.setProperty('margin-left', '0', 'important');
    shellEl.style.setProperty('margin-right', '0', 'important');
    shellEl.style.setProperty('margin-bottom', '0', 'important');
    
    // Force multiple reflows to ensure all styles are applied
    shellEl.offsetHeight;
    shellEl.offsetWidth;
    
    // Now set the position to match exactly where it was visually with !important
    shellEl.style.setProperty('left', `${visualLeft}px`, 'important');
    shellEl.style.setProperty('top', `${visualTop}px`, 'important');
    shellEl.style.setProperty('width', `${visualWidth}px`, 'important');
    shellEl.style.setProperty('height', `${visualHeight}px`, 'important');
    
    // Force another reflow
    shellEl.offsetHeight;
    
    console.log('Position set to:', shellEl.style.left, shellEl.style.top);
    console.log('Actual position after:', shellEl.getBoundingClientRect());
    
    layoutState.isFreeform = true;
    windowManager.updateBoundaries();
    
    // Re-enable transitions after a short delay
    setTimeout(() => {
        shellEl.style.transition = '';
        shellEl.style.animation = '';
    }, 50);
}

function optimizedStyleUpdate(element, styles) {
    // Batch style updates for better performance
    Object.assign(element.style, styles);
}

function getPointerPosition(event) {
    // Handle both mouse and touch events
    if (event.touches && event.touches.length > 0) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
}

function preventSelection() {
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
}

function restoreSelection() {
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
}

function handleDragPointerDown(event) {
    // Only handle primary button (left click) or touch
    if (event.button && event.button !== 0) return;
    
    // Don't start drag if clicking on traffic light buttons
    if (event.target.closest('.dot')) {
        return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    layoutState.isTouch = event.type.startsWith('touch');
    ensureFreeformPosition();
    
    const pointer = getPointerPosition(event);
    const rect = shellEl.getBoundingClientRect();
    
    layoutState.dragging = true;
    layoutState.dragOffsetX = pointer.x - rect.left;
    layoutState.dragOffsetY = pointer.y - rect.top;
    layoutState.lastPointerEvent = event;
    
    shellEl.classList.add("is-dragging");
    preventSelection();
    
    // Use passive listeners for better performance
    const moveEvent = layoutState.isTouch ? 'touchmove' : 'pointermove';
    const endEvent = layoutState.isTouch ? 'touchend' : 'pointerup';
    
    window.addEventListener(moveEvent, handleDragPointerMove, { passive: false });
    window.addEventListener(endEvent, handlePointerUp, { once: true });
    window.addEventListener('pointercancel', handlePointerUp, { once: true });
    
    // Set capture for reliable event handling
    if (!layoutState.isTouch && shellEl.setPointerCapture) {
        shellEl.setPointerCapture(event.pointerId);
    }
}

function handleDragPointerMove(event) {
    if (!layoutState.dragging) return;
    
    event.preventDefault();
    layoutState.lastPointerEvent = event;
    
    if (layoutState.animationFrame) {
        cancelAnimationFrame(layoutState.animationFrame);
    }
    
    layoutState.animationFrame = requestAnimationFrame(() => {
        const pointer = getPointerPosition(event);
        const rect = shellEl.getBoundingClientRect();
        
        const rawX = pointer.x - layoutState.dragOffsetX;
        const rawY = pointer.y - layoutState.dragOffsetY;
        
        // Apply constraints
        const constrained = windowManager.constrainPosition(rawX, rawY, rect.width, rect.height);
        
        // Apply snapping
        const snapped = windowManager.snapToEdges(constrained.x, constrained.y, rect.width, rect.height);
        
        optimizedStyleUpdate(shellEl, {
            left: `${snapped.x}px`,
            top: `${snapped.y}px`,
        });
        
        layoutState.animationFrame = null;
    });
}

function getResizeDirection(event, rect) {
    const pointer = getPointerPosition(event);
    const x = pointer.x - rect.left;
    const y = pointer.y - rect.top;
    const threshold = layoutState.resizeThreshold;
    
    const nearTop = y <= threshold;
    const nearBottom = y >= rect.height - threshold;
    const nearLeft = x <= threshold;
    const nearRight = x >= rect.width - threshold;
    
    if (nearTop && nearLeft) return 'nw';
    if (nearTop && nearRight) return 'ne';
    if (nearBottom && nearLeft) return 'sw';
    if (nearBottom && nearRight) return 'se';
    if (nearTop) return 'n';
    if (nearBottom) return 's';
    if (nearLeft) return 'w';
    if (nearRight) return 'e';
    
    return '';
}

function updateResizeCursor(event) {
    if (layoutState.dragging || layoutState.resizing) return;
    
    const rect = shellEl.getBoundingClientRect();
    const direction = getResizeDirection(event, rect);
    
    shellEl.className = shellEl.className.replace(/cursor-[a-z]+-resize/g, '');
    
    if (direction) {
        shellEl.classList.add(`cursor-${direction}-resize`);
    }
}

function handleShellPointerMove(event) {
    updateResizeCursor(event);
}

function handleResizePointerDown(event, direction) {
    if (event.button && event.button !== 0) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    layoutState.isTouch = event.type.startsWith('touch');
    ensureFreeformPosition();
    
    const pointer = getPointerPosition(event);
    const rect = shellEl.getBoundingClientRect();
    
    layoutState.resizing = true;
    layoutState.resizeDirection = direction;
    layoutState.startX = pointer.x;
    layoutState.startY = pointer.y;
    layoutState.startWidth = rect.width;
    layoutState.startHeight = rect.height;
    layoutState.startLeft = rect.left;
    layoutState.startTop = rect.top;
    layoutState.lastPointerEvent = event;
    
    shellEl.classList.add("is-resizing");
    preventSelection();
    
    const moveEvent = layoutState.isTouch ? 'touchmove' : 'pointermove';
    const endEvent = layoutState.isTouch ? 'touchend' : 'pointerup';
    
    window.addEventListener(moveEvent, handleResizePointerMove, { passive: false });
    window.addEventListener(endEvent, handlePointerUp, { once: true });
    window.addEventListener('pointercancel', handlePointerUp, { once: true });
    
    if (!layoutState.isTouch && shellEl.setPointerCapture) {
        shellEl.setPointerCapture(event.pointerId);
    }
}

function handleResizePointerMove(event) {
    if (!layoutState.resizing) return;
    
    event.preventDefault();
    layoutState.lastPointerEvent = event;
    
    if (layoutState.animationFrame) {
        cancelAnimationFrame(layoutState.animationFrame);
    }
    
    layoutState.animationFrame = requestAnimationFrame(() => {
        const pointer = getPointerPosition(event);
        const deltaX = pointer.x - layoutState.startX;
        const deltaY = pointer.y - layoutState.startY;
        const direction = layoutState.resizeDirection;
        
        let newWidth = layoutState.startWidth;
        let newHeight = layoutState.startHeight;
        let newLeft = layoutState.startLeft;
        let newTop = layoutState.startTop;
        
        // Handle horizontal resizing
        if (direction.includes('e')) {
            newWidth = layoutState.startWidth + deltaX;
        } else if (direction.includes('w')) {
            newWidth = layoutState.startWidth - deltaX;
            newLeft = layoutState.startLeft + deltaX;
        }
        
        // Handle vertical resizing
        if (direction.includes('s')) {
            newHeight = layoutState.startHeight + deltaY;
        } else if (direction.includes('n')) {
            newHeight = layoutState.startHeight - deltaY;
            newTop = layoutState.startTop + deltaY;
        }
        
        // Apply constraints
        if (newWidth < layoutState.minWidth) {
            if (direction.includes('w')) {
                newLeft = layoutState.startLeft + (layoutState.startWidth - layoutState.minWidth);
            }
            newWidth = layoutState.minWidth;
        }
        
        if (newHeight < layoutState.minHeight) {
            if (direction.includes('n')) {
                newTop = layoutState.startTop + (layoutState.startHeight - layoutState.minHeight);
            }
            newHeight = layoutState.minHeight;
        }
        
        // Apply boundary constraints
        const constrained = windowManager.constrainPosition(newLeft, newTop, newWidth, newHeight);
        const constrainedSize = windowManager.constrainSize(newWidth, newHeight, constrained.x, constrained.y);
        
        optimizedStyleUpdate(shellEl, {
            left: `${constrained.x}px`,
            top: `${constrained.y}px`,
            width: `${constrainedSize.width}px`,
            height: `${constrainedSize.height}px`,
        });
        
        layoutState.animationFrame = null;
    });
}

function handlePointerUp(event) {
    const wasDragging = layoutState.dragging;
    const wasResizing = layoutState.resizing;
    
    if (layoutState.animationFrame) {
        cancelAnimationFrame(layoutState.animationFrame);
        layoutState.animationFrame = null;
    }
    
    layoutState.dragging = false;
    layoutState.resizing = false;
    layoutState.lastPointerEvent = null;
    
    shellEl.classList.remove("is-dragging", "is-resizing");
    restoreSelection();
    
    // Clean up all possible event listeners
    const events = ['pointermove', 'pointerup', 'pointercancel', 'touchmove', 'touchend'];
    events.forEach(eventType => {
        window.removeEventListener(eventType, handleDragPointerMove);
        window.removeEventListener(eventType, handleResizePointerMove);
        window.removeEventListener(eventType, handlePointerUp);
    });
    
    // Release pointer capture
    if (event && event.pointerId && shellEl.releasePointerCapture) {
        try { shellEl.releasePointerCapture(event.pointerId); } catch (e) {}
    }
    
    // Clear resize cursor
    if (wasResizing) {
        shellEl.className = shellEl.className.replace(/cursor-[a-z]+-resize/g, '');
        layoutState.resizeDirection = '';
    }
    
    // Ensure terminal input focus is restored
    if (wasDragging || wasResizing) {
        setTimeout(() => {
            if (inputEl && typeof inputEl.focus === 'function') {
                inputEl.focus();
            }
        }, 50);
    }
}

function handleViewportResize() {
    windowManager.updateBoundaries();
    
    if (!layoutState.isFreeform) return;
    
    const rect = shellEl.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;
    const currentWidth = rect.width;
    const currentHeight = rect.height;
    
    // Ensure window stays within new viewport boundaries
    const constrained = windowManager.constrainPosition(currentX, currentY, currentWidth, currentHeight);
    const constrainedSize = windowManager.constrainSize(currentWidth, currentHeight, constrained.x, constrained.y);
    
    optimizedStyleUpdate(shellEl, {
        left: `${constrained.x}px`,
        top: `${constrained.y}px`,
        width: `${constrainedSize.width}px`,
        height: `${constrainedSize.height}px`,
    });
}

// Debounced resize handler for better performance
let resizeTimeout;
function debouncedViewportResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleViewportResize, 100);
}

function appendCommandLine(commandText) {
    const lineFragment = lineTemplate.content.cloneNode(true);
    const commandEl = lineFragment.querySelector(".command");
    commandEl.textContent = commandText;
    outputEl.appendChild(lineFragment);
    smoothScroll();
}

function appendResponse(content, variant = "response") {
    if (!content) return;
    const block = document.createElement("div");
    block.className = variant === "error" ? "response error" : "response";
    
    // Preserve line breaks and formatting
    block.style.whiteSpace = 'pre-wrap';
    block.textContent = content;
    
    outputEl.appendChild(block);
    block.animate(
        [
            { transform: "translateX(12px)", opacity: 0 },
            { transform: "translateX(0)", opacity: 1 },
        ],
        {
            duration: 240,
            easing: "ease-out",
        }
    );
    smoothScroll();
}

function smoothScroll() {
    requestAnimationFrame(() => {
        outputEl.scrollTo({ 
            top: outputEl.scrollHeight, 
            behavior: "smooth" 
        });
    });
}

function forceScrollToBottom() {
    // Force immediate scroll to bottom
    outputEl.scrollTop = outputEl.scrollHeight;
    requestAnimationFrame(() => {
        outputEl.scrollTop = outputEl.scrollHeight;
    });
}

function updateTerminalTitle() {
    const titleEl = document.querySelector('.terminal-title');
    if (titleEl) {
        // Convert current directory to a shortened version
        let displayPath = state.currentDir;
        if (displayPath.startsWith('/home/guest')) {
            displayPath = displayPath.replace('/home/guest', '~');
        }
        if (displayPath === '') displayPath = '~';
        
        titleEl.textContent = `guest@portfolio:${displayPath}`;
    }
}

function summariseThemes() {
    return Object.keys(THEMES)
        .map((key) => `• ${key}`)
        .join("\n");
}

// File system utilities
function resolvePath(path) {
    if (path === '.') {
        return state.currentDir;
    }
    if (path === '..') {
        const parts = state.currentDir.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/');
    }
    if (!path.startsWith('/')) {
        path = state.currentDir + '/' + path;
    }
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function getNode(path) {
    const resolvedPath = resolvePath(path);
    
    // Handle root directory
    if (resolvedPath === '/') {
        return vfs['/'];
    }
    
    const parts = resolvedPath.split('/').filter(Boolean);
    let current = vfs['/'];
    
    for (const part of parts) {
        if (!current || current.type !== 'dir' || !current.children || !current.children[part]) {
            console.log('Failed to find path part:', part, 'in', current);
            return null;
        }
        current = current.children[part];
    }
    return current;
}

function createNode(path, type, content = '') {
    const fullPath = resolvePath(path);
    const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
    const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
    const parent = getNode(parentPath);
    
    if (!parent || parent.type !== 'dir') return false;
    if (parent.children[name]) return false;
    
    parent.children[name] = type === 'dir' 
        ? { type: 'dir', children: {} }
        : { type: 'file', content };
    saveVFS();
    return true;
}

// GitHub Integration
async function fetchGitHubRepos(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch GitHub repos:', error);
        return [];
    }
}

async function fetchRepoContents(username, repoName, path = '') {
    try {
        const url = `https://api.github.com/repos/${username}/${repoName}/contents${path ? '/' + path : ''}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch contents for ${repoName}:`, error);
        return [];
    }
}

async function populateGitHubProjects(username = 'alexutzusoft', isAutoSync = false) {
    if (isAutoSync) {
        appendResponse(`🔄 Automatically syncing GitHub repositories...`);
    } else {
        appendResponse(`🔄 Fetching your GitHub repositories...`);
    }
    
    const repos = await fetchGitHubRepos(username);
    if (!repos.length) {
        appendResponse(`❌ No repositories found for ${username}`);
        return;
    }

    if (!isAutoSync) {
        appendResponse(`📦 Found ${repos.length} repositories, loading source code...`);
    }
    
    const projectsPath = '/home/guest/projects';
    const projectsNode = getNode(projectsPath);
    
    if (!projectsNode) {
        createNode(projectsPath, 'dir');
    }

    for (const repo of repos.slice(0, 5)) { // Limit to 5 repos to avoid rate limits
        const repoPath = `${projectsPath}/${repo.name}`;
        createNode(repoPath, 'dir');
        
        // Try to fetch the actual README from GitHub
        let readmeContent = null;
        try {
            const readmeResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`);
            console.log(`README response for ${repo.name}:`, readmeResponse.status);
            
            if (readmeResponse.ok) {
                const readmeData = await readmeResponse.json();
                console.log(`README data for ${repo.name}:`, readmeData);
                
                // Decode base64 content properly with UTF-8 support
                const base64Content = readmeData.content.replace(/\s/g, '');
                const binaryString = atob(base64Content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const actualReadmeContent = new TextDecoder('utf-8').decode(bytes);
                
                console.log(`Decoded README for ${repo.name}:`, actualReadmeContent.substring(0, 200) + '...');
                
                readmeContent = `${actualReadmeContent}

---

🌟 Stars: ${repo.stargazers_count} | 🍴 Forks: ${repo.forks_count} | 📅 Updated: ${new Date(repo.updated_at).toLocaleDateString()}
🌐 Language: ${repo.language || 'N/A'} | 🔗 [View on GitHub](${repo.html_url})`;
                
                console.log(`Final README content length for ${repo.name}:`, readmeContent.length);
            } else {
                console.log(`README fetch failed for ${repo.name}: ${readmeResponse.status} ${readmeResponse.statusText}`);
            }
        } catch (error) {
            console.log(`Could not fetch README for ${repo.name}:`, error);
        }
        
        // Fallback to generated README if actual README fetch failed
        if (!readmeContent) {
            readmeContent = `# ${repo.name}

${repo.description || 'No description'}

🌟 Stars: ${repo.stargazers_count}
🍴 Forks: ${repo.forks_count}
📅 Updated: ${new Date(repo.updated_at).toLocaleDateString()}
🌐 Language: ${repo.language || 'N/A'}

🔗 [View on GitHub](${repo.html_url})

---

*This repository was automatically synced from GitHub*`;
        }
        
        createNode(`${repoPath}/README.md`, 'file', readmeContent);

        // Fetch and populate source files
        await populateRepoFiles(username, repo.name, repoPath);
    }
    
    saveVFS();
    markSynced(); // Mark as synced with timestamp
    
    if (isAutoSync) {
        appendResponse(`✅ Automatically synced ${repos.length} repositories to ~/projects/`);
    } else {
        appendResponse(`✅ Successfully loaded ${repos.length} repositories into ~/projects/`);
        appendResponse(`💡 Try: cd projects && ls`);
    }
}

async function populateRepoFiles(username, repoName, basePath, githubPath = '', depth = 0) {
    if (depth > 2) return; // Limit recursion depth
    
    const contents = await fetchRepoContents(username, repoName, githubPath);
    
    for (const item of contents.slice(0, 15)) { // Limit files per directory
        const itemPath = `${basePath}/${item.name}`;
        
        if (item.type === 'dir') {
            createNode(itemPath, 'dir');
            await populateRepoFiles(username, repoName, itemPath, item.path, depth + 1);
        } else if (item.type === 'file' && item.size < 50000) { // Only files under 50KB
            try {
                // Fetch file content
                const fileResponse = await fetch(item.download_url);
                if (fileResponse.ok) {
                    const content = await fileResponse.text();
                    createNode(itemPath, 'file', content);
                }
            } catch (error) {
                // Create placeholder for failed files
                createNode(itemPath, 'file', `# ${item.name}\n\n[File too large or failed to load]\nView at: ${item.html_url}`);
            }
        }
    }
}

const commandContext = {
    applyTheme,
    get state() { return state; },
    get vfs() { return vfs; },
    resolvePath,
    getNode,
    createNode,
    saveVFS,
    populateGitHubProjects,
    shouldAutoSync,
    markSynced,
    async fetchText(url) {
        // Use CORS proxy for external requests
        const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const res = await fetch(proxyUrl, {
                method: "GET",
                signal: controller.signal,
            });
            const data = await res.json();
            return { res: { status: res.status, statusText: res.statusText }, body: data.contents };
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        } finally {
            clearTimeout(timeout);
        }
    },
};

const commands = {
    async help() {
        return [
            {
                content: `🚀 Available commands:

📁 File System:
  • ls [path]       List directory contents
  • cd <path>       Change directory
  • pwd             Show current directory
  • mkdir <name>    Create directory
  • touch <file>    Create empty file
  • cat <file>      Display file contents
  • rm <file>       Remove file/directory
  • tree [path]     Show directory tree

🐙 GitHub Integration:
  • github sync     Sync your repositories to ~/projects/
  • github help     Show GitHub commands

🌐 Network:
  • curl <url>      Fetch URL content
  • wget <url>      Download file
  • ping <host>     Ping a host

🎨 System & Fun:
  • ps              Show running processes
  • whoami          Display current user
  • date            Show current date/time
  • cowsay <text>   ASCII cow says something
  • figlet <text>   Generate ASCII art text
  • matrix          Enter the Matrix

⚙️  Utilities:
  • echo <text>     Print text
  • color <theme>   Change theme
  • clear           Clear screen
  • history         Command history
  • reset           Reset filesystem
  • exit            Close terminal window`
            },
        ];
    },
    async clear(args, ctx) {
        outputEl.innerHTML = "";
        return [{ content: "Screen cleared." }];
    },
    async echo(args) {
        // Join arguments and handle quoted strings
        let content = args.join(" ");
        
        // Remove outer quotes if the entire string is quoted
        if ((content.startsWith('"') && content.endsWith('"')) || 
            (content.startsWith("'") && content.endsWith("'"))) {
            content = content.slice(1, -1);
        }
        
        return [{ content }];
    },
    async color(args, ctx) {
        if (!args.length) {
            return [
                {
                    content: [
                        `Active theme: ${state.theme}`,
                        "Available themes:",
                        summariseThemes(),
                        "Usage: color <name>",
                    ].join("\n"),
                },
            ];
        }

        const themeName = args[0].toLowerCase();
        if (!applyTheme(themeName)) {
            return [
                {
                    type: "error",
                    content: `color: theme \"${themeName}\" not found. Try one of:\n${summariseThemes()}`,
                },
            ];
        }

        return [{ content: `Switched to \"${themeName}\" theme.` }];
    },
    async curl(args, ctx) {
        if (!args.length) {
            return [
                {
                    type: "error",
                    content: "curl: missing URL",
                },
            ];
        }

        let url = args[0];
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        try {
            const { res, body } = await ctx.fetchText(url);
            const truncated = body.length > 1600 ? `${body.slice(0, 1600)}\n…(truncated)…` : body;
            return [
                { content: `Status: ${res.status} ${res.statusText || ""}`.trim() },
                { content: truncated || "\n" },
            ];
        } catch (error) {
            if (error.name === "AbortError") {
                return [
                    {
                        type: "error",
                        content: "curl: request timed out",
                    },
                ];
            }
            return [
                {
                    type: "error",
                    content: `curl: ${error.message || "unexpected error"}`,
                },
            ];
        }
    },
    async history() {
        if (!state.history.length) {
            return [{ content: "history: empty" }];
        }
        return [
            {
                content: state.history
                    .map((entry, index) => `${index + 1}  ${entry}`)
                    .join("\n"),
            },
        ];
    },

    // File System Commands
    async ls(args, ctx) {
        const path = args[0] || '.';
        const resolvedPath = ctx.resolvePath(path);
        const node = ctx.getNode(path);
        
        console.log('ls debug:', { path, resolvedPath, currentDir: state.currentDir, node });
        
        if (!node) {
            return [{ type: "error", content: `ls: cannot access '${path}': No such file or directory` }];
        }
        
        if (node.type === 'file') {
            return [{ content: path.split('/').pop() }];
        }
        
        if (!node.children) {
            return [{ content: 'Directory is empty' }];
        }
        
        const items = Object.entries(node.children)
            .map(([name, item]) => `${item.type === 'dir' ? '📁' : '📄'} ${name}`)
            .sort();
            
        return [{ content: items.length ? items.join('\n') : 'Directory is empty' }];
    },

    async cd(args, ctx) {
        if (!args[0]) {
            state.currentDir = '/home/guest';
            ctx.saveVFS();
            updateTerminalTitle();
            return [{ content: '' }];
        }
        
        const path = args[0];
        const node = ctx.getNode(path);
        
        if (!node || node.type !== 'dir') {
            return [{ type: "error", content: `cd: ${path}: No such file or directory` }];
        }
        
        state.currentDir = ctx.resolvePath(path);
        ctx.saveVFS();
        updateTerminalTitle();
        return [{ content: '' }];
    },

    async pwd() {
        return [{ content: state.currentDir }];
    },

    async mkdir(args, ctx) {
        if (!args[0]) {
            return [{ type: "error", content: "mkdir: missing operand" }];
        }
        
        const success = ctx.createNode(args[0], 'dir');
        return success 
            ? [{ content: `Directory '${args[0]}' created` }]
            : [{ type: "error", content: `mkdir: cannot create directory '${args[0]}': File exists or invalid path` }];
    },

    async touch(args, ctx) {
        if (!args[0]) {
            return [{ type: "error", content: "touch: missing file operand" }];
        }
        
        const success = ctx.createNode(args[0], 'file', '');
        return success 
            ? [{ content: `File '${args[0]}' created` }]
            : [{ type: "error", content: `touch: cannot create file '${args[0]}': File exists or invalid path` }];
    },

    async cat(args, ctx) {
        if (!args[0]) {
            return [{ type: "error", content: "cat: missing file operand" }];
        }
        
        const node = ctx.getNode(args[0]);
        if (!node) {
            return [{ type: "error", content: `cat: ${args[0]}: No such file or directory` }];
        }
        
        if (node.type === 'dir') {
            return [{ type: "error", content: `cat: ${args[0]}: Is a directory` }];
        }
        
        return [{ content: node.content || '(empty file)' }];
    },

    async rm(args, ctx) {
        if (!args[0]) {
            return [{ type: "error", content: "rm: missing operand" }];
        }
        
        const path = ctx.resolvePath(args[0]);
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const name = path.substring(path.lastIndexOf('/') + 1);
        const parent = ctx.getNode(parentPath);
        
        if (!parent || !parent.children[name]) {
            return [{ type: "error", content: `rm: cannot remove '${args[0]}': No such file or directory` }];
        }
        
        delete parent.children[name];
        ctx.saveVFS();
        return [{ content: `Removed '${args[0]}'` }];
    },

    // System Commands
    async whoami() {
        return [{ content: "guest" }];
    },

    async date() {
        return [{ content: new Date().toString() }];
    },

    async ps() {
        const header = "  PID COMMAND         %CPU    %MEM";
        const processes = state.processes
            .map(p => `${p.pid.toString().padStart(5)} ${p.name.padEnd(15)} ${p.cpu.toFixed(1).padStart(5)}   ${p.mem.toFixed(1).padStart(5)}`)
            .join('\n');
        return [{ content: header + '\n' + processes }];
    },

    // Fun Commands
    async cowsay(args) {
        const text = args.join(' ') || 'Hello World!';
        const border = '_'.repeat(text.length + 2);
        return [{
            content: ` ${border} \n< ${text} >\n ${'-'.repeat(text.length + 2)} \n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`
        }];
    },

    async figlet(args) {
        const text = args.join(' ') || 'HELLO';
        // Simple ASCII art generator
        const chars = {
            'A': ['  ██  ', ' ████ ', '██  ██', '██████', '██  ██'],
            'B': ['██████', '██  ██', '██████', '██████', '██████'],
            'C': [' █████', '██    ', '██    ', '██    ', ' █████'],
            'D': ['██████', '██  ██', '██  ██', '██  ██', '██████'],
            'E': ['██████', '██    ', '█████ ', '██    ', '██████'],
            'H': ['██  ██', '██  ██', '██████', '██  ██', '██  ██'],
            'L': ['██    ', '██    ', '██    ', '██    ', '██████'],
            'O': [' █████', '██  ██', '██  ██', '██  ██', ' █████'],
            ' ': ['      ', '      ', '      ', '      ', '      ']
        };
        
        const lines = ['', '', '', '', ''];
        for (const char of text.toUpperCase()) {
            const pattern = chars[char] || chars[' '];
            for (let i = 0; i < 5; i++) {
                lines[i] += pattern[i] + ' ';
            }
        }
        
        return [{ content: lines.join('\n') }];
    },

    async matrix() {
        return [{
            content: `Wake up, Neo...
The Matrix has you...
Follow the white rabbit.

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▓ 01001000 01100101 ▓
    ▓ 01101100 01101100 ▓
    ▓ 01101111 00100000 ▓
    ▓ 01001110 01100101 ▓
    ▓ 01101111 00100001 ▓
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

You are now unplugged. Type 'help' to see the truth.`
        }];
    },

    async ping(args) {
        const host = args[0] || 'localhost';
        const latency = Math.floor(Math.random() * 50 + 10);
        
        return [{
            content: `PING ${host}: 56 bytes of data
64 bytes from ${host}: icmp_seq=1 ttl=64 time=${latency}ms
64 bytes from ${host}: icmp_seq=2 ttl=64 time=${latency + 2}ms
64 bytes from ${host}: icmp_seq=3 ttl=64 time=${latency - 1}ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss`
        }];
    },

    async reset(args, ctx) {
        // Reset filesystem to default
        Object.keys(vfs['/']).forEach(key => delete vfs['/'][key]);
        Object.assign(vfs['/'], {
            type: "dir",
            children: {
                "home": { type: "dir", children: {
                    "guest": { type: "dir", children: {
                        "documents": { type: "dir", children: {
                            "readme.txt": { type: "file", content: "Welcome to the guest terminal!\nThis is a virtual file system." },
                        }},
                        ".bashrc": { type: "file", content: "# Guest shell configuration\nexport PS1='guest λ '" }
                    }}
                }},
                "tmp": { type: "dir", children: {} }
            }
        });
        state.currentDir = "/home/guest";
        ctx.saveVFS();
        return [{ content: "Filesystem reset to default state." }];
    },

    async exit() {
        appendResponse("Closing terminal...");
        forceScrollToBottom();
        
        setTimeout(() => {
            closeTerminal();
        }, 500);
        
        return [{ content: '' }];
    },

    // GitHub Integration Commands
    async github(args, ctx) {
        const subcommand = args[0];
        
        if (!subcommand || subcommand === 'sync') {
            // Clear existing projects folder for fresh sync
            const projectsNode = ctx.getNode('/home/guest/projects');
            if (projectsNode && projectsNode.children) {
                Object.keys(projectsNode.children).forEach(key => {
                    delete projectsNode.children[key];
                });
            }
            
            await ctx.populateGitHubProjects('alexutzusoft', false);
            return [{ content: '' }]; // populateGitHubProjects handles its own output
        }
        
        if (subcommand === 'help') {
            return [{
                content: `GitHub Integration Commands:
  • github sync     Sync your repositories to ~/projects/
  • github help     Show this help`
            }];
        }
        
        return [{ type: "error", content: `github: unknown subcommand '${subcommand}'. Try 'github help'` }];
    },

    async tree(args, ctx) {
        const path = args[0] || '.';
        const node = ctx.getNode(path);
        
        if (!node) {
            return [{ type: "error", content: `tree: ${path}: No such file or directory` }];
        }
        
        if (node.type === 'file') {
            return [{ content: path.split('/').pop() }];
        }
        
        function buildTree(node, prefix = '', isLast = true) {
            let result = '';
            const entries = Object.entries(node.children || {});
            
            for (let i = 0; i < entries.length; i++) {
                const [name, child] = entries[i];
                const isLastEntry = i === entries.length - 1;
                const connector = isLastEntry ? '└── ' : '├── ';
                const icon = child.type === 'dir' ? '📁' : '📄';
                
                result += `${prefix}${connector}${icon} ${name}\n`;
                
                if (child.type === 'dir' && child.children) {
                    const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
                    result += buildTree(child, newPrefix, isLastEntry);
                }
            }
            
            return result;
        }
        
        const tree = buildTree(node);
        return [{ content: tree || 'Directory is empty' }];
    },
};

function normaliseResult(result) {
    if (result == null) return [];
    const list = Array.isArray(result) ? result : [result];
    return list.map((entry) => {
        if (typeof entry === "string") {
            return { content: entry };
        }
        if (entry.type && entry.type === "error") {
            return { content: entry.content, variant: "error" };
        }
        return { content: entry.content ?? "", variant: entry.type === "error" ? "error" : "response" };
    });
}

async function executeInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    appendCommandLine(trimmed);

    state.history.push(trimmed);
    state.historyIndex = state.history.length;
    inputEl.value = "";

    // Check for output redirection
    const redirectMatch = trimmed.match(/^(.+?)\s*>\s*(.+)$/);
    if (redirectMatch) {
        const [, cmdPart, filename] = redirectMatch;
        const [cmd, ...args] = cmdPart.trim().split(/\s+/);
        const command = commands[cmd.toLowerCase()];

        try {
            if (!command) {
                appendResponse(`Command not found: ${cmd}`, "error");
                soundboard.play("error");
                forceScrollToBottom();
                return;
            }

            // Execute command and capture output
            const result = await command(args, commandContext);
            const entries = normaliseResult(result);
            
            // Convert output to string
            let content = entries.map(entry => entry.content).join('\n');
            
            // Handle escape sequences like \n
            content = content.replace(/\\n/g, '\n');
            content = content.replace(/\\t/g, '\t');
            content = content.replace(/\\r/g, '\r');
            
            // Create the file with the content
            const success = createNode(filename.trim(), 'file', content);
            if (success) {
                appendResponse(`Output redirected to ${filename.trim()}`);
                soundboard.play("success");
            } else {
                appendResponse(`Failed to create file: ${filename.trim()}`, "error");
                soundboard.play("error");
            }
            forceScrollToBottom();
            return;
        } catch (error) {
            appendResponse(`Error executing ${cmd}: ${error.message}`, "error");
            soundboard.play("error");
            forceScrollToBottom();
            return;
        }
    }

    // Normal command execution
    const [cmd, ...args] = trimmed.split(/\s+/);
    const command = commands[cmd.toLowerCase()];

    try {
        if (!command) {
            appendResponse(`Command not found: ${cmd}`, "error");
            soundboard.play("error");
            forceScrollToBottom();
            return;
        }

        const result = await command(args, commandContext);
        const entries = normaliseResult(result);
        entries.forEach(({ content, variant }) => appendResponse(content, variant));
        soundboard.play("success");
        forceScrollToBottom();
    } catch (error) {
        appendResponse(`Error executing ${cmd}: ${error.message}`, "error");
        soundboard.play("error");
        forceScrollToBottom();
    }
}

function handleHistoryNavigation(event) {
    if (state.history.length === 0) return;

    if (event.key === "ArrowUp") {
        event.preventDefault();
        state.historyIndex = Math.max(0, state.historyIndex - 1);
        inputEl.value = state.history[state.historyIndex] || "";
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
        inputEl.value = state.history[state.historyIndex] ?? "";
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    }
}

inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        soundboard.play("enter");
        executeInput(inputEl.value);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        handleHistoryNavigation(event);
    } else if (event.key.length === 1) {
        soundboard.play("key");
    }
});

// Enhanced event listeners with proper error handling
if (headerEl) {
    headerEl.addEventListener("pointerdown", handleDragPointerDown, { passive: false });
    headerEl.addEventListener("touchstart", handleDragPointerDown, { passive: false });
    
    // Prevent context menu on long press
    headerEl.addEventListener("contextmenu", (e) => {
        if (layoutState.dragging) e.preventDefault();
    });
}

// Shell-wide resize detection
if (shellEl) {
    shellEl.addEventListener("pointermove", handleShellPointerMove, { passive: true });
    shellEl.addEventListener("pointerleave", () => {
        if (!layoutState.resizing) {
            shellEl.className = shellEl.className.replace(/cursor-[a-z]+-resize/g, '');
        }
    });
    
    shellEl.addEventListener("pointerdown", (event) => {
        const rect = shellEl.getBoundingClientRect();
        const direction = getResizeDirection(event, rect);
        
        if (direction) {
            handleResizePointerDown(event, direction);
        }
    }, { passive: false });
    
    shellEl.addEventListener("contextmenu", (e) => {
        if (layoutState.resizing) e.preventDefault();
    });
}

// Viewport resize handling
window.addEventListener("resize", debouncedViewportResize, { passive: true });
window.addEventListener("orientationchange", debouncedViewportResize, { passive: true });

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
    if (document.hidden && (layoutState.dragging || layoutState.resizing)) {
        handlePointerUp();
    }
});

// Emergency cleanup on page unload
window.addEventListener("beforeunload", () => {
    if (layoutState.animationFrame) {
        cancelAnimationFrame(layoutState.animationFrame);
    }
});

// Keyboard shortcuts for window management
document.addEventListener("keydown", (event) => {
    if (!layoutState.isFreeform) return;
    
    // Alt + Arrow keys for precise positioning
    if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const step = 10;
        const rect = shellEl.getBoundingClientRect();
        let newX = rect.left;
        let newY = rect.top;
        
        switch (event.code) {
            case "ArrowLeft":
                newX = Math.max(windowManager.boundaries.left, rect.left - step);
                break;
            case "ArrowRight":
                newX = Math.min(windowManager.boundaries.right - rect.width, rect.left + step);
                break;
            case "ArrowUp":
                newY = Math.max(windowManager.boundaries.top, rect.top - step);
                break;
            case "ArrowDown":
                newY = Math.min(windowManager.boundaries.bottom - rect.height, rect.top + step);
                break;
            default:
                return;
        }
        
        event.preventDefault();
        optimizedStyleUpdate(shellEl, {
            left: `${newX}px`,
            top: `${newY}px`,
        });
    }
    
    // Escape key to reset position
    if (event.key === "Escape" && layoutState.isFreeform) {
        event.preventDefault();
        resetToCenter();
    }
});

// Function to reset terminal to center
function resetToCenter() {
    if (!layoutState.isFreeform) return;
    
    windowManager.updateBoundaries();
    const centerX = (windowManager.boundaries.right - windowManager.boundaries.left) / 2 - shellEl.offsetWidth / 2;
    const centerY = (windowManager.boundaries.bottom - windowManager.boundaries.top) / 2 - shellEl.offsetHeight / 2;
    
    shellEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    optimizedStyleUpdate(shellEl, {
        left: `${centerX}px`,
        top: `${centerY}px`,
    });
    
    setTimeout(() => {
        shellEl.style.transition = "";
    }, 300);
}

// Terminal Boot Sequence
let hasBooted = false;

async function runTerminalBoot() {
    // Only run boot sequence once
    if (hasBooted) {
        // Just ensure input is visible and focused
        const inputLine = document.querySelector('.input-line');
        if (inputLine) {
            inputLine.style.opacity = '1';
        }
        inputEl.focus();
        return;
    }
    
    hasBooted = true;
    
    // Clear any existing boot messages first
    const existingBootMessages = document.querySelectorAll('.boot-message, .boot-ascii');
    existingBootMessages.forEach(el => el.remove());
    
    // Hide input initially
    const inputLine = document.querySelector('.input-line');
    inputLine.style.opacity = '0';
    
    // Boot messages
    const bootMessages = [
        "[    0.000000] AlexutzuSoft Terminal OS v2.0.1",
        "[    0.142857] Initializing system modules...",
        "[    0.285714] Loading filesystem drivers... OK",
        "[    0.428571] Mounting virtual filesystem at /home/guest... OK", 
        "[    0.571428] Connecting to GitHub API... OK",
        "[    0.714285] Starting web shell daemon... OK",
        "[    0.857142] Loading user profile... OK",
        "[    1.000000] System ready. Welcome to AlexutzuSoft Portfolio Terminal!",
        ""
    ];
    
    for (let i = 0; i < bootMessages.length; i++) {
        const msg = bootMessages[i];
        if (msg) {
            const msgElement = document.createElement('div');
            msgElement.className = 'boot-message';
            msgElement.textContent = msg;
            msgElement.style.animationDelay = `${i * 0.2}s`;
            outputEl.appendChild(msgElement);
        }
        await delay(200);
    }
    
    // Wait for the last animation to complete (animation duration + delay)
    // Last message has delay of (bootMessages.length-2) * 0.2s + 0.4s animation duration
    const totalAnimationTime = (bootMessages.length - 2) * 200 + 400;
    await delay(totalAnimationTime + 200); // Extra 0.2s after "System ready" completes
    
    // Show input with fade
    inputLine.style.transition = 'opacity 0.5s ease';
    inputLine.style.opacity = '1';
    
    // Initialize terminal after input is shown
    await initializeTerminal();
}

async function initializeTerminal() {
    loadVFS();
    inputEl.focus();
    applyTheme(state.theme);
    updateTerminalTitle();
    
    // Auto-sync logic based on time and folder state
    const projectsNode = getNode('/home/guest/projects');
    const isProjectsEmpty = !projectsNode || Object.keys(projectsNode.children).length === 0;
    const shouldSync = shouldAutoSync();
    
    if (isProjectsEmpty || shouldSync) {
        // Clear existing projects if doing a refresh sync
        if (!isProjectsEmpty && shouldSync) {
            Object.keys(projectsNode.children).forEach(key => {
                delete projectsNode.children[key];
            });
        }
        
        await populateGitHubProjects('alexutzusoft', true);
    } else {
        appendResponse("💡 Type 'github sync' to refresh your repositories or 'help' to see all commands.");
    }
    
    forceScrollToBottom();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Terminal Window Management
let isMinimized = false;
let isMaximized = false;
let isAnimatingWindow = false;
let lastHeightBeforeMinimize = null;

function minimizeTerminal() {
    if (isAnimatingWindow) return;
    
    // Prevent any stray boot messages during window operations
    const bootMessages = document.querySelectorAll('.boot-message, .boot-ascii');
    bootMessages.forEach(el => el.remove());

    const headerHeight = headerEl.getBoundingClientRect().height;
    const rect = shellEl.getBoundingClientRect();
    const currentHeight = rect.height;
    const currentCenterY = rect.top + rect.height / 2; // equals computed 'top' after translate(-50%, -50%)

    // Begin animation
    isAnimatingWindow = true;
    shellEl.classList.add('animating');

    if (!isMinimized) {
        // Store height to restore later
        lastHeightBeforeMinimize = currentHeight;

        // Set explicit current height, then transition to header height
        shellEl.style.height = currentHeight + 'px';
        // Force reflow
        void shellEl.offsetHeight;

        const targetHeight = Math.max(48, Math.round(headerHeight));
        // Adjust 'top' so the header stays at the same Y while height changes
        const newTop = currentCenterY + (targetHeight - currentHeight) / 2;
        shellEl.style.top = newTop + 'px';

        shellEl.classList.add('minimized');
        shellEl.style.height = targetHeight + 'px';

        const onEnd = (e) => {
            if (e.target !== shellEl || e.propertyName !== 'height') return;
            shellEl.removeEventListener('transitionend', onEnd);
            shellEl.classList.remove('animating');
            // Clear inline height to allow responsive layout
            shellEl.style.height = '';
            // Keep the adjusted top so header stays anchored
            isAnimatingWindow = false;
            isMinimized = true;
        };
        shellEl.addEventListener('transitionend', onEnd);
    } else {
        // Restore from minimized
        const targetHeight = lastHeightBeforeMinimize || 520;
        // Start from header height
        const startHeight = Math.max(48, Math.round(headerHeight));
        shellEl.style.height = startHeight + 'px';
        // Force reflow
        void shellEl.offsetHeight;

        shellEl.classList.remove('minimized');
        // Adjust 'top' so the header stays at the same Y while height changes
        const newTop = currentCenterY + (targetHeight - currentHeight) / 2;
        shellEl.style.top = newTop + 'px';
        shellEl.style.height = targetHeight + 'px';

        const onEnd = (e) => {
            if (e.target !== shellEl || e.propertyName !== 'height') return;
            shellEl.removeEventListener('transitionend', onEnd);
            shellEl.classList.remove('animating');
            shellEl.style.height = '';
            isAnimatingWindow = false;
            isMinimized = false;
            
            // Ensure input is visible after restore
            const inputLine = document.querySelector('.input-line');
            if (inputLine) {
                inputLine.style.opacity = '1';
            }
        };
        shellEl.addEventListener('transitionend', onEnd);
    }
}

function maximizeTerminal() {
    // Prevent any stray boot messages during window operations
    const bootMessages = document.querySelectorAll('.boot-message, .boot-ascii');
    bootMessages.forEach(el => el.remove());
    
    if (isMaximized) {
        // Restore
        shellEl.classList.remove('maximized');
        isMaximized = false;
    } else {
        // Maximize
        shellEl.classList.add('maximized');
        isMaximized = true;
    }
}

function closeTerminal() {
    shellEl.classList.add('closing');
    
    setTimeout(() => {
        // Try different methods to close the window/tab
        try {
            window.close();
        } catch (e) {
            // If window.close() fails, try alternative methods
            try {
                window.open('', '_self').close();
            } catch (e2) {
                // Last resort - navigate away
                window.location.href = 'about:blank';
            }
        }
    }, 300);
}

window.addEventListener("click", () => {
    if (inputEl && inputEl.focus) inputEl.focus();
});

let isInitialized = false;

window.addEventListener("load", async () => {
    if (isInitialized) return;
    isInitialized = true;
    
    // Add traffic light event listeners
    const closeBtn = document.querySelector('.dot-close');
    const minBtn = document.querySelector('.dot-min');
    const maxBtn = document.querySelector('.dot-max');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTerminal();
        });
    }
    
    if (minBtn) {
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            minimizeTerminal();
        });
    }
    
    if (maxBtn) {
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            maximizeTerminal();
        });
    }
    
    await runTerminalBoot();
});
