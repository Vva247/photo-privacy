const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');
let cleanImageDataUrl = null;

// 1. КЛИК ПО ЗОНЕ (открывает выбор файла)
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processImage(file);
});

// 2. ДЛЯ DRAG & DROP (чтобы браузер не открывал фото вместо загрузки)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Эффект при наведении файла
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.style.borderColor = '#007bff', false);
});
['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.style.borderColor = '#ccc', false);
});

// Перетаскивание файла в зону
dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file) processImage(file);
});

// 3. ГЛАВНАЯ ФУНКЦИЯ ОБРАБОТКИ
function processImage(file) {
    status.innerHTML = "Reading file...";
    downloadBtn.style.display = "none";

    // Проверяем наличие EXIF через библиотеку EXIF.js
    EXIF.getData(file, function() {
        const allMetaData = EXIF.getAllTags(this);
        
        if (Object.keys(allMetaData).length === 0) {
            status.innerHTML = "<b>No metadata found in this image.</b>";
            return;
        }

        const make = allMetaData.Make || "Unknown";
        const model = allMetaData.Model || "Unknown";
        const hasGPS = allMetaData.GPSLatitude ? "Yes (⚠️ Location hidden!)" : "No";

        status.innerHTML = `
            <div style="text-align: left; background: #fff3cd; padding: 10px; border-radius: 5px; margin-bottom: 15px; color: #333;">
                <strong>Found Metadata:</strong><br>
                • Device: ${make} ${model}<br>
                • Contains GPS: ${hasGPS}
            </div>
            Processing cleaning...
        `;

        // Удаляем метаданные с помощью piexif
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const originalDataUrl = event.target.result;
                cleanImageDataUrl = piexif.remove(originalDataUrl);
                
                status.innerHTML += "<br><b style='color: green;'>Success! Metadata stripped.</b>";
                downloadBtn.style.display = "block";
            } catch (err) {
                status.innerHTML = "<b style='color: red;'>Error stripping metadata.</b>";
                console.error(err);
            }
        };
        reader.readAsDataURL(file);
    });
}

// 4. СКАЧИВАНИЕ
downloadBtn.addEventListener('click', () => {
    if (!cleanImageDataUrl) return;
    const link = document.createElement('a');
    link.href = cleanImageDataUrl;
    link.download = 'privacy_clean_image.jpg';
    link.click();
});