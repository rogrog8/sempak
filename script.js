// --- STATE MANAGEMENT ---
let dataSKP = [];
let dataPrestasi = [];

// --- DATABASE BATASAN & NILAI DASAR ---
const NILAI_DASAR_JABATAN = { "Asisten Ahli": 150, "Lektor": 200, "Lektor Kepala": 400, "Profesor": 850 };
const KOEFISIEN_JABATAN = { "Asisten Ahli": 12.5, "Lektor": 25, "Lektor Kepala": 37.5, "Profesor": 50 };

const MAX_TAHUNAN_TOTAL = { "Asisten Ahli": 40, "Lektor": 80, "Lektor Kepala": 120, "Profesor": 160 };
const MAX_SKP_TAHUNAN = { "Asisten Ahli": 18.75, "Lektor": 37.5, "Lektor Kepala": 56.25, "Profesor": 75 };
const ABSOLUT_MAX_PRESTASI = { "Asisten Ahli": 27.5, "Lektor": 55, "Lektor Kepala": 82.5, "Profesor": 110 };

// --- NAVIGASI SPA ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-links a, .sub-menu a').forEach(link => link.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`nav-${tabId}`).classList.add('active');

    if(tabId === 'dashboard') updateDashboard();
}

// --- LOGIKA PENGANGKATAN PERTAMA ---
function hitungPengangkatan() {
    const koefisien = parseFloat(document.getElementById('peng-jabatan').value);
    const bln1 = parseFloat(document.getElementById('peng-bulan1').value) || 0;
    const pred1 = parseFloat(document.getElementById('peng-predikat1').value);
    const bln2 = parseFloat(document.getElementById('peng-bulan2').value) || 0;
    const pred2 = parseFloat(document.getElementById('peng-predikat2').value);
    
    const ak1 = (bln1 / 12) * pred1 * koefisien;
    const ak2 = (bln2 / 12) * pred2 * koefisien;
    const totalAk = ak1 + ak2;
    
    const resultBox = document.getElementById('peng-result');
    resultBox.style.display = 'block'; 
    resultBox.innerHTML = `
        <h3 style="color: var(--primary); margin-bottom: 1rem; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.5rem;">Rincian PAK CPNS</h3>
        <div class="result-item"><span>Periode 1:</span><strong>${ak1.toFixed(2)} AK</strong></div>
        <div class="result-item"><span>Periode 2:</span><strong>${ak2.toFixed(2)} AK</strong></div>
        <hr><div class="result-item highlight"><span>Total AK (PAK CPNS):</span><span>${totalAk.toFixed(2)} AK</span></div>
    `;
}

// --- LOGIKA SKP & PENDIDIKAN DENGAN VALIDASI ---
function tambahSKP() {
    const tahun = document.getElementById('skp-tahun').value;
    const predikatVal = parseFloat(document.getElementById('skp-predikat').value);
    const predikatText = document.getElementById('skp-predikat').options[document.getElementById('skp-predikat').selectedIndex].text;
    const jabatanSaatIni = document.getElementById('dash-jabatan').value;

    if(!tahun) return alert("Masukkan tahun penilaian!");

    const isTahunAda = dataSKP.some(item => item.tahun === tahun && item.isPendidikan === false);
    if (isTahunAda) {
        return alert(`GAGAL: Predikat Kinerja (SKP) untuk tahun ${tahun} sudah ditambahkan sebelumnya.`);
    }

    const akDidapat = KOEFISIEN_JABATAN[jabatanSaatIni] * predikatVal;
    dataSKP.push({ id: Date.now(), tahun, predikatText, akDidapat, isPendidikan: false });
    renderTableSKP();
}

function tambahPendidikan() {
    const tahun = document.getElementById('pend-tahun').value;
    const jabatanSaatIni = document.getElementById('dash-jabatan').value;
    
    if(!tahun) return alert("Masukkan tahun kelulusan/ijazah!");
    
    const isPendidikanAda = dataSKP.some(item => item.isPendidikan === true);
    if (isPendidikanAda) {
        return alert("GAGAL: Tambahan AK Peningkatan Pendidikan hanya dapat dimasukkan 1 (satu) kali.");
    }
    
    const akDidapat = KOEFISIEN_JABATAN[jabatanSaatIni];
    dataSKP.push({ 
        id: Date.now(), 
        tahun: tahun, 
        predikatText: "Peningkatan Pendidikan (Ijazah S2/S3)", 
        akDidapat: akDidapat,
        isPendidikan: true 
    });
    renderTableSKP();
}

function hapusSKP(id) { dataSKP = dataSKP.filter(item => item.id !== id); renderTableSKP(); }

function renderTableSKP() {
    const tbody = document.getElementById('table-skp');
    tbody.innerHTML = '';
    dataSKP.forEach(item => {
        const badge = item.isPendidikan ? '<span style="margin-left:8px; background:#DCFCE7; color:#166534; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">Ijazah</span>' : '';
        tbody.innerHTML += `<tr><td>${item.tahun}</td><td>${item.predikatText} ${badge}</td><td><strong>${item.akDidapat.toFixed(2)}</strong></td><td><button class="btn-danger" onclick="hapusSKP(${item.id})">Hapus</button></td></tr>`;
    });
    updateDashboard();
}

