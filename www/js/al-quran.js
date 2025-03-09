// al-quran.js
const AlQuran = {
    // API URL
    apiUrl: 'https://api.alquran.cloud/v1',
    
    // Get all Surahs
    getAllSurahs: function() {
        return new Promise((resolve, reject) => {
            // Cek apakah data sudah ada di localStorage
            const cachedData = localStorage.getItem('quran_surahs');
            if (cachedData) {
                resolve(JSON.parse(cachedData));
                return;
            }
            
            // Jika tidak ada di cache, ambil dari API
            fetch(`${this.apiUrl}/surah`)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        // Simpan ke localStorage untuk penggunaan offline
                        localStorage.setItem('quran_surahs', JSON.stringify(data.data));
                        resolve(data.data);
                    } else {
                        reject('Failed to fetch surahs');
                    }
                })
                .catch(error => {
                    console.error('Error fetching surahs:', error);
                    reject(error);
                });
        });
    },
    
    // Get specific Surah
    getSurah: function(surahNumber) {
        return new Promise((resolve, reject) => {
            // Cek apakah data sudah ada di localStorage
            const cachedData = localStorage.getItem(`quran_surah_${surahNumber}`);
            if (cachedData) {
                resolve(JSON.parse(cachedData));
                return;
            }
            
            // Jika tidak ada di cache, ambil dari API
            fetch(`${this.apiUrl}/surah/${surahNumber}`)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        // Simpan ke localStorage untuk penggunaan offline
                        localStorage.setItem(`quran_surah_${surahNumber}`, JSON.stringify(data.data));
                        resolve(data.data);
                    } else {
                        reject('Failed to fetch surah');
                    }
                })
                .catch(error => {
                    console.error(`Error fetching surah ${surahNumber}:`, error);
                    reject(error);
                });
        });
    },
    
    // Get Surah with translation
    getSurahWithTranslation: function(surahNumber, language = 'id') {
        return new Promise((resolve, reject) => {
            // Cek apakah data sudah ada di localStorage
            const cacheKey = `quran_surah_${surahNumber}_${language}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                resolve(JSON.parse(cachedData));
                return;
            }
            
            // Jika tidak ada di cache, ambil dari API
            fetch(`${this.apiUrl}/surah/${surahNumber}/${language}`)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        // Simpan ke localStorage untuk penggunaan offline
                        localStorage.setItem(cacheKey, JSON.stringify(data.data));
                        resolve(data.data);
                    } else {
                        reject('Failed to fetch surah with translation');
                    }
                })
                .catch(error => {
                    console.error(`Error fetching surah ${surahNumber} with translation:`, error);
                    reject(error);
                });
        });
    },
    
    // Add to bookmark
    addBookmark: function(surahNumber, ayahNumber) {
        let bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        const bookmark = {
            surah: surahNumber,
            ayah: ayahNumber,
            timestamp: new Date().toISOString()
        };
        
        // Check if already bookmarked
        const existingIndex = bookmarks.findIndex(b => 
            b.surah === surahNumber && b.ayah === ayahNumber);
            
        if (existingIndex === -1) {
            bookmarks.push(bookmark);
            localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
            return true; // Added successfully
        }
        return false; // Already exists
    },
    
    // Remove bookmark
    removeBookmark: function(surahNumber, ayahNumber) {
        let bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        const initialLength = bookmarks.length;
        
        bookmarks = bookmarks.filter(b => 
            !(b.surah === surahNumber && b.ayah === ayahNumber));
            
        localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
        return bookmarks.length < initialLength; // Returns true if something was removed
    },
    
    // Get all bookmarks
    getBookmarks: function() {
        return JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
    },
    
    // Check if ayah is bookmarked
    isBookmarked: function(surahNumber, ayahNumber) {
        const bookmarks = this.getBookmarks();
        return bookmarks.some(b => b.surah === surahNumber && b.ayah === ayahNumber);
    }
};

// Export for use in other files
window.AlQuran = AlQuran;

// Tambahkan ini ke HTML Anda atau di app.js

// Load surah list when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSurahList();
    setupTabButtons();
});

function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-link');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.textContent.trim();
            if (tabName === 'Bookmark') {
                loadBookmarks();
            } else if (tabName === 'Juz') {
                // Load Juz data if needed
            }
        });
    });
}

function loadSurahList() {
    const surahContainer = document.getElementById('Surah');
    surahContainer.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">Loading surahs...</div>';
    
    AlQuran.getAllSurahs()
        .then(surahs => {
            surahContainer.innerHTML = '';
            
            surahs.forEach(surah => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header" style="padding:1rem;">
                        <div class="surah-info">
                            <div class="surah-name">${surah.englishName}</div>
                            <div class="surah-meaning">${surah.englishNameTranslation}</div>
                            <div class="ayat-count">${surah.numberOfAyahs} Ayat</div>
                        </div>
                        <div class="arabic-name">${surah.name}</div>
                    </div>
                `;
                
                // Add click event to navigate to surah detail
                card.addEventListener('click', () => {
                    navigateToSurah(surah.number);
                });
                
                surahContainer.appendChild(card);
            });
        })
        .catch(error => {
            surahContainer.innerHTML = `
                <div class="error" style="padding: 20px; text-align: center; color: #c00;">
                    Error loading surahs. Please check your internet connection.
                </div>
            `;
            console.error('Error loading surahs:', error);
        });
}

