/**
 * Alexutzu's Personal Website - Interactive JavaScript
 * Features: Animated logo, parallax effects, interactive room, skill timeline,
 * code playground, easter egg, ambient soundscapes, and adaptive theming
 */

// Main application object
const AlexutzuApp = {
    // Configuration
    config: {
        easterEggKeyword: 'matrix',
        parallaxSensitivity: 0.5,
        audioEnabled: false,
        currentTheme: 'daytime'
    },

    // Audio management
    audio: {
        tracks: {},
        currentTrack: null,
        enabled: false,

        init() {
            // Initialize audio elements
            this.tracks = {
                hero: document.getElementById('hero-audio'),
                about: document.getElementById('about-audio'),
                skills: document.getElementById('skills-audio'),
                playground: document.getElementById('playground-audio')
            };

            // Set default volume
            Object.values(this.tracks).forEach(track => {
                if (track) {
                    track.volume = 0.3;
                    track.muted = true;
                }
            });
        },

        toggle() {
            this.enabled = !this.enabled;
            const audioToggle = document.getElementById('audio-toggle');
            const audioIcon = document.getElementById('audio-icon');

            if (this.enabled) {
                Object.values(this.tracks).forEach(track => {
                    if (track) track.muted = false;
                });
                audioIcon.innerHTML = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z';
                audioToggle.title = 'Mute Audio';
            } else {
                Object.values(this.tracks).forEach(track => {
                    if (track) track.muted = true;
                });
                audioIcon.innerHTML = 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z';
                audioToggle.title = 'Unmute Audio';
            }
        },

        playForSection(sectionName) {
            // Stop current track
            if (this.currentTrack && !this.currentTrack.paused) {
                this.currentTrack.pause();
                this.currentTrack.currentTime = 0;
            }

            // Play new track if enabled
            if (this.enabled && this.tracks[sectionName]) {
                this.currentTrack = this.tracks[sectionName];
                this.currentTrack.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    },

    // Theme management
    theme: {
        init() {
            this.updateTheme();
            // Update theme every hour
            setInterval(() => this.updateTheme(), 3600000);
        },

        updateTheme() {
            const now = new Date();
            const hour = now.getHours();
            const body = document.body;
            const themeLabel = document.getElementById('theme-label');

            // Evening theme: 18:00 - 06:00
            if (hour >= 18 || hour < 6) {
                body.classList.add('evening-theme');
                themeLabel.textContent = 'Evening Theme';
                AlexutzuApp.config.currentTheme = 'evening';
            } else {
                body.classList.remove('evening-theme');
                themeLabel.textContent = 'Daytime Theme';
                AlexutzuApp.config.currentTheme = 'daytime';
            }
        }
    },

    // Logo animation
    logo: {
        init() {
            setTimeout(() => this.animateLogo(), 1000);
        },

        animateLogo() {
            const dot = document.getElementById('initial-dot');
            const initials = document.getElementById('initials');

            if (!dot || !initials) return;

            // Phase 1: Expand dot
            dot.style.transition = 'all 1s ease';
            dot.setAttribute('r', '50');
            dot.style.opacity = '0.8';

            setTimeout(() => {
                // Phase 2: Fade out dot, show initials
                dot.style.opacity = '0';
                initials.style.transition = 'opacity 1s ease';
                initials.style.opacity = '1';

                // Phase 3: Animate initials drawing
                this.animateInitials();
            }, 1000);
        },

        animateInitials() {
            const paths = document.querySelectorAll('#initials path');
            paths.forEach((path, index) => {
                const length = path.getTotalLength();
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                path.style.animation = `drawPath 1.5s ease forwards ${index * 0.3}s`;
            });

            // Add CSS for path drawing animation
            if (!document.getElementById('path-animation-style')) {
                const style = document.createElement('style');
                style.id = 'path-animation-style';
                style.textContent = `
                    @keyframes drawPath {
                        to { stroke-dashoffset: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    },

    // Parallax effects
    parallax: {
        init() {
            this.bindEvents();
        },

        bindEvents() {
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            window.addEventListener('scroll', () => this.handleScroll());
        },

        handleMouseMove(e) {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const deltaX = (clientX - centerX) * AlexutzuApp.config.parallaxSensitivity;
            const deltaY = (clientY - centerY) * AlexutzuApp.config.parallaxSensitivity;

            const sketches = document.querySelectorAll('.bg-sketch');
            sketches.forEach((sketch, index) => {
                const multiplier = (index + 1) * 0.3;
                sketch.style.transform = `translate(${deltaX * multiplier}px, ${deltaY * multiplier}px)`;
            });
        },

        handleScroll() {
            const scrolled = window.pageYOffset;
            const sketches = document.querySelectorAll('.bg-sketch');
            
            sketches.forEach((sketch, index) => {
                const speed = (index + 1) * 0.2;
                sketch.style.transform += ` translateY(${scrolled * speed}px)`;
            });
        }
    },

    // Interactive room (About section)
    room: {
        init() {
            this.bindObjectEvents();
            this.initAvatar();
        },

        bindObjectEvents() {
            const objects = document.querySelectorAll('.interactive-object');
            const overlays = document.querySelectorAll('.info-overlay');
            const closeButtons = document.querySelectorAll('.close-overlay');

            objects.forEach(object => {
                object.addEventListener('click', (e) => {
                    const infoType = e.currentTarget.dataset.info;
                    this.showInfo(infoType);
                    this.updateAvatarSpeech(infoType);
                });
            });

            closeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.target.closest('.info-overlay').classList.remove('active');
                    this.resetAvatarSpeech();
                });
            });

            // Close overlays when clicking outside
            overlays.forEach(overlay => {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.classList.remove('active');
                        this.resetAvatarSpeech();
                    }
                });
            });
        },

        showInfo(infoType) {
            // Hide all overlays
            document.querySelectorAll('.info-overlay').forEach(overlay => {
                overlay.classList.remove('active');
            });

            // Show target overlay
            const targetOverlay = document.getElementById(`${infoType}-info`);
            if (targetOverlay) {
                targetOverlay.classList.add('active');
            }
        },

        initAvatar() {
            // Random eye movements
            setInterval(() => this.animateEyes(), 3000 + Math.random() * 2000);
            
            // Random speech updates
            setInterval(() => this.randomSpeech(), 10000 + Math.random() * 5000);
        },

        animateEyes() {
            const eyes = document.querySelectorAll('.eye');
            const directions = ['translateX(-2px)', 'translateX(2px)', 'translateX(0)', 'translateY(-1px)'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];

            eyes.forEach(eye => {
                eye.style.transform = randomDirection;
                setTimeout(() => {
                    eye.style.transform = 'translateX(0)';
                }, 500);
            });
        },

        updateAvatarSpeech(infoType) {
            const speechBubble = document.getElementById('avatar-speech');
            const messages = {
                coffee: "Ah, you found my fuel! ☕ Coffee is the engine of innovation!",
                books: "My knowledge arsenal! 📚 Each book is a new superpower.",
                tech: "Behold my battle station! 💻 Where dreams become code.",
                achievements: "The journey so far... 🏆 But this is just the beginning!"
            };

            if (speechBubble && messages[infoType]) {
                speechBubble.innerHTML = `<p>${messages[infoType]}</p>`;
            }
        },

        resetAvatarSpeech() {
            const speechBubble = document.getElementById('avatar-speech');
            if (speechBubble) {
                speechBubble.innerHTML = '<p>Hey there! I\'m Alexutzu. Click around my room to learn more about me!</p>';
            }
        },

        randomSpeech() {
            const randomMessages = [
                "Building the future, one line at a time! 🚀",
                "Innovation never sleeps... but I should! 😴",
                "Python or C#? Why not both? 🐍💎",
                "Currently debugging the matrix... 🔍",
                "CEO life at 14 hits different! 💼"
            ];

            const speechBubble = document.getElementById('avatar-speech');
            if (speechBubble && !document.querySelector('.info-overlay.active')) {
                const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                speechBubble.innerHTML = `<p>${randomMessage}</p>`;

                // Reset after 5 seconds
                setTimeout(() => this.resetAvatarSpeech(), 5000);
            }
        }
    },

    // Skills timeline/game map
    skills: {
        init() {
            this.animateSkillPath();
            this.bindHoverEvents();
        },

        animateSkillPath() {
            const skillPath = document.getElementById('skill-path');
            if (skillPath) {
                const length = skillPath.getTotalLength();
                skillPath.style.strokeDasharray = length;
                skillPath.style.strokeDashoffset = length;

                // Animate path drawing on scroll
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            skillPath.style.animation = 'pathDraw 3s ease forwards';
                            observer.unobserve(entry.target);
                        }
                    });
                });

                observer.observe(skillPath.parentElement);
            }
        },

        bindHoverEvents() {
            const skillLevels = document.querySelectorAll('.skill-level');
            
            skillLevels.forEach(level => {
                level.addEventListener('mouseenter', () => {
                    this.showLootBox(level);
                    this.playLootSound();
                });

                level.addEventListener('mouseleave', () => {
                    this.hideLootBox(level);
                });
            });
        },

        showLootBox(level) {
            const lootBox = level.querySelector('.loot-box');
            const icon = level.querySelector('.level-icon');
            
            if (lootBox) {
                lootBox.style.opacity = '1';
                lootBox.style.visibility = 'visible';
                lootBox.style.transform = 'translateX(-50%) translateY(-10px) scale(1)';
            }

            if (icon) {
                icon.style.transform = 'scale(1.2)';
                icon.style.boxShadow = '0 0 40px var(--shadow-color)';
            }
        },

        hideLootBox(level) {
            const lootBox = level.querySelector('.loot-box');
            const icon = level.querySelector('.level-icon');
            
            if (lootBox) {
                lootBox.style.opacity = '0';
                lootBox.style.visibility = 'hidden';
                lootBox.style.transform = 'translateX(-50%) translateY(20px) scale(0.8)';
            }

            if (icon) {
                icon.style.transform = 'scale(1)';
                icon.style.boxShadow = 'none';
            }
        },

        playLootSound() {
            // Create a simple beep sound using Web Audio API
            if (AlexutzuApp.audio.enabled) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        }
    },

    // Code playground
    playground: {
        init() {
            this.bindEvents();
            this.setupCanvas();
            this.runInitialCode();
        },

        bindEvents() {
            const runButton = document.getElementById('run-code');
            const clearButton = document.getElementById('clear-canvas');
            const codeInput = document.getElementById('code-input');

            if (runButton) {
                runButton.addEventListener('click', () => this.runCode());
            }

            if (clearButton) {
                clearButton.addEventListener('click', () => this.clearCanvas());
            }

            if (codeInput) {
                // Auto-run code on input (debounced)
                let timeout;
                codeInput.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.runCode(), 1000);
                });
            }
        },

        setupCanvas() {
            const canvas = document.getElementById('live-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                
                // Make canvas responsive
                const resizeCanvas = () => {
                    const container = canvas.parentElement;
                    canvas.width = container.clientWidth - 32; // Account for padding
                    canvas.height = 300;
                };

                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);
            }
        },

        runCode() {
            const codeInput = document.getElementById('code-input');
            const output = document.getElementById('code-output');
            const canvas = document.getElementById('live-canvas');

            if (!codeInput || !output || !canvas) return;

            const code = codeInput.value;
            const ctx = canvas.getContext('2d');

            // Clear previous output
            output.innerHTML = '';
            
            // Override console.log to capture output
            const originalLog = console.log;
            const logs = [];
            console.log = (...args) => {
                logs.push(args.join(' '));
                originalLog(...args);
            };

            try {
                // Create a safe execution environment
                const safeCode = this.sanitizeCode(code);
                
                // Execute the code
                const func = new Function('canvas', 'ctx', safeCode);
                func(canvas, ctx);

                // Display any console output
                if (logs.length > 0) {
                    output.innerHTML = `<div class="console-output">${logs.join('<br>')}</div>`;
                }

            } catch (error) {
                output.innerHTML = `<div class="error-output">Error: ${error.message}</div>`;
            } finally {
                // Restore console.log
                console.log = originalLog;
            }
        },

        sanitizeCode(code) {
            // Remove potentially dangerous functions/keywords
            const dangerous = ['eval', 'Function', 'setTimeout', 'setInterval', 'fetch', 'XMLHttpRequest'];
            let sanitized = code;

            dangerous.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                sanitized = sanitized.replace(regex, `/* ${keyword} blocked */`);
            });

            return sanitized;
        },

        clearCanvas() {
            const canvas = document.getElementById('live-canvas');
            const output = document.getElementById('code-output');
            
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            if (output) {
                output.innerHTML = '';
            }
        },

        runInitialCode() {
            // Run the default code after a short delay
            setTimeout(() => this.runCode(), 500);
        }
    },

    // Easter egg functionality
    easterEgg: {
        init() {
            this.bindEvents();
        },

        bindEvents() {
            const input = document.getElementById('easter-egg-input');
            const closeBtn = document.getElementById('close-easter-egg');

            if (input) {
                input.addEventListener('input', (e) => {
                    if (e.target.value.toLowerCase() === AlexutzuApp.config.easterEggKeyword) {
                        this.showEasterEgg();
                        e.target.value = '';
                    }
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideEasterEgg());
            }

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideEasterEgg();
                }
            });
        },

        showEasterEgg() {
            const overlay = document.getElementById('easter-egg-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                this.createMatrixRain();
                this.playMatrixSound();
            }
        },

        hideEasterEgg() {
            const overlay = document.getElementById('easter-egg-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        },

        createMatrixRain() {
            const matrixContainer = document.querySelector('.matrix-rain');
            if (!matrixContainer) return;

            // Clear existing rain
            matrixContainer.innerHTML = '';

            const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            const columns = Math.floor(matrixContainer.offsetWidth / 20);

            for (let i = 0; i < columns; i++) {
                const column = document.createElement('div');
                column.style.position = 'absolute';
                column.style.left = i * 20 + 'px';
                column.style.top = '0';
                column.style.color = 'var(--accent-color)';
                column.style.fontSize = '14px';
                column.style.fontFamily = 'monospace';
                column.style.opacity = Math.random();
                column.style.animation = `matrixFall ${2 + Math.random() * 3}s linear infinite`;

                // Add random characters
                for (let j = 0; j < 20; j++) {
                    const char = characters[Math.floor(Math.random() * characters.length)];
                    column.textContent += char + '\n';
                }

                matrixContainer.appendChild(column);
            }

            // Add CSS for matrix fall animation
            if (!document.getElementById('matrix-animation-style')) {
                const style = document.createElement('style');
                style.id = 'matrix-animation-style';
                style.textContent = `
                    @keyframes matrixFall {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(100vh); }
                    }
                `;
                document.head.appendChild(style);
            }
        },

        playMatrixSound() {
            if (AlexutzuApp.audio.enabled) {
                // Create a digital/matrix-like sound effect
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                for (let i = 0; i < 5; i++) {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(200 + Math.random() * 800, audioContext.currentTime + i * 0.1);
                    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + i * 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.1 + 0.3);
                    
                    oscillator.start(audioContext.currentTime + i * 0.1);
                    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
                }
            }
        }
    },

    // Section visibility detection for audio
    sectionObserver: {
        init() {
            const sections = document.querySelectorAll('section[id]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id;
                        AlexutzuApp.audio.playForSection(sectionId);
                    }
                });
            }, {
                threshold: 0.5
            });

            sections.forEach(section => observer.observe(section));
        }
    },

    // Signature animation
    signature: {
        init() {
            this.animateSignature();
        },

        animateSignature() {
            const signaturePath = document.getElementById('signature-path');
            if (signaturePath) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            signaturePath.style.animation = 'signatureDraw 3s ease forwards';
                            observer.unobserve(entry.target);
                        }
                    });
                });

                observer.observe(signaturePath.parentElement);
            }
        }
    },

    // Main initialization
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    },

    initializeComponents() {
        console.log('🚀 Initializing Alexutzu\'s Interactive Website...');

        // Initialize all components
        this.audio.init();
        this.theme.init();
        this.logo.init();
        this.parallax.init();
        this.room.init();
        this.skills.init();
        this.playground.init();
        this.easterEgg.init();
        this.sectionObserver.init();
        this.signature.init();

        // Bind global events
        this.bindGlobalEvents();

        console.log('✨ Website fully loaded and interactive!');
    },

    bindGlobalEvents() {
        // Audio toggle
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => this.audio.toggle());
        }

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });

        // Handle signature animation on scroll
        this.signature.init();

        // Add loading states
        document.body.classList.add('loaded');
    }
};

// Initialize the application
AlexutzuApp.init();

// Expose to global scope for debugging
window.AlexutzuApp = AlexutzuApp;