// --- LOGIKA PRESTASI ---
function tambahPrestasi() {
    const tahun = document.getElementById('pres-tahun').value;
    const judul = document.getElementById('pres-judul').value || "Karya Ilmiah/Publikasi";
    const maksAK = parseFloat(document.getElementById('pres-kategori').value);
    const kategoriText = document.getElementById('pres-kategori').options[document.getElementById('pres-kategori').selectedIndex].text;
    const jmlPenulis = parseInt(document.getElementById('pres-jml-penulis').value);
    const kodePeran = document.getElementById('pres-peran').value;
    
    if(!tahun) return alert("Tahun publikasi wajib diisi!");
    if(jmlPenulis < 1) return alert("Jumlah penulis minimal 1 orang.");

    let persentase = 0;
    let labelPeranDetail = "";

    // LOGIKA PERHITUNGAN AK BERDASARKAN PERAN & JUMLAH PENULIS
    if (jmlPenulis === 1 || kodePeran === 'TUNGGAL') {
        persentase = 1.0;
        labelPeranDetail = "Penulis Tunggal (100%)";
    } 
    else {
        // Jika Penulis > 1
        if (kodePeran === 'PERTAMA_DAN_KORES') { 
            persentase = 0.60; 
            labelPeranDetail = "Penulis 1 & Kores (60%)"; 
        }
        else if (kodePeran === 'PERTAMA_SAJA') { 
            persentase = 0.40; 
            labelPeranDetail = "Penulis 1 (40%)"; 
        }
        else if (kodePeran === 'KORES_SAJA') { 
            persentase = 0.40; 
            labelPeranDetail = "Penulis Kores (40%)"; 
        }
        else if (kodePeran === 'ANGGOTA_A') { 
            // Anggota jika Penulis 1 merangkap Kores (Sisa 40% dibagi rata ke semua anggota)
            const jumlahAnggota = jmlPenulis - 1;
            persentase = 0.40 / jumlahAnggota; 
            labelPeranDetail = `Anggota Tipe A (${(persentase*100).toFixed(1)}%)`; 
        }
        else if (kodePeran === 'ANGGOTA_B') { 
            // Anggota jika Penulis 1 TIDAK merangkap Kores (Sisa 20% dibagi rata ke semua anggota selain P1 & Kores)
            const jumlahAnggotaSelainP1Kores = jmlPenulis - 2;
            if (jumlahAnggotaSelainP1Kores > 0) {
                persentase = 0.20 / jumlahAnggotaSelainP1Kores;
            } else {
                persentase = 0; // Kasus tidak valid jika hanya 2 penulis tapi pilih tipe B
            }
            labelPeranDetail = `Anggota Tipe B (${(persentase*100).toFixed(1)}%)`; 
        }
    }

    const akDidapat = maksAK * persentase;
    dataPrestasi.push({ id: Date.now(), tahun, judul, kategoriText, peranText: labelPeranDetail, akDidapat });
    renderTablePrestasi();
}

function hapusPrestasi(id) { dataPrestasi = dataPrestasi.filter(item => item.id !== id); renderTablePrestasi(); }

