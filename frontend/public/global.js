
// Fonction pour injecter le header e-novateurs
function injectEnovateursHeader() {
    const header = document.createElement('div');
    header.className = 'enovateurs-header';
    header.innerHTML = `
        <div class="enovateurs-logo-container">
            <img src="https://les-enovateurs.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fles-enovateurs-logo.a99c9528.webp&w=640&q=75" 
                 alt="Les e-novateurs" 
                 class="enovateurs-logo"
                 onerror="this.style.display='none'">
            <h2 class="enovateurs-text">Une initiative des e-novateurs</h2>
        </div>
    `;

    // Insérer en haut du body
    document.body.insertBefore(header, document.body.firstChild);
}

// Fonction pour injecter le footer e-novateurs
function injectEnovateursFooter() {
    const footer = document.createElement('div');
    footer.className = 'enovateurs-footer';
    footer.innerHTML = `
        <div class="enovateurs-footer-content">
            <img src="https://les-enovateurs.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fles-enovateurs-logo.a99c9528.webp&w=640&q=75" 
                 alt="Les e-novateurs" 
                 class="enovateurs-footer-logo"
                 onerror="this.style.display='none'">
            <div class="enovateurs-footer-links">
                <div class="enovateurs-footer-text">
                    © ${new Date().getFullYear()} Les e-novateurs - Projet "The Lasting Phone"
                </div>
                <div class="enovateurs-footer-text">
                    <a href="https://les-enovateurs.com/politique-de-confidentialite" target="_blank">
                        Politique de confidentialité
                    </a> | 
                    <a href="https://les-enovateurs.com" target="_blank">
                        Découvrir les e-novateurs
                    </a>
                </div>
            </div>
        </div>
    `;

    // Insérer en bas du body
    document.body.appendChild(footer);
}

// Fonction principale pour initialiser les éléments e-novateurs
function initEnovateurs() {
    // Vérifier que les éléments ne sont pas déjà présents
    if (!document.querySelector('.enovateurs-header')) {
        injectEnovateursHeader();
    }

    if (!document.querySelector('.enovateurs-footer')) {
        injectEnovateursFooter();
    }
}

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initEnovateurs);

// Pour les cas où le script est chargé après le DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnovateurs);
} else {
    initEnovateurs();
}