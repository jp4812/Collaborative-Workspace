// ==========================================================================
// Nexus Mobile Navigation & Navbar Controller
// Shared across Dashboard, Team Directory, and Analytics pages
// ==========================================================================

(function initMobileNavbar() {
    function setupNav() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileNavDrawer = document.getElementById('mobileNavDrawer');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

        // Retrieve cached user profile
        let user = {};
        try {
            user = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            user = {};
        }

        const isAdmin = user.role === 'Admin';

        // 1. Populate Mobile User Profile
        const mobileUserName = document.getElementById('mobileUserName');
        if (mobileUserName) {
            mobileUserName.textContent = user.name || user.email || 'Corporate User';
        }

        const mobileRoleBadge = document.getElementById('mobileUserRoleBadge');
        if (mobileRoleBadge) {
            mobileRoleBadge.textContent = user.role || 'Member';
            mobileRoleBadge.className = isAdmin ? 'badge badge-purple' : 'badge badge-emerald';
        }

        // 2. Toggle Mobile Admin Links
        const mobileAnalyticsLink = document.getElementById('mobileNavAnalyticsLink');
        if (mobileAnalyticsLink && isAdmin) {
            mobileAnalyticsLink.classList.remove('hidden');
        }

        // 3. Hamburger Toggle Logic
        if (mobileMenuBtn && mobileNavDrawer) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = !mobileNavDrawer.classList.contains('hidden');
                if (isExpanded) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }
            });

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!mobileNavDrawer.classList.contains('hidden') &&
                    !mobileNavDrawer.contains(e.target) &&
                    !mobileMenuBtn.contains(e.target)) {
                    closeMobileMenu();
                }
            });

            // Close on Escape key
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !mobileNavDrawer.classList.contains('hidden')) {
                    closeMobileMenu();
                }
            });

            // Auto-close on resize to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 768 && !mobileNavDrawer.classList.contains('hidden')) {
                    closeMobileMenu();
                }
            });
        }

        function openMobileMenu() {
            mobileNavDrawer.classList.remove('hidden');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-x-lg';
            }
        }

        function closeMobileMenu() {
            mobileNavDrawer.classList.add('hidden');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-list';
            }
        }

        // 4. Mobile Logout Action
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = '/signin.html';
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupNav);
    } else {
        setupNav();
    }
})();
