// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Navigation and UI elements
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    const themeToggle = document.getElementById('theme-toggle');
    const scrollTopBtn = document.getElementById('scroll-top');
    const navItems = document.querySelectorAll('.nav-links a');
    const discordBtn = document.getElementById('discord-btn');
    
    // Initialize page
    initTheme();
    fetchGithubRepos();
    initScrollReveal();
    initDiscordPopup();

    // Mobile Navigation Toggle
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Close mobile nav when clicking a link
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            
            // Remove active class from all links
            navItems.forEach(link => link.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
        });
    });

    // Theme Toggle Functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Scroll to Top Button
    window.addEventListener('scroll', handleScroll);
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Set active nav item based on scroll position
    window.addEventListener('scroll', setActiveNavItem);
});

// Discord popup functionality
function initDiscordPopup() {
    const discordBtn = document.getElementById('discord-btn');
    
    if (discordBtn) {
        // Use event delegation to handle clicks on the button and all its children
        discordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showDiscordPopup();
        });
    }
}

function showDiscordPopup() {
    // Remove any existing popup
    const existingPopup = document.querySelector('.discord-popup.visible');
    if (existingPopup) {
        existingPopup.classList.remove('visible');
        return;
    }
    
    const popup = document.querySelector('.discord-popup');
    if (!popup) return;
    
    // Add close functionality
    const closeButton = popup.querySelector('.discord-popup-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            popup.classList.remove('visible');
        });
    }
    
    // Add copy functionality
    const copyButton = popup.querySelector('.discord-popup-copy');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText('@alexutzusoft_').then(() => {
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            });
        });
    }
    
    // Close popup when clicking outside
    document.addEventListener('click', function closePopupOutside(e) {
        if (popup.classList.contains('visible') && 
            !popup.contains(e.target) && 
            e.target.id !== 'discord-btn' && 
            !e.target.closest('#discord-btn')) {
            popup.classList.remove('visible');
            document.removeEventListener('click', closePopupOutside);
        }
    });
    
    // Show the popup
    popup.classList.add('visible');
}

// Initialize Theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('theme-toggle').innerText = '🌙';
    }
}

// Toggle Theme Function
function toggleTheme() {
    const themeIcon = document.getElementById('theme-toggle');
    
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        themeIcon.innerText = '🌙';
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        themeIcon.innerText = '☀️';
    }
}

// Handle Scroll - Show/Hide Scroll Button
function handleScroll() {
    const scrollTopBtn = document.getElementById('scroll-top');
    const scrollPosition = window.scrollY;
    
    if (scrollPosition > 300) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
}

// Set Active Nav Item based on scroll position
function setActiveNavItem() {
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = sectionId;
        }
    });
    
    navItems.forEach(navItem => {
        navItem.classList.remove('active');
        if (navItem.getAttribute('href').slice(1) === currentSection) {
            navItem.classList.add('active');
        }
    });
    
    // Handle home section separately (when at the top)
    if (window.scrollY < 100) {
        navItems.forEach(navItem => {
            navItem.classList.remove('active');
            if (navItem.getAttribute('href') === '#home') {
                navItem.classList.add('active');
            }
        });
    }
}

// Fetch GitHub Repositories
function fetchGithubRepos() {
    const username = 'AlexutzuSxft';
    const apiUrl = `https://api.github.com/users/${username}/repos`;
    const projectsGrid = document.getElementById('projects-grid');
    const projectsLoader = document.getElementById('projects-loader');
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error fetching GitHub repositories');
            }
            return response.json();
        })
        .then(async data => {
            // Filter out forks and sort by stars or last updated
            const filteredRepos = data
                .filter(repo => !repo.fork)
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            // Fetch language data for each repository
            const reposWithLanguages = await Promise.all(
                filteredRepos.map(async repo => {
                    const languagesUrl = repo.languages_url;
                    try {
                        const languagesResponse = await fetch(languagesUrl);
                        if (!languagesResponse.ok) {
                            throw new Error(`Error fetching languages for ${repo.name}`);
                        }
                        const languagesData = await languagesResponse.json();
                        
                        // Convert languages object to sorted array of language names
                        let languagesArray = Object.keys(languagesData)
                            .sort((a, b) => languagesData[b] - languagesData[a])
                            .slice(0, 3); // Get top 3 languages
                        
                        // If no languages detected, try to detect based on files
                        if (languagesArray.length === 0) {
                            try {
                                const contentsUrl = `https://api.github.com/repos/${username}/${repo.name}/contents`;
                                const contentsResponse = await fetch(contentsUrl);
                                if (contentsResponse.ok) {
                                    const contents = await contentsResponse.json();
                                    languagesArray = detectLanguagesFromFiles(contents);
                                }
                            } catch (error) {
                                console.error(`Failed to scan contents for ${repo.name}:`, error);
                            }
                        }
                        
                        return {
                            ...repo,
                            topLanguages: languagesArray.length > 0 ? languagesArray : detectDefaultLanguage(repo)
                        };
                    } catch (error) {
                        console.error(`Failed to fetch languages for ${repo.name}:`, error);
                        return {
                            ...repo,
                            topLanguages: detectDefaultLanguage(repo)
                        };
                    }
                })
            );
            
            // Render the repositories with language data
            renderRepos(reposWithLanguages);
        })
        .catch(error => {
            console.error('Error:', error);
            // Remove the explicit error message and just show an empty grid
            projectsGrid.innerHTML = '';
            
            // Update the section description to indicate the error
            const sectionDescription = document.querySelector('#projects .section-description');
            if (sectionDescription) {
                sectionDescription.textContent = "The showcase of my GitHub repositories couldn't load, please try again later.";
            }
        })
        .finally(() => {
            projectsLoader.style.display = 'none';
        });
}

