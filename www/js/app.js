// ambi wilayah saat ini 
// Fungsi untuk menampilkan waktu saat ini
function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Format waktu 24 jam
    document.querySelector('.prayer-time').textContent = `${hours}:${minutes}`;

    // Update tanggal
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    document.querySelectorAll('.date-info')[1].textContent = dateStr;

    // Update setiap 1 menit
    setTimeout(updateCurrentTime, 60000);
}

// Panggil fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', updateCurrentTime);

// Fungsi untuk mendapatkan lokasi pengguna menggunakan Geolocation API
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, handleLocationError);
    } else {
        alert("Geolocation tidak didukung oleh browser ini.");
    }
}

// Callback sukses untuk geolocation
function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Gunakan koordinat untuk mendapatkan nama kota (reverse geocoding)
    fetchCityName(latitude, longitude);

    // Simpan koordinat untuk perhitungan waktu shalat
    localStorage.setItem('userLat', latitude);
    localStorage.setItem('userLng', longitude);

    // Hitung jadwal shalat dengan koordinat ini
    calculatePrayerTimes(latitude, longitude);
}

// Mendapatkan nama kota dari koordinat
function fetchCityName(lat, lng) {
    // Gunakan API seperti Nominatim atau Google Geocoding API
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            const city = data.address.city || data.address.town || data.address.village || '';
            const country = data.address.country || '';
            document.querySelector('.p-1.m-0').textContent = `${city}, ${country}`;
        })
        .catch(error => {
            console.error("Error fetching city name:", error);
        });
}

// Alternatif: fungsi untuk memperbarui lokasi secara manual
function updateLocation(city, country) {
    document.querySelector('.p-1.m-0').textContent = `${city}, ${country}`;

    // Panggil API untuk mendapatkan koordinat kota
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city},${country}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const latitude = parseFloat(data[0].lat);
                const longitude = parseFloat(data[0].lon);

                localStorage.setItem('userLat', latitude);
                localStorage.setItem('userLng', longitude);

                // Hitung jadwal shalat dengan koordinat baru
                calculatePrayerTimes(latitude, longitude);
            }
        })
        .catch(error => {
            console.error("Error fetching coordinates:", error);
        });
}

// Panggil getUserLocation saat aplikasi dimulai
document.addEventListener('DOMContentLoaded', getUserLocation);

// Variabel untuk menyimpan modal
let locationModal;

// Fungsi untuk menampilkan modal pemilih lokasi
function showLocationSelector() {
    locationModal.show();
}

// Inisialisasi modal setelah DOM siap
document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi modal Bootstrap
    locationModal = new bootstrap.Modal(document.getElementById('locationModal'));

    // Event listener untuk elemen lokasi di header
    const locationElement = document.querySelector('.border.rounded-pill');
    if (locationElement) {
        locationElement.addEventListener('click', showLocationSelector);
    }

    // Event listener untuk tombol "Gunakan Lokasi Saat Ini"
    document.getElementById('useCurrentLocation').addEventListener('click', function () {
        getUserLocation();
        locationModal.hide();
    });

    // Event listener untuk input pencarian
    const searchInput = document.getElementById('locationSearch');
    searchInput.addEventListener('input', debounce(function () {
        const query = searchInput.value.trim();
        if (query.length >= 3) {
            searchLocations(query);
        } else {
            document.getElementById('searchResults').style.display = 'none';
        }
    }, 500));

    // Event listener untuk kota popular
    document.querySelectorAll('#popularCities .list-group-item').forEach(item => {
        item.addEventListener('click', function () {
            const city = this.getAttribute('data-city');
            const country = this.getAttribute('data-country');
            updateLocation(city, country);
            locationModal.hide();
        });
    });
});

