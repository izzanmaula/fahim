// NAVBARR //
function loadPage(page) {
    if (page === 'home') {
        window.location.href = 'index.html';
    } else if (page === 'quran') {
        window.location.href = 'quran.html';
    } else if (page === 'doa') {
        window.location.href = 'doa.html';
    } else if (page === 'settings') {
        window.location.href = 'settings.html';
    }
    
    // Perbarui status aktif pada navbar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Aktifkan item yang diklik
    event.currentTarget.classList.add('active');
}

// Cek halaman saat ini dan set navbar yang aktif
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => item.classList.remove('active'));
    
    if (currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
        navItems[0].classList.add('active');
    } else if (currentPage.includes('quran.html') || currentPage.includes('surah.html')) {
        navItems[1].classList.add('active');
    } else if (currentPage.includes('doa.html')) {
        navItems[2].classList.add('active');
    } else if (currentPage.includes('settings.html')) {
        navItems[3].classList.add('active');
    }
});