function renderTablePrestasi() {
    const tbody = document.getElementById('table-prestasi');
    tbody.innerHTML = '';
    dataPrestasi.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.tahun}</td><td>${item.judul}</td><td>${item.kategoriText}</td><td>${item.peranText}</td><td><strong>${item.akDidapat.toFixed(2)}</strong></td><td><button class="btn-danger" onclick="hapusPrestasi(${item.id})">Hapus</button></td></tr>`;
    });
    updateDashboard();
}

// --- LOGIKA UTAMA: AUTO BASE AK + VALIDASI TABEL BKN ---
function updateDashboard() {
    const akIntegrasi = parseFloat(document.getElementById('dash-ak-integrasi').value) || 0;
    const targetAK = parseFloat(document.getElementById('dash-target').value);
    const jabatanSaatIni = document.getElementById('dash-jabatan').value;
    
    const nilaiDasarJabatan = NILAI_DASAR_JABATAN[jabatanSaatIni];
    const batasTahunanMaks = MAX_TAHUNAN_TOTAL[jabatanSaatIni];
    const batasMaksSKP = MAX_SKP_TAHUNAN[jabatanSaatIni];
    const batasMaksPrestasi = ABSOLUT_MAX_PRESTASI[jabatanSaatIni];
    
    let rekapTahunan = {};
    dataSKP.forEach(item => {
        if(!rekapTahunan[item.tahun]) rekapTahunan[item.tahun] = { skpNormal: 0, pendidikan: 0, prestasi: 0 };
        if(item.isPendidikan) { rekapTahunan[item.tahun].pendidikan += item.akDidapat; } 
        else { rekapTahunan[item.tahun].skpNormal += item.akDidapat; }
    });
    dataPrestasi.forEach(item => {
        if(!rekapTahunan[item.tahun]) rekapTahunan[item.tahun] = { skpNormal: 0, pendidikan: 0, prestasi: 0 };
        rekapTahunan[item.tahun].prestasi += item.akDidapat;
    });

    let totalAK_SKP_Diakui = 0;
    let totalAK_Prestasi_Diakui = 0;
    let rincianPemotongan = [];

    for (const tahun in rekapTahunan) {
        let inputSKP = rekapTahunan[tahun].skpNormal;
        let inputPendidikan = rekapTahunan[tahun].pendidikan;
        let inputPres = rekapTahunan[tahun].prestasi;

        let skpDiakui = Math.min(inputSKP, batasMaksSKP);
        if (inputSKP > batasMaksSKP) {
            rincianPemotongan.push(`Thn ${tahun}: SKP (${inputSKP.toFixed(2)}) melampaui batas maks.`);
        }

        let totalSKPGabungan = skpDiakui + inputPendidikan;
        let sisaKuotaTahunan = batasTahunanMaks - skpDiakui;
        let batasPrestasiTahunIni = Math.min(sisaKuotaTahunan, batasMaksPrestasi); 
        let prestasiDiakui = Math.min(inputPres, batasPrestasiTahunIni);
        
        if (inputPres > batasPrestasiTahunIni) {
            rincianPemotongan.push(`Thn ${tahun}: Prestasi (${inputPres.toFixed(2)}) dipotong sesuai sisa kuota.`);
        }

        totalAK_SKP_Diakui += totalSKPGabungan;
        totalAK_Prestasi_Diakui += prestasiDiakui;
    }

    const totalTambahanBaru = totalAK_SKP_Diakui + totalAK_Prestasi_Diakui;
    const totalAkumulasi = nilaiDasarJabatan + akIntegrasi + totalTambahanBaru;
    const kekurangan = targetAK - totalAkumulasi;

    // --- PERBAIKAN 2: SINKRONISASI PROGRESS BAR ---
    const persentaseProgress = Math.min((totalAkumulasi / targetAK) * 100, 100);
    const progressBar = document.getElementById('dashboard-progress');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
        progressBar.style.width = persentaseProgress + '%';
    }
    if (progressText) {
        progressText.innerText = persentaseProgress.toFixed(1) + '% Menuju Target';
    }

    document.getElementById('sum-skp').innerText = totalAK_SKP_Diakui.toFixed(2);
    document.getElementById('sum-prestasi').innerText = totalAK_Prestasi_Diakui.toFixed(2);

    let pesanPotongan = rincianPemotongan.length > 0 ? 
        `<div style="background:#FEF2F2; color:#991B1B; padding:12px; border-radius:6px; font-size:0.85rem; margin-bottom:1.5rem; border-left:4px solid #EF4444;">
        <strong>⚠️ Peringatan: Ada pemotongan AK sesuai aturan:</strong>
        <ul style="margin-top:5px; margin-left:20px;">${rincianPemotongan.map(msg => `<li>${msg}</li>`).join('')}</ul></div>` : "";

    const htmlRincian = `
        <div style="background: #F8FAFC; padding: 10px 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #E2E8F0;">
            <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 5px;">Rincian Perolehan Angka Kredit:</p>
            <ul style="font-size: 0.85rem; color: #4B5563; list-style-type: none; padding-left: 0; margin-bottom: 0;">
                <li style="display: flex; justify-content: space-between; margin-bottom: 3px;"><span>• AK Dasar (${jabatanSaatIni})</span> <span><strong>${nilaiDasarJabatan}</strong></span></li>
                <li style="display: flex; justify-content: space-between; margin-bottom: 3px;"><span>• AK Integrasi</span> <span><strong>${akIntegrasi.toFixed(2)}</strong></span></li>
                <li style="display: flex; justify-content: space-between; margin-bottom: 3px;"><span>• Tambahan Baru (SKP + Prestasi)</span> <span><strong>+ ${totalTambahanBaru.toFixed(2)}</strong></span></li>
                <li style="display: flex; justify-content: space-between; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #CBD5E1; font-weight: bold; color: var(--primary);"><span>TOTAL AKUMULASI</span> <span>${totalAkumulasi.toFixed(2)}</span></li>
            </ul>
        </div>
    `;

    const resultBoard = document.getElementById('final-result');
    if (kekurangan <= 0) {
        resultBoard.innerHTML = pesanPotongan + `
            <h3 style="color: var(--secondary);">🎉 Memenuhi Syarat!</h3>
            ${htmlRincian}
        `;
    } else {
        resultBoard.innerHTML = pesanPotongan + `
            <h3>Status: Belum Memenuhi</h3>
            ${htmlRincian}
            <p style="color: var(--danger); font-weight: 600; margin-top: 10px;">Kekurangan: ${kekurangan.toFixed(2)} AK</p>
        `;
    }
}

// --- FUNGSI HIDE/SHOW SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.getElementById('mySidebar');
    const mainContent = document.querySelector('.main-content');
    if (window.innerWidth > 768) {
        sidebar.classList.toggle('hidden');
        mainContent.classList.toggle('full-width');
    } else {
        sidebar.classList.toggle('active');
    }
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.getElementById('mySidebar').classList.remove('active');
        }
    });
});

updateDashboard();