// Fungsi debounce untuk mencegah terlalu banyak permintaan API
function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Fungsi untuk mencari lokasi dengan API
function searchLocations(query) {
    // Tampilkan loading
    document.getElementById('cityResults').innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Mencari...</div>';
    document.getElementById('searchResults').style.display = 'block';

    // Gunakan OpenStreetMap API untuk pencarian
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`)
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('cityResults');
            resultsContainer.innerHTML = '';

            if (data && data.length > 0) {
                data.forEach(place => {
                    // Ekstrak kota dan negara
                    const placeName = place.display_name;
                    const parts = placeName.split(', ');
                    const city = parts[0] || '';
                    const country = parts[parts.length - 1] || '';

                    // Buat elemen hasil
                    const button = document.createElement('button');
                    button.className = 'list-group-item list-group-item-action';
                    button.textContent = placeName;
                    button.setAttribute('data-lat', place.lat);
                    button.setAttribute('data-lon', place.lon);
                    button.setAttribute('data-city', city);
                    button.setAttribute('data-country', country);

                    button.addEventListener('click', function () {
                        const city = this.getAttribute('data-city');
                        const country = this.getAttribute('data-country');
                        const lat = parseFloat(this.getAttribute('data-lat'));
                        const lng = parseFloat(this.getAttribute('data-lon'));

                        // Simpan data dan update UI
                        localStorage.setItem('userLat', lat);
                        localStorage.setItem('userLng', lng);
                        document.querySelector('.p-1.m-0').textContent = `${city}, ${country}`;
                        calculatePrayerTimes(lat, lng);

                        // Tutup modal
                        locationModal.hide();
                    });

                    resultsContainer.appendChild(button);
                });
            } else {
                resultsContainer.innerHTML = '<p class="text-center">Tidak ditemukan hasil. Coba kata kunci lain.</p>';
            }
        })
        .catch(error => {
            console.error("Error searching locations:", error);
            document.getElementById('cityResults').innerHTML = '<p class="text-center text-danger">Terjadi kesalahan. Silakan coba lagi.</p>';
        });
}

// Fungsi update lokasi yang diperbarui
function updateLocation(city, country) {
    document.querySelector('.p-1.m-0').textContent = `${city}, ${country}`;

    // Panggil API untuk mendapatkan koordinat kota
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city},${country}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const latitude = parseFloat(data[0].lat);
                const longitude = parseFloat(data[0].lon);

                localStorage.setItem('userLat', latitude);
                localStorage.setItem('userLng', longitude);

                // Hitung jadwal shalat dengan koordinat baru
                calculatePrayerTimes(latitude, longitude);
            }
        })
        .catch(error => {
            console.error("Error fetching coordinates:", error);
            alert("Gagal mendapatkan koordinat lokasi. Silakan coba lagi.");
        });
}

// Fungsi untuk mendapatkan lokasi pengguna (diperbarui)
function getUserLocation() {
    // Tampilkan loading
    document.querySelector('.p-1.m-0').textContent = 'Mendapatkan lokasi...';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, handleLocationError);
    } else {
        alert("Geolocation tidak didukung oleh browser ini.");
    }
}

// Callback error untuk geolocation
function handleLocationError(error) {
    let errorMessage;

    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "Izin akses lokasi ditolak.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
        case error.TIMEOUT:
            errorMessage = "Waktu permintaan lokasi habis.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "Terjadi kesalahan yang tidak diketahui.";
            break;
    }

    alert(errorMessage);

    // Set default location if error occurs
    document.querySelector('.p-1.m-0').textContent = 'Jakarta, Indonesia';
}

// Fungsi untuk memperbarui UI waktu shalat
function updatePrayerTimeUI(prayerName, time) {
    if (!time) {
        console.error(`Time for ${prayerName} is undefined`);
        return;
    }

    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes}`;

    console.log(`Updating ${prayerName} time to ${timeFormatted}`);

    // Cari elemen prayer-item yang sesuai
    const prayerItems = document.querySelectorAll('.prayer-item');
    for (let item of prayerItems) {
        if (item.querySelector('div').textContent === prayerName) {
            item.querySelector('.time').textContent = timeFormatted;
            break;
        }
    }
}

// Fungsi untuk memperbarui informasi waktu tersisa hingga shalat berikutnya
function updateNextPrayerTime(prayerTimes) {
    try {
        const now = new Date();

        // Buat array waktu shalat untuk hari ini
        const prayers = [
            { name: 'Fajr', time: prayerTimes.fajr },
            { name: 'Dzuhr', time: prayerTimes.dhuhr },
            { name: 'Asr', time: prayerTimes.asr },
            { name: 'Maghrib', time: prayerTimes.maghrib },
            { name: 'Isha', time: prayerTimes.isha }
        ];

        // Temukan waktu shalat berikutnya
        let nextPrayer = null;
        for (let prayer of prayers) {
            if (prayer.time > now) {
                nextPrayer = prayer;
                break;
            }
        }

        // Jika tidak ada shalat berikutnya hari ini, ambil shalat pertama besok
        if (!nextPrayer) {
            // Untuk sederhananya, gunakan Fajr untuk besok
            // Implementasi yang lebih baik adalah menghitung waktu shalat besok
            nextPrayer = { name: 'Fajr (besok)', time: new Date(now) };
            nextPrayer.time.setDate(nextPrayer.time.getDate() + 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Hitung waktu shalat untuk besok
            const tomorrowPrayerTimes = new Adhan.PrayerTimes(
                new Adhan.Coordinates(
                    parseFloat(localStorage.getItem('userLat')),
                    parseFloat(localStorage.getItem('userLng'))
                ),
                tomorrow,
                Adhan.CalculationMethod.MuslimWorldLeague()
            );

            nextPrayer.time = tomorrowPrayerTimes.fajr;
        }

        // Hitung selisih waktu
        let timeDiff = nextPrayer.time - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`Next prayer: ${nextPrayer.name} in ${hours}h ${minutes}m`);

        // Update UI
        document.querySelector('.time-remaining').textContent =
            `${nextPrayer.name}: ${hours} hour ${minutes} min left`;

    } catch (error) {
        console.error("Error updating next prayer time:", error);
        document.querySelector('.time-remaining').textContent = "Waktu shalat berikutnya tidak tersedia";
    }
}




// Fungsi untuk mengkonversi string waktu menjadi objek Date
function convertToDate(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':');
    const time = new Date(now);
    time.setHours(parseInt(hours));
    time.setMinutes(parseInt(minutes));
    time.setSeconds(0);
    return time;
}