// Helper function to detect languages based on file extensions
function detectLanguagesFromFiles(files, depth = 0, maxDepth = 2, maxFiles = 20) {
    if (depth > maxDepth || !files || !Array.isArray(files) || files.length === 0) {
        return [];
    }
    
    // Track file extensions and their counts
    const extensionCounts = {};
    let processedFiles = 0;
    
    for (const file of files) {
        if (processedFiles >= maxFiles) break;
        
        if (file.type === 'file') {
            processedFiles++;
            const extension = getFileExtension(file.name);
            if (extension) {
                const language = mapExtensionToLanguage(extension);
                extensionCounts[language] = (extensionCounts[language] || 0) + 1;
            }
        } else if (file.type === 'dir' && depth < maxDepth) {
            // Optionally fetch and process directory contents
            // This is commented out to avoid too many API requests
            // Would require additional fetch call to file.url
        }
    }
    
    // Convert to array and sort by count
    return Object.entries(extensionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 3);
}

// Helper function to get file extension
function getFileExtension(filename) {
    if (!filename) return null;
    const parts = filename.split('.');
    if (parts.length <= 1) return null;
    return parts[parts.length - 1].toLowerCase();
}

// Map file extensions to language names
function mapExtensionToLanguage(extension) {
    const extensionMap = {
        // Web
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'jsx': 'React',
        'tsx': 'React',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'SASS',
        'less': 'LESS',
        
        // General programming
        'py': 'Python',
        'java': 'Java',
        'c': 'C',
        'cpp': 'C++',
        'cs': 'C#',
        'go': 'Go',
        'rb': 'Ruby',
        'php': 'PHP',
        'swift': 'Swift',
        'kt': 'Kotlin',
        'rs': 'Rust',
        
        // Data/Config
        'json': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'yml': 'YAML',
        'toml': 'TOML',
        'ini': 'INI',
        'csv': 'CSV',
        
        // Documentation
        'md': 'Markdown',
        'mdx': 'MDX',
        'rst': 'reStructuredText',
        'txt': 'Text',
        'pdf': 'PDF',
        
        // Shell
        'sh': 'Shell',
        'bash': 'Bash',
        'ps1': 'PowerShell',
        'bat': 'Batch',
        
        // Others
        'sql': 'SQL',
        'graphql': 'GraphQL',
        'dockerfile': 'Dockerfile',
    };
    
    return extensionMap[extension] || extension.toUpperCase();
}

// Determine default language based on repository data
function detectDefaultLanguage(repo) {
    if (repo.language) return [repo.language];
    
    // Check if it's primarily a documentation repository
    if (repo.name.toLowerCase().includes('docs') || 
        repo.name.toLowerCase().includes('wiki') || 
        repo.description?.toLowerCase().includes('documentation')) {
        return ['Markdown'];
    }
    
    // Check for common repository types
    if (repo.name.toLowerCase().includes('awesome')) return ['Markdown'];
    if (repo.name.toLowerCase().endsWith('-config')) return ['Config'];
    
    return ['Repository'];
}

// Render repositories to the page
function renderRepos(repos) {
    const projectsGrid = document.getElementById('projects-grid');
    
    // Clear the grid first
    projectsGrid.innerHTML = '';
    
    if (repos.length === 0) {
        projectsGrid.innerHTML = '<div>No repositories found</div>';
        return;
    }
    
    // Add each repo as a card
    repos.forEach((repo, index) => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.style.animationDelay = `${index * 0.1}s`;
        
        const description = repo.description || 'No description provided';
        
        // Format languages as Lang1/Lang2/Lang3
        const languagesDisplay = repo.topLanguages && repo.topLanguages.length > 0 
            ? repo.topLanguages.join('/') 
            : 'Unknown';
        
        // Display 'AlexutzuSoft' instead of 'AlexutzuSxft'
        const displayName = repo.name === 'AlexutzuSxft' ? 'AlexutzuSoft' : repo.name;
        
        projectCard.innerHTML = `
            <div class="project-card-content">
                <h3 class="project-name">${displayName}</h3>
                <p class="project-description">${description}</p>
                <div class="project-meta">
                    <div class="project-language">${languagesDisplay}</div>
                    <div class="project-stars">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                        </svg>
                        ${repo.stargazers_count}
                    </div>
                </div>
                <a href="${repo.html_url}" target="_blank" class="project-link">View Repository</a>
            </div>
        `;
        
        projectsGrid.appendChild(projectCard);
    });
}

// Initialize ScrollReveal animations
function initScrollReveal() {
    // Observe elements with data-animate attribute
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // Elements to animate
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // Add visible class when in viewport
    document.addEventListener('scroll', () => {
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const sectionBottom = section.getBoundingClientRect().bottom;
            const isVisible = sectionTop < window.innerHeight && sectionBottom >= 0;
            
            if (isVisible) {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Trigger initial check
    setTimeout(() => {
        window.dispatchEvent(new Event('scroll'));
    }, 100);
}
