document.addEventListener("DOMContentLoaded", () => {
    main();
});

function main() {
    setupSearchForm();
}


function setupSearchForm() {
    const searchForm = document.getElementById('search_form');

    if (searchForm) {
        searchForm.onsubmit = async (e) => {
            e.preventDefault();

            const searchInput = document.getElementById('search_input');
            if (searchInput) {
                const input = searchInput.value.trim();

                if (input) {
                    try {
                        await fetchImages(input);
                        searchInput.value = '';
                    } catch (error) {
                        console.error('Failed to fetch images:', error);
                    }
                }
            }
        };
    }
}


async function handleResponse(response, onSuccess) {
    if (!response.ok) {
        const errorData = await response.json();
        throw {
            errorCode: response.status,
            errorMessage: errorData.detail || errorData.error || response.statusText || "Unknown error"
        };
    }

    if (response.headers.get('content-length') > 0) {
        const data = await response.json();
        onSuccess(data);
    } else {
        onSuccess();
    }
}

async function makeRequest(url, onSuccess) {
    try {
        const response = await fetch(url);
        await handleResponse(response, onSuccess);
    } catch (error) {
        console.error("Error during request:", error);
    }
}

async function getSecrets() {
    return new Promise((resolve, reject) => {
        makeRequest('/api/getKeys', (data) => {
            if (data) {
                console.log('Received keys data:', data);
                resolve(data);
            } else {
                reject(new Error("Failed to fetch secrets"));
            }
        });
    });
}

async function fetchImages(query) {
    try {
        const keys = await getSecrets();
        const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=10&client_id=${keys.accessKey}`;
        makeRequest(url, (data) => {
            console.log('Received data:', data);
            if (data.results) {
                renderGallery(data.results);
            }
        });
    } catch (error) {
        console.error("Error fetching images:", error);
    }
}

function renderGallery(images) {
    const gallery = document.getElementById('gallery');

    if (gallery) {
        gallery.innerHTML = '';
        const markup = createGalleryMarkup(images);
        gallery.insertAdjacentHTML('beforeend', markup);
    }
}

function createGalleryMarkup(images) {
    return images
        .map((image) => {
            const highQualityImageUrl = `${image.urls.raw}&q=80&w=1280&fit=max`; // Уменьшили ширину до 1280
            return `
            <a href="${image.links.html}?utm_source=your_app_name&utm_medium=referral" target="_blank" class="gallery__link">
                <figure class="gallery__thumb">
                    <img src="${highQualityImageUrl}" alt="Photo by ${image.user.name}" class="gallery__image">
                    <figcaption class="gallery__caption">Photo by ${image.user.name}</figcaption>
                </figure>
            </a>
            `;
        })
        .join('');
}