// Fungsi untuk memperbarui informasi waktu tersisa hingga shalat berikutnya
function updateNextPrayerTime(times) {
    try {
        const now = new Date();

        // Konversi semua waktu ke objek Date
        const prayers = [
            { name: 'Fajr', time: convertToDate(times.fajr) },
            { name: 'Dzuhr', time: convertToDate(times.dhuhr) },
            { name: 'Asr', time: convertToDate(times.asr) },
            { name: 'Maghrib', time: convertToDate(times.maghrib) },
            { name: 'Isha', time: convertToDate(times.isha) }
        ];

        // Temukan waktu shalat berikutnya
        let nextPrayer = null;
        for (let prayer of prayers) {
            if (prayer.time > now) {
                nextPrayer = prayer;
                break;
            }
        }

        // Jika tidak ada shalat berikutnya hari ini, ambil shalat pertama besok
        if (!nextPrayer) {
            nextPrayer = { name: 'Fajr (besok)', time: convertToDate(times.fajr) };
            nextPrayer.time.setDate(nextPrayer.time.getDate() + 1);
        }

        // Hitung selisih waktu
        let timeDiff = nextPrayer.time - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`Next prayer: ${nextPrayer.name} in ${hours}h ${minutes}m`);

        // Update UI
        document.querySelector('.time-remaining').textContent =
            `${nextPrayer.name}: ${hours} hour ${minutes} min left`;

    } catch (error) {
        console.error("Error updating next prayer time:", error);
        document.querySelector('.time-remaining').textContent = "Waktu shalat berikutnya tidak tersedia";
    }
}


// Set default waktu shalat jika terjadi error
function setDefaultPrayerTimes() {
    const defaultTimes = {
        'Fajr': '04:41',
        'Dzuhr': '12:00',
        'Asr': '15:14',
        'Maghrib': '18:02',
        'Isha': '19:11'
    };

    // Update UI dengan waktu default
    Object.keys(defaultTimes).forEach(prayer => {
        const prayerItems = document.querySelectorAll('.prayer-item');
        for (let item of prayerItems) {
            if (item.querySelector('div').textContent === prayer) {
                item.querySelector('.time').textContent = defaultTimes[prayer];
                break;
            }
        }
    });

    // Set default countdown
    document.querySelector('.time-remaining').textContent =
        "Waktu shalat tidak tersedia. Menggunakan waktu default.";
}