function loadBookmarks() {
    const bookmarkContainer = document.getElementById('Bookmark');
    const bookmarks = AlQuran.getBookmarks();
    
    if (bookmarks.length === 0) {
        bookmarkContainer.innerHTML = `
            <div class="card" style="padding: 1rem;">
                <div class="card-content">
                    Anda belum menambahkan ayat favorit.
                </div>
            </div>
        `;
        return;
    }
    
    bookmarkContainer.innerHTML = '';
    const bookmarkPromises = bookmarks.map(bookmark => {
        return AlQuran.getSurah(bookmark.surah)
            .then(surah => {
                return {
                    bookmark,
                    surah,
                    ayah: surah.ayahs[bookmark.ayah - 1]
                };
            });
    });
    
    Promise.all(bookmarkPromises)
        .then(results => {
            results.forEach(result => {
                const { bookmark, surah, ayah } = result;
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header" style="padding:1rem;">
                        <div class="surah-info">
                            <div class="surah-name">${surah.englishName}</div>
                            <div class="ayat-count">Ayat ${bookmark.ayah}</div>
                        </div>
                        <button class="remove-bookmark" data-surah="${bookmark.surah}" data-ayah="${bookmark.ayah}">
                            <img src="img/bookmark-filled.png" alt="Remove Bookmark" style="width: 20px; height: 20px;">
                        </button>
                    </div>
                    <div class="card-content" style="padding: 10px 16px; text-align: right; font-size: 18px;">
                        ${ayah.text}
                    </div>
                `;
                
                card.addEventListener('click', (e) => {
                    // Don't navigate if clicked on the remove button
                    if (!e.target.closest('.remove-bookmark')) {
                        navigateToSurah(bookmark.surah, bookmark.ayah);
                    }
                });
                
                const removeBtn = card.querySelector('.remove-bookmark');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const surah = removeBtn.getAttribute('data-surah');
                        const ayah = removeBtn.getAttribute('data-ayah');
                        AlQuran.removeBookmark(parseInt(surah), parseInt(ayah));
                        loadBookmarks(); // Reload bookmarks
                    });
                }
                
                bookmarkContainer.appendChild(card);
            });
        });
}

function navigateToSurah(surahNumber, ayahNumber = null) {
    // Store the current surah and ayah
    localStorage.setItem('current_surah', surahNumber);
    if (ayahNumber) localStorage.setItem('current_ayah', ayahNumber);
    
    // In Cordova, you might use window.location or a routing system
    window.location.href = 'surah.html';
}

// Tambahkan ke al-quran.js

// Data Juz
AlQuran.juzData = [
    { number: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
    { number: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
    { number: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
    { number: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
    { number: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
    { number: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
    { number: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
    { number: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
    { number: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
    { number: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
    { number: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
    { number: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
    { number: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
    { number: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
    { number: 15, startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
    { number: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
    { number: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
    { number: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
    { number: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
    { number: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
    { number: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
    { number: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
    { number: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
    { number: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
    { number: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
    { number: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
    { number: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
    { number: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
    { number: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
    { number: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 }
];

// Get all Juz information
AlQuran.getAllJuz = function() {
    return this.juzData;
};

// Get specific Juz information
AlQuran.getJuz = function(juzNumber) {
    return this.juzData.find(juz => juz.number === juzNumber);
};

// Get surah names for a specific Juz (untuk tampilan)
AlQuran.getJuzSurahNames = async function(juzNumber) {
    const juz = this.getJuz(juzNumber);
    if (!juz) return null;
    
    try {
        // Get all surahs if not already cached
        const allSurahs = await this.getAllSurahs();
        
        // Create display text
        let result = {
            juzNumber: juz.number,
            startSurah: allSurahs.find(s => s.number === juz.startSurah),
            endSurah: allSurahs.find(s => s.number === juz.endSurah),
            startAyah: juz.startAyah,
            endAyah: juz.endAyah
        };
        
        return result;
    } catch (error) {
        console.error('Error getting Juz surah names:', error);
        return null;
    }
};

// Get all ayahs for a specific Juz
AlQuran.getJuzContent = async function(juzNumber) {
    const juz = this.getJuz(juzNumber);
    if (!juz) return null;
    
    // Check if already cached
    const cacheKey = `quran_juz_${juzNumber}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    
    try {
        const result = {
            juzNumber: juz.number,
            surahs: []
        };
        
        // Loop through each surah in the juz
        for (let surahNum = juz.startSurah; surahNum <= juz.endSurah; surahNum++) {
            const surah = await this.getSurahWithTranslation(surahNum);
            
            // Determine which ayahs to include
            let startAyah = 1;
            let endAyah = surah.numberOfAyahs;
            
            if (surahNum === juz.startSurah) {
                startAyah = juz.startAyah;
            }
            
            if (surahNum === juz.endSurah) {
                endAyah = juz.endAyah;
            }
            
            // Filter the ayahs
            const filteredAyahs = surah.ayahs.filter((ayah, index) => {
                const ayahNumber = index + 1;
                return ayahNumber >= startAyah && ayahNumber <= endAyah;
            });
            
            // Add to result
            result.surahs.push({
                number: surah.number,
                name: surah.name,
                englishName: surah.englishName,
                englishNameTranslation: surah.englishNameTranslation,
                ayahs: filteredAyahs,
                startAyah: startAyah,
                endAyah: endAyah
            });
        }
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify(result));
        
        return result;
    } catch (error) {
        console.error('Error getting Juz content:', error);
        return null;
    }
};

// Tambahkan ke script utama Anda (di HTML atau app.js)

// Load Juz list 
function loadJuzList() {
    const juzContainer = document.getElementById('Juz');
    juzContainer.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">Loading juz data...</div>';
    
    const juzData = AlQuran.getAllJuz();
    
    // Get all surahs first to display names
    AlQuran.getAllSurahs()
        .then(surahs => {
            juzContainer.innerHTML = '';
            
            // Process each juz
            juzData.forEach(juz => {
                const startSurah = surahs.find(s => s.number === juz.startSurah);
                const endSurah = surahs.find(s => s.number === juz.endSurah);
                
                if (!startSurah || !endSurah) return;
                
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div style="padding: 1rem;">
                        <div class="card-header" style="padding:0px;">
                            Juz ${juz.number}
                        </div>
                        <div class="card-content">
                            <div>Dari ${startSurah.englishName} ayat ${juz.startAyah}</div>
                            <div>Sampai ${endSurah.englishName} ayat ${juz.endAyah}</div>
                        </div>
                    </div>
                `;
                
                // Add click event to navigate to juz detail
                card.addEventListener('click', () => {
                    navigateToJuz(juz.number);
                });
                
                juzContainer.appendChild(card);
            });
        })
        .catch(error => {
            juzContainer.innerHTML = `
                <div class="error" style="padding: 20px; text-align: center; color: #c00;">
                    Error loading juz data. Please check your internet connection.
                </div>
            `;
            console.error('Error loading juz data:', error);
        });
}

function navigateToJuz(juzNumber) {
    // Store the current juz
    localStorage.setItem('current_juz', juzNumber);
    
    // Get juz data
    const juz = AlQuran.getJuz(juzNumber);
    
    // Navigate to surah.html with parameters for juz view
    window.location.href = `surah.html?mode=juz&juzNumber=${juzNumber}&surah=${juz.startSurah}&ayah=${juz.startAyah}`;
}

// Tambahkan di script bagian surah.html

document.addEventListener('DOMContentLoaded', function() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'juz') {
        // Juz mode
        const juzNumber = parseInt(urlParams.get('juzNumber'));
        const surahNumber = parseInt(urlParams.get('surah'));
        const ayahNumber = parseInt(urlParams.get('ayah'));
        
        if (juzNumber) {
            loadJuzView(juzNumber, surahNumber, ayahNumber);
        } else {
            window.location.href = 'index.html';
        }
    } else {
        // Regular surah mode
        const surahNumber = localStorage.getItem('current_surah');
        const ayahNumber = localStorage.getItem('current_ayah');
        
        if (surahNumber) {
            loadSurahDetail(surahNumber, ayahNumber);
        } else {
            window.location.href = 'index.html';
        }
    }
});

function loadJuzView(juzNumber, startSurah, startAyah) {
    const surahDetail = document.getElementById('surahDetail');
    document.getElementById('surahTitle').textContent = `Juz ${juzNumber}`;
    
    // Add a "Juz View" indicator
    const juzIndicator = document.createElement('div');
    juzIndicator.className = 'juz-indicator';
    juzIndicator.style.textAlign = 'center';
    juzIndicator.style.padding = '8px';
    juzIndicator.style.backgroundColor = '#f9f9f9';
    juzIndicator.style.borderRadius = '8px';
    juzIndicator.style.margin = '10px 0';
    juzIndicator.textContent = `Juz ${juzNumber}`;
    
    // First, clear the container
    surahDetail.innerHTML = '';
    surahDetail.appendChild(juzIndicator);
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.textContent = 'Loading juz content...';
    surahDetail.appendChild(loadingDiv);
    
    // Get the juz content
    AlQuran.getJuzContent(juzNumber)
        .then(juzContent => {
            // Remove loading indicator
            surahDetail.removeChild(loadingDiv);
            
            if (!juzContent) {
                throw new Error('Failed to load juz content');
            }
            
            // Display each surah in the juz
            juzContent.surahs.forEach(surah => {
                // Add surah header
                const surahHeader = document.createElement('div');
                surahHeader.className = 'surah-header';
                surahHeader.style.backgroundColor = '#f9f9f9';
                surahHeader.style.padding = '10px 15px';
                surahHeader.style.fontWeight = 'bold';
                surahHeader.style.borderBottom = '1px solid #e0e0e0';
                surahHeader.style.marginTop = '15px';
                surahHeader.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>${surah.englishName} (${surah.englishNameTranslation})</div>
                        <div style="font-family: 'ScheherazadeNew', serif;">${surah.name}</div>
                    </div>
                `;
                surahDetail.appendChild(surahHeader);
                
                // Display Bismillah if not Surah At-Tawbah and it's the first ayah of the surah
                if (surah.number !== 9 && surah.startAyah === 1) {
                    const bismillah = document.createElement('div');
                    bismillah.className = 'bismillah';
                    bismillah.style.textAlign = 'center';
                    bismillah.style.padding = '20px';
                    bismillah.style.fontSize = '24px';
                    bismillah.style.fontFamily = "'ScheherazadeNew', serif";
                    bismillah.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
                    surahDetail.appendChild(bismillah);
                }
                
                // Display ayahs
                surah.ayahs.forEach((ayah, index) => {
                    const ayahNumber = surah.startAyah + index;
                    const isBookmarked = AlQuran.isBookmarked(surah.number, ayahNumber);
                    
                    const ayahDiv = document.createElement('div');
                    ayahDiv.className = 'ayah';
                    ayahDiv.id = `surah-${surah.number}-ayah-${ayahNumber}`;
                    ayahDiv.style.padding = '15px';
                    ayahDiv.style.borderBottom = '1px solid #e0e0e0';
                    ayahDiv.innerHTML = `
                        <div class="ayah-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center;">
                                <span class="surah-badge" style="font-size: 12px; background-color: #e7f8f3; color: #00a884; padding: 2px 6px; border-radius: 4px; margin-right: 8px;">
                                    ${surah.englishName}
                                </span>
                                <span class="ayah-number" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background-color: #00a884; color: white; font-weight: bold;">
                                    ${ayahNumber}
                                </span>
                            </div>
                            <button class="bookmark-btn" data-surah="${surah.number}" data-ayah="${ayahNumber}" style="background: none; border: none; cursor: pointer;">
                                <img src="img/${isBookmarked ? 'bookmark-filled.png' : 'bookmark.png'}" 
                                     alt="Bookmark" style="width: 20px; height: 20px;">
                            </button>
                        </div>
                        <div class="arabic-text" style="text-align: right; font-size: 24px; margin-bottom: 10px; line-height: 1.8; font-family: 'ScheherazadeNew', serif;">
                            ${ayah.text}
                        </div>
                        <div class="translation" style="font-size: 14px; color: #666; line-height: 1.5;">
                            ${ayah.translation || ''}
                        </div>
                    `;
                    
                    // Add bookmark functionality
                    surahDetail.appendChild(ayahDiv);
                });
            });
            
            // Add event listeners for bookmark buttons
            const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
            bookmarkBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const surahNum = parseInt(this.getAttribute('data-surah'));
                    const ayahNum = parseInt(this.getAttribute('data-ayah'));
                    const imgElement = this.querySelector('img');
                    
                    if (AlQuran.isBookmarked(surahNum, ayahNum)) {
                        AlQuran.removeBookmark(surahNum, ayahNum);
                        imgElement.src = 'img/bookmark.png';
                    } else {
                        AlQuran.addBookmark(surahNum, ayahNum);
                        imgElement.src = 'img/bookmark-filled.png';
                    }
                });
            });
            
            // Scroll to specific ayah if provided (for the first surah)
            if (startSurah && startAyah) {
                const targetElement = document.getElementById(`surah-${startSurah}-ayah-${startAyah}`);
                if (targetElement) {
                    setTimeout(() => {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        targetElement.style.backgroundColor = '#f0f9f6';
                        setTimeout(() => {
                            targetElement.style.backgroundColor = '';
                        }, 2000);
                    }, 100);
                }
            }
        })
        .catch(error => {
            surahDetail.innerHTML = `
                <div class="error" style="padding: 20px; text-align: center; color: #c00;">
                    Error loading juz content. Please check your internet connection.
                </div>
            `;
            console.error('Error loading juz content:', error);
        });
}

// Update the tab click function to load Juz data when tab is clicked
function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-link');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.textContent.trim();
            if (tabName === 'Bookmark') {
                loadBookmarks();
            } else if (tabName === 'Juz') {
                loadJuzList();
            } else if (tabName === 'Surah') {
                loadSurahList();
            }
        });
    });
}