document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    main();
});

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/check-auth');

        if (response.ok) {
            const userData = await response.json();
            console.log('User is logged in:', userData);
        } else {
            console.log('User is not logged in.');
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

function main() {
    setupSearchForm();
    setupInfiniteScroll();
    setupLoginButton();
}

function setupLoginButton() {
    const loginButton = document.getElementById('login_button');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = '/api/login';
        });
    }
}

let currentQuery = '';
let currentPage = 1;
let isLoading = false;

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
                        currentQuery = input;
                        currentPage = 1;
                        await fetchImages(currentQuery, currentPage);
                        searchInput.value = '';
                    } catch (error) {
                        console.error('Failed to fetch images:', error);
                    }
                }
            }
        };
    }
}


async function fetchImages(query, page) {
    if (isLoading) return;
    isLoading = true;

    try {
        const response = await fetch(`/api/search?query=${query}&page=${page}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch images: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (data.results) {
            if (data.results.length === 0) {
                renderGallery([]);
            } else {
                if (page === 1) {
                    renderGallery(data.results);
                } else {
                    appendToGallery(data.results);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching images:', error);
    } finally {
        isLoading = false;
    }
}


function renderGallery(images) {
    const gallery = document.getElementById('gallery');

    if (gallery) {
        gallery.innerHTML = '';

        if (images.length === 0) {
            const noResultsMessage = document.createElement('p');
            noResultsMessage.className = 'no-results-message';
            noResultsMessage.textContent = 'No results found for your query.';
            gallery.appendChild(noResultsMessage);
        } else {
            const markup = createGalleryMarkup(images);
            gallery.insertAdjacentHTML('beforeend', markup);
        }
    }
}


function appendToGallery(images) {
    const gallery = document.getElementById('gallery');

    if (gallery) {
        const markup = createGalleryMarkup(images);
        gallery.insertAdjacentHTML('beforeend', markup);
    }
}

function createGalleryMarkup(images) {
    return images
        .map((image) => {
            const highQualityImageUrl = `${image.urls.raw}&q=80&w=1280&fit=max`;
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

function setupInfiniteScroll() {
    let debounceTimeout;

    window.addEventListener('scroll', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.body.offsetHeight;

            if (scrollPosition > documentHeight + 40 && !isLoading && currentQuery) {
                currentPage++;
                fetchImages(currentQuery, currentPage);
            }
        }, 200);
    });
}