// Fungsi untuk memperbarui UI waktu shalat
function updatePrayerTimeUI(prayerName, time) {
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes}`;

    // Cari elemen prayer-item yang sesuai
    const prayerItems = document.querySelectorAll('.prayer-item');
    for (let item of prayerItems) {
        if (item.querySelector('div').textContent === prayerName) {
            item.querySelector('.time').textContent = timeFormatted;
            break;
        }
    }
}

// Fungsi untuk memperbarui informasi waktu tersisa hingga shalat berikutnya
function updateNextPrayerTime(prayerTimes) {
    const now = new Date();
    const nextPrayer = Adhan.nextPrayer(prayerTimes);
    const nextPrayerTime = prayerTimes[nextPrayer.toLowerCase()];

    let timeDiff = nextPrayerTime - now;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    const prayerNameIndonesian = {
        fajr: 'Fajr',
        dhuhr: 'Dzuhr',
        asr: 'Asr',
        maghrib: 'Maghrib',
        isha: 'Isha'
    };

    document.querySelector('.time-remaining').textContent =
        `${prayerNameIndonesian[nextPrayer.toLowerCase()]}: ${hours} hour ${minutes} min left`;
}

// Untuk tanggal Hijriah yang lebih akurat, gunakan library seperti hijri-date
// Untuk sementara ini, kita gunakan tanggal statis atau perhitungan sederhana
function updateHijriDate() {
    // Versi statis (ganti dengan nilai yang benar atau gunakan library)
    const hijriYear = 1445; // Sesuaikan dengan tahun Hijriah saat ini
    const hijriMonth = 'Ramadhan'; // Sesuaikan dengan bulan Hijriah saat ini
    const hijriDay = 9; // Sesuaikan dengan tanggal Hijriah saat ini

    document.querySelectorAll('.date-info')[0].textContent = `${hijriDay} ${hijriMonth} ${hijriYear} H`;

    // Untuk implementasi yang lebih akurat, gunakan library seperti:
    // https://github.com/xsoh/moment-hijri
}

// Panggil fungsi ini di dalam onDeviceReady atau setelah DOM siap
function onDeviceReady() {
    console.log('Device is ready');

    // Jalankan fungsi-fungsi kita
    updateCurrentTime();
    updateHijriDate(); // Tambahkan ini
    getUserLocation();

    // Jika sudah ada koordinat tersimpan, gunakan itu
    const savedLat = localStorage.getItem('userLat');
    const savedLng = localStorage.getItem('userLng');

    if (savedLat && savedLng) {
        calculatePrayerTimes(parseFloat(savedLat), parseFloat(savedLng));
    }
}

// Tunggu sampai dokumen sepenuhnya dimuat
// Tunggu sampai dokumen sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded");

    // Inisialisasi aplikasi tanpa bergantung pada bootstrap modal
    // (Akan kita perbaiki setelah bootstrap bekerja)
    updateCurrentTime();
    updateHijriDate();
    getUserLocation();

    // Tambahkan click listener secara manual jika bootstrap belum siap
    // const locationElement = document.querySelector('.border.rounded-pill');
    // if (locationElement) {
    //     locationElement.addEventListener('click', function() {
    //         // Tampilkan pesan sederhana jika modal belum bisa digunakan
    //         alert("Fitur pilih lokasi akan segera tersedia");
    //     });
    // }
});

// Fungsi untuk menampilkan waktu saat ini
function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Format waktu 24 jam
    document.querySelector('.prayer-time').textContent = `${hours}:${minutes}`;

    // Update tanggal
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    document.querySelectorAll('.date-info')[1].textContent = dateStr;

    // Update setiap 1 menit
    setTimeout(updateCurrentTime, 60000);
}

// Untuk tanggal Hijriah (sementara static)
function updateHijriDate() {
    const hijriYear = 1445;
    const hijriMonth = 'Ramadhan';
    const hijriDay = 9;

    document.querySelectorAll('.date-info')[0].textContent = `${hijriDay} ${hijriMonth} ${hijriYear} H`;
}

// Fungsi untuk mendapatkan lokasi pengguna menggunakan Geolocation API
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, handleLocationError);
    } else {
        alert("Geolocation tidak didukung oleh browser ini.");
    }
}

// Callback sukses untuk geolocation
function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Gunakan koordinat untuk mendapatkan nama kota (reverse geocoding)
    fetchCityName(latitude, longitude);

    // Simpan koordinat untuk perhitungan waktu shalat
    localStorage.setItem('userLat', latitude);
    localStorage.setItem('userLng', longitude);

    // Hitung jadwal shalat dengan koordinat ini
    calculatePrayerTimes(latitude, longitude);
}

// Mendapatkan nama kota dari koordinat
function fetchCityName(lat, lng) {
    // Gunakan API seperti Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            const city = data.address.city || data.address.town || data.address.village || '';
            const country = data.address.country || '';
            document.querySelector('.p-1.m-0').textContent = `${city}, ${country}`;
        })
        .catch(error => {
            console.error("Error fetching city name:", error);
        });
}

// Callback error untuk geolocation
function handleLocationError(error) {
    let errorMessage;

    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "Izin akses lokasi ditolak.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
        case error.TIMEOUT:
            errorMessage = "Waktu permintaan lokasi habis.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "Terjadi kesalahan yang tidak diketahui.";
            break;
    }

    alert(errorMessage);

    // Set default location if error occurs
    document.querySelector('.p-1.m-0').textContent = 'Jakarta, Indonesia';
    calculatePrayerTimes(-6.175110, 106.865039); // Default coordinates for Jakarta
}

// Fungsi untuk menghitung waktu shalat menggunakan PrayTimes.js
// Fungsi untuk menghitung waktu shalat menggunakan PrayTimes.js
function calculatePrayerTimes(latitude, longitude) {
    try {
        console.log("Menghitung waktu shalat untuk:", latitude, longitude);

        // Periksa apakah PrayTimes tersedia
        if (typeof PrayTimes === 'undefined') {
            throw new Error("Library PrayTimes tidak ditemukan");
        }

        // Inisialisasi dengan metode MWL (Muslim World League)
        var PT = new PrayTimes('MWL');

        // Sesuaikan offset waktu (dalam menit) untuk menyelaraskan dengan Kemenag
        // Format: {imsak, fajr, sunrise, dhuhr, asr, sunset, maghrib, isha}
        PT.tune({
            fajr: 4,     // kurangi 4 menit
            dhuhr: 4,    // kurangi 4 menit
            asr: 4,      // kurangi 4 menit
            maghrib: 4,  // kurangi 4 menit
            isha: 4      // kurangi 4 menit
        });

        // Dapatkan tanggal saat ini
        const date = new Date();

        // Timezone otomatis (gunakan timezone dari browser)
        const timezone = date.getTimezoneOffset() / -60;

        // Hitung waktu shalat
        const times = PT.getTimes(date, [latitude, longitude], timezone);

        console.log("Prayer times calculated:", times);

        // Update UI dengan waktu shalat
        updatePrayerTimeUI('Fajr', times.fajr);
        updatePrayerTimeUI('Dzuhr', times.dhuhr);
        updatePrayerTimeUI('Asr', times.asr);
        updatePrayerTimeUI('Maghrib', times.maghrib);
        updatePrayerTimeUI('Isha', times.isha);

        // Update informasi waktu tersisa hingga shalat berikutnya
        updateNextPrayerTimeWithPrayTimes(times);

        console.log("Waktu shalat berhasil dihitung");
    } catch (error) {
        console.error("Error menghitung waktu shalat:", error);
        // Set default times untuk UI jika error
        setDefaultPrayerTimes();
    }
}


// Fungsi untuk memperbarui UI waktu shalat
function updatePrayerTimeUI(prayerName, timeStr) {
    console.log(`Updating ${prayerName} time to ${timeStr}`);

    // Cari elemen prayer-item yang sesuai
    const prayerItems = document.querySelectorAll('.prayer-item');
    for (let item of prayerItems) {
        if (item.querySelector('div').textContent === prayerName) {
            item.querySelector('.time').textContent = timeStr;
            break;
        }
    }
}

// Fungsi untuk memperbarui informasi waktu tersisa hingga shalat berikutnya
function updateNextPrayerTimeWithPrayTimes(times) {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour + (currentMinute / 60);

        // Konversi string waktu ke nilai numerik jam
        function timeToDecimal(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours + (minutes / 60);
        }

        // Buat array waktu shalat untuk hari ini
        const prayers = [
            { name: 'Fajr', time: timeToDecimal(times.fajr) },
            { name: 'Dzuhr', time: timeToDecimal(times.dhuhr) },
            { name: 'Asr', time: timeToDecimal(times.asr) },
            { name: 'Maghrib', time: timeToDecimal(times.maghrib) },
            { name: 'Isha', time: timeToDecimal(times.isha) }
        ];

        // Temukan waktu shalat berikutnya
        let nextPrayer = null;
        for (let prayer of prayers) {
            if (prayer.time > currentTime) {
                nextPrayer = prayer;
                break;
            }
        }

        // Jika tidak ada shalat berikutnya hari ini, ambil shalat pertama besok
        if (!nextPrayer) {
            nextPrayer = { name: 'Fajr (besok)', time: prayers[0].time + 24 };
        }

        // Hitung selisih waktu
        let timeDiff = nextPrayer.time - currentTime;
        const hours = Math.floor(timeDiff);
        const minutes = Math.floor((timeDiff - hours) * 60);

        console.log(`Next prayer: ${nextPrayer.name} in ${hours}h ${minutes}m`);

        // Update UI
        document.querySelector('.time-remaining').textContent =
            `${nextPrayer.name}: ${hours} jam ${minutes} menit lagi`;

    } catch (error) {
        console.error("Error updating next prayer time:", error);
        document.querySelector('.time-remaining').textContent = "Waktu shalat berikutnya tidak tersedia";
    }
}

// Set default waktu shalat jika terjadi error
function setDefaultPrayerTimes() {
    const defaultTimes = {
        'Fajr': '04:41',
        'Dzuhr': '12:00',
        'Asr': '15:14',
        'Maghrib': '18:02',
        'Isha': '19:11'
    };

    // Update UI dengan waktu default
    Object.keys(defaultTimes).forEach(prayer => {
        const prayerItems = document.querySelectorAll('.prayer-item');
        for (let item of prayerItems) {
            if (item.querySelector('div').textContent === prayer) {
                item.querySelector('.time').textContent = defaultTimes[prayer];
                break;
            }
        }
    });

    // Set default countdown
    document.querySelector('.time-remaining').textContent =
        "Fajr: 3 hour 9 min left";
}


// Fungsi untuk memuat Adhan.js secara dinamis
function loadAdhanJs() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js';
    script.onload = function () {
        console.log("Adhan.js berhasil dimuat!");
        initApp();
    };
    script.onerror = function () {
        console.error("Gagal memuat Adhan.js");
        alert("Gagal memuat library perhitungan waktu shalat. Silakan refresh halaman.");
    };
    document.body.appendChild(script);
}

// Fungsi inisialisasi aplikasi
function initApp() {
    console.log("Menginisialisasi aplikasi...");

    // Jalankan fungsi-fungsi kita
    updateCurrentTime();
    updateHijriDate();

    // Init modal jika ada
    if (document.getElementById('locationModal')) {
        locationModal = new bootstrap.Modal(document.getElementById('locationModal'));

        // Event listener untuk elemen lokasi di header
        const locationElement = document.querySelector('.border.rounded-pill');
        if (locationElement) {
            locationElement.addEventListener('click', showLocationSelector);
        }

        // Event listener untuk tombol "Gunakan Lokasi Saat Ini"
        const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
        if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', function () {
                getUserLocation();
                locationModal.hide();
            });
        }

        // Event listener untuk input pencarian
        const searchInput = document.getElementById('locationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function () {
                const query = searchInput.value.trim();
                if (query.length >= 3) {
                    searchLocations(query);
                } else {
                    document.getElementById('searchResults').style.display = 'none';
                }
            }, 500));
        }

        // Event listener untuk kota popular
        document.querySelectorAll('#popularCities .list-group-item').forEach(item => {
            item.addEventListener('click', function () {
                const city = this.getAttribute('data-city');
                const country = this.getAttribute('data-country');
                updateLocation(city, country);
                locationModal.hide();
            });
        });
    }

    // Dapatkan lokasi pengguna
    getUserLocation();

    // Jika sudah ada koordinat tersimpan, gunakan itu
    const savedLat = localStorage.getItem('userLat');
    const savedLng = localStorage.getItem('userLng');

    if (savedLat && savedLng) {
        calculatePrayerTimes(parseFloat(savedLat), parseFloat(savedLng));
    }
}

// FUNGSI UNTUK FULLSCREEN CARD ISLAMI
// Tambahkan kode ini di file app.js
document.addEventListener('DOMContentLoaded', function () {
    // Semua card Islamic
    const islamicCards = document.querySelectorAll('.islamic-card');
    const storyContainer = document.getElementById('storyContainer');
    const storyContent = document.querySelector('.story-content');
    const closeStory = document.querySelector('.close-story');
    const progressBar = document.querySelector('.progress-bar');

    // UNTUK TANTANGAN KEBAIKAN ISINYA //
    // Array tantangan kebaikan dengan ikon
    const tantanganList = [
        {
            text: "Tersenyum kepada semua orang yang Anda temui hari ini",
            icon: "bi-emoji-smile"
        },
        {
            text: "Membaca atau mendengarkan satu ayat Al-Quran dan merenungkan maknanya",
            icon: "bi-book"
        },
        {
            text: "Menghubungi satu kerabat yang sudah lama tidak berkomunikasi",
            icon: "bi-telephone"
        },
        {
            text: "Membuang sampah yang Anda temui di jalan meski bukan sampah Anda",
            icon: "bi-trash"
        },
        {
            text: "Memberikan pujian tulus kepada minimal 3 orang hari ini",
            icon: "bi-chat-heart"
        },
        {
            text: "Menyisihkan sebagian rezeki untuk bersedekah hari ini",
            icon: "bi-wallet2"
        },
        {
            text: "Menahan diri untuk tidak mengeluh sepanjang hari",
            icon: "bi-emoji-neutral"
        },
        {
            text: "Mendoakan 10 orang yang Anda kenal tanpa mereka tahu",
            icon: "bi-people"
        },
        {
            text: "Membantu satu orang yang membutuhkan bantuan tanpa diminta",
            icon: "bi-hand-thumbs-up"
        },
        {
            text: "Mengucapkan minimal 100 kali istighfar hari ini",
            icon: "bi-stars"
        }
    ];

    // Fungsi untuk mendapatkan tantangan berdasarkan tanggal
    function getTodaysTantangan() {
        // Dapatkan tanggal hari ini
        const today = new Date();
        // Reset waktu ke tengah malam untuk memastikan konsistensi sepanjang hari
        today.setHours(0, 0, 0, 0);

        // Menggunakan timestamp sebagai seed untuk random
        const seed = today.getTime();

        // Fungsi pseudo-random sederhana dengan seed
        const seededRandom = function () {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        // Pilih tantangan berdasarkan random dengan seed
        const index = Math.floor(seededRandom() * tantanganList.length);
        return tantanganList[index];
    }

    // UNTUK KATA MUTIARA ISINYA //
    // Array kata mutiara
    const mutiaraNasehatList = [
        {
            quote: "\"Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan ke surga.\" - Hadits Riwayat Muslim",
            icon: "bi-book-half"
        },
        {
            quote: "\"Sesungguhnya Allah tidak melihat kepada bentuk rupa kalian dan harta kalian, tetapi Dia melihat kepada hati dan amal kalian.\" - Hadits Riwayat Muslim",
            icon: "bi-heart"
        },
        {
            quote: "\"Senyummu di hadapan saudaramu adalah sedekah.\" - Hadits Riwayat Tirmidzi",
            icon: "bi-emoji-smile-fill"
        },
        {
            quote: "\"Yang terbaik di antara kalian adalah yang terbaik akhlaknya.\" - Hadits Riwayat Bukhari",
            icon: "bi-star"
        },
        {
            quote: "\"Tiga hal yang menyelamatkan: takut kepada Allah baik dalam keadaan tersembunyi maupun terang-terangan, berlaku adil pada saat senang dan marah, dan berhemat dalam keadaan kaya dan miskin.\" - Ali bin Abi Thalib",
            icon: "bi-shield"
        },
        {
            quote: "\"Hati yang baik selalu memikirkan hal-hal yang baik, dan hati yang buruk selalu memikirkan hal-hal yang buruk.\" - Imam Al-Ghazali",
            icon: "bi-brightness-high"
        },
        {
            quote: "\"Barangsiapa yang tidak mensyukuri yang sedikit, maka ia tidak akan mampu mensyukuri yang banyak.\" - Ibnu Mas'ud",
            icon: "bi-hand-thumbs-up"
        },
        {
            quote: "\"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada keduanya ada kebaikan.\" - Hadits Riwayat Muslim",
            icon: "bi-lightning-charge"
        },
        {
            quote: "\"Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.\" - Surah Al-Baqarah 2:286",
            icon: "bi-balloon-heart"
        },
        {
            quote: "\"Wahai orang-orang yang beriman, bersabarlah kamu dan kuatkanlah kesabaranmu.\" - Surah Ali Imran 3:200",
            icon: "bi-hourglass-split"
        }
    ];

    // Fungsi untuk mendapatkan mutiara nasihat berdasarkan tanggal
function getTodaysMutiaraNasehat() {
    // Dapatkan tanggal hari ini
    const today = new Date();
    // Reset waktu ke tengah malam untuk memastikan konsistensi sepanjang hari
    today.setHours(0, 0, 0, 0);
    
    // Menggunakan timestamp sebagai seed untuk random
    const seed = today.getTime();
    
    // Fungsi pseudo-random sederhana dengan seed
    const seededRandom = function() {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };
    
    // Pilih mutiara nasihat berdasarkan random dengan seed
    const index = Math.floor(seededRandom() * mutiaraNasehatList.length);
    return mutiaraNasehatList[index];
}

// UNTUK TIPS HIDUP ISLAMI ISINYA //
// Array tips hidup islami dengan ikon
const tipsIslamiList = [
    {
        title: "Menjaga Kebersihan",
        text: "Bersihkan rumah dan area pribadi Anda secara teratur. Nabi Muhammad SAW bersabda: 'Kebersihan adalah sebagian dari iman.' Mulailah dengan menyapu dan mengelap debu setiap hari, mengatur barang-barang dengan rapi, dan membersihkan tempat tidur sebelum tidur dan setelah bangun.",
        icon: "bi-droplet"
    },
    {
        title: "Manajemen Waktu Islami",
        text: "Atur waktu Anda berdasarkan waktu shalat. Jadikan shalat lima waktu sebagai titik istirahat dan refleksi dalam kesibukan harian. Selesaikan tugas-tugas penting di pagi hari setelah Subuh ketika pikiran masih segar. Gunakan waktu di antara Maghrib dan Isya untuk keluarga.",
        icon: "bi-clock"
    },
    {
        title: "Adab Makan Islami",
        text: "Mulai makan dengan bismillah dan akhiri dengan alhamdulillah. Gunakan tangan kanan dan makan dengan tiga jari sesuai sunnah. Makan dalam porsi kecil hingga 1/3 perut untuk makanan, 1/3 untuk minuman, dan 1/3 untuk udara. Jangan makan berlebihan dan hindari makan sambil berdiri.",
        icon: "bi-cup-hot"
    },
    {
        title: "Menjaga Lisan",
        text: "Biasakan berbicara yang baik atau diam. Hindari gibah (membicarakan orang lain), namimah (adu domba), dan perkataan kotor. Sebelum berbicara, tanyakan pada diri: apakah ucapan ini benar, baik, dan perlu? Jika tidak memenuhi ketiga syarat, lebih baik diam.",
        icon: "bi-chat-quote"
    },
    {
        title: "Adab Tidur Islami",
        text: "Tidur dalam keadaan suci (berwudhu), berbaring miring ke kanan, dan membaca doa sebelum tidur. Hindari tidur setelah subuh dan setelah ashar. Usahakan tidur maksimal 8 jam sehari dan bangun sebelum subuh untuk tahajud. Matikan lampu dan gadget untuk kualitas tidur yang lebih baik.",
        icon: "bi-moon"
    },
    {
        title: "Sederhana dalam Berpakaian",
        text: "Berpakaian sesuai syariat dengan menutup aurat, bersih, dan sederhana. Hindari pakaian yang berlebihan, terlalu ketat, atau menyerupai lawan jenis. Utamakan kenyamanan dan kesopanan, bukan tren. Mendahulukan kanan saat berpakaian dan kiri saat melepasnya.",
        icon: "bi-person-badge"
    },
    {
        title: "Mengelola Keuangan Secara Islami",
        text: "Sisihkan zakat dan sedekah sebelum mengalokasikan pendapatan untuk kebutuhan lain. Hindari riba dan hutang yang tidak perlu. Belanjakan harta pada hal yang halal dan bermanfaat. Catat pemasukan dan pengeluaran secara teratur. Hidup sesuai kemampuan, tidak bermewah-mewahan.",
        icon: "bi-cash-coin"
    },
    {
        title: "Menjaga Silaturahmi",
        text: "Luangkan waktu untuk mengunjungi kerabat dan tetangga secara rutin. Jalin komunikasi meski terpisah jarak dengan telepon atau pesan. Maafkan kesalahan dan jauhi permusuhan. Selalu doakan kebaikan untuk saudara Muslim lainnya. Silaturahmi akan memperpanjang umur dan memperluas rezeki.",
        icon: "bi-people"
    },
    {
        title: "Membaca Al-Quran Setiap Hari",
        text: "Luangkan waktu minimal 10 menit setiap hari untuk membaca Al-Quran. Bacalah dengan tartil, pahami artinya, dan renungkan maknanya. Jadwalkan waktu tetap, misalnya setelah shalat Subuh atau sebelum tidur. Mulai dengan surat-surat pendek jika kesulitan, lalu tingkatkan secara bertahap.",
        icon: "bi-book"
    },
    {
        title: "Bersyukur dalam Segala Keadaan",
        text: "Praktikkan syukur dengan mengucapkan alhamdulillah sepanjang hari. Tulis minimal tiga hal yang disyukuri setiap malam. Gunakan nikmat Allah untuk kebaikan, bukan maksiat. Bandingkan hidup dengan yang kurang beruntung, bukan yang lebih beruntung. Sadar bahwa kesulitan adalah ujian kasih sayang Allah.",
        icon: "bi-emoji-smile"
    }
];

// Fungsi untuk mendapatkan tips islami berdasarkan tanggal
function getTodaysTipsIslami() {
    // Dapatkan tanggal hari ini
    const today = new Date();
    // Reset waktu ke tengah malam untuk memastikan konsistensi sepanjang hari
    today.setHours(0, 0, 0, 0);
    
    // Menggunakan timestamp sebagai seed untuk random
    const seed = today.getTime();
    
    // Fungsi pseudo-random sederhana dengan seed
    const seededRandom = function() {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };
    
    // Pilih tips islami berdasarkan random dengan seed
    const index = Math.floor(seededRandom() * tipsIslamiList.length);
    return tipsIslamiList[index];
}


    // Konten untuk setiap story
    function getStoryContent(storyId) {
        if (storyId == 1) {
          // Tantangan kebaikan
          const tantangan = getTodaysTantangan();
          return `
            <div class="story-item">
              <div class="tantangan-icon">
                <i class="bi ${tantangan.icon} fs-1 mb-3"></i>
              </div>
              <h1>Tantangan Kebaikan <br>Hari Ini Untuk Anda</h1>
              <p>${tantangan.text}</p>
            </div>
          `;
        } else if (storyId == 2) {
            // Mutiara nasihat
            const mutiara = getTodaysMutiaraNasehat();
            return `
            <div class="story-item">
                <div class="mutiara-icon">
                    <i class="bi ${mutiara.icon} fs-1 mb-3"></i>
                </div>
                <h1>Daily Inspiration</h1>
                <div class="quote">${mutiara.quote}</div>
            </div>
            `;
        } else if (storyId == 3) {
            // Tips hidup islami
            const tips = getTodaysTipsIslami();
            return `
            <div class="story-item">
                <div class="tips-icon">
                    <i class="bi ${tips.icon} fs-1 mb-3"></i>
                </div>
                <h3 class="tips-title">${tips.title}</h3>
                <p class="tips-text">${tips.text}</p>
            </div>
            `;
        }
      }

    // Event listener untuk setiap card
    islamicCards.forEach(card => {
        card.addEventListener('click', function () {
            const storyId = this.getAttribute('data-story-id');
            showStory(storyId);
        });
    });

    // Tutup story saat tombol close diklik
    closeStory.addEventListener('click', function () {
        hideStory();
    });

    // Tambahkan variabel untuk mengontrol status pause
    let isPaused = false;
    let progressInterval;
    let currentProgress = 0;

    // Fungsi showStory yang diperbarui
// Fungsi showStory yang diperbarui
function showStory(storyId) {
    storyContent.innerHTML = getStoryContent(storyId);
    storyContainer.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Tambahkan animasi masuk
    storyContainer.classList.add('story-entering');
    setTimeout(() => {
        storyContainer.classList.remove('story-entering');
    }, 300);

    // Reset progress bar dan status
    progressBar.style.width = '0%';
    progressBar.style.transition = 'none';
    currentProgress = 0;
    isPaused = false;

    // Mulai animasi progress bar
    startProgressAnimation();

    // Event listeners untuk pause story
    storyContainer.addEventListener('mousedown', pauseStory);
    storyContainer.addEventListener('touchstart', pauseStory);

    storyContainer.addEventListener('mouseup', resumeStory);
    storyContainer.addEventListener('touchend', resumeStory);

    // Jika pengguna meninggalkan halaman saat menekan
    storyContainer.addEventListener('mouseleave', resumeStory);
    storyContainer.addEventListener('touchcancel', resumeStory);
}

    function startProgressAnimation() {
        // Hentikan interval sebelumnya jika ada
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        const storyDuration = 5000; // 5 detik
        const updateInterval = 50; // Update setiap 50ms
        const incrementPerUpdate = (100 / (storyDuration / updateInterval));

        progressInterval = setInterval(() => {
            if (!isPaused) {
                currentProgress += incrementPerUpdate;
                if (currentProgress >= 100) {
                    clearInterval(progressInterval);
                    currentProgress = 100;
                    progressBar.style.width = '100%';

                    // Tutup story setelah progress bar selesai
                    setTimeout(() => {
                        hideStory();
                    }, 100);
                } else {
                    progressBar.style.width = `${currentProgress}%`;
                }
            }
        }, updateInterval);
    }

    function pauseStory() {
        isPaused = true;
        // Tampilkan indikator pause (opsional)
        if (!document.querySelector('.pause-indicator')) {
            const pauseIndicator = document.createElement('div');
            pauseIndicator.className = 'pause-indicator';
            pauseIndicator.innerHTML = '<i class="bi bi-pause-circle"></i>';
            storyContainer.appendChild(pauseIndicator);
        }
    }

    function resumeStory() {
        isPaused = false;
        // Hapus indikator pause jika ada
        const pauseIndicator = document.querySelector('.pause-indicator');
        if (pauseIndicator) {
            pauseIndicator.remove();
        }
    }

    function hideStory() {
        // Hentikan interval progress
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        // Hapus event listeners
        storyContainer.removeEventListener('mousedown', pauseStory);
        storyContainer.removeEventListener('touchstart', pauseStory);
        storyContainer.removeEventListener('mouseup', resumeStory);
        storyContainer.removeEventListener('touchend', resumeStory);
        storyContainer.removeEventListener('mouseleave', resumeStory);
        storyContainer.removeEventListener('touchcancel', resumeStory);

        // Tambahkan animasi keluar
        storyContainer.classList.add('story-exiting');

        // Tunggu animasi selesai sebelum benar-benar menyembunyikan
        setTimeout(() => {
            storyContainer.style.display = 'none';
            storyContainer.classList.remove('story-exiting');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // Tutup story jika user swipe down
    let startY;
    storyContainer.addEventListener('touchstart', function (e) {
        startY = e.touches[0].clientY;
    });

    storyContainer.addEventListener('touchmove', function (e) {
        let moveY = e.touches[0].clientY;
        let diff = moveY - startY;

        if (diff > 50) {
            hideStory();
        }
    });
});


// FUNGSI UNTUK MEMUAT HALAMAN ///
function loadPage(pageName) {
    // Ubah status active pada menu
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[onclick="loadPage('${pageName}')"]`).classList.add('active');

    // Muat konten halaman
    fetch(`pages/${pageName}.html`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('content-container').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading page:', error);
            document.getElementById('content-container').innerHTML = '<p>Error loading page</p>';
        });
}

// Load halaman default saat aplikasi dimulai
document.addEventListener('DOMContentLoaded', function () {
    loadPage('home');
});



