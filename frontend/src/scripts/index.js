document.addEventListener("DOMContentLoaded", () => {
    initialize();
});

async function initialize() {
    const loggedIn = await isUserLoggedIn();
    renderButtons(loggedIn);
    main();
}

async function isUserLoggedIn() {
    try {
        const response = await fetch('/api/check-auth');
        return response.ok;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

function renderButtons(isLoggedIn) {
    const buttonsContainer = document.getElementById('buttons_container');

    if (!buttonsContainer) {
        console.error('Buttons container not found.');
        return;
    }

    if (isLoggedIn) {
        buttonsContainer.innerHTML = `
            <button class="btn btn-secondary">
                My favorite
            </button>
        `;
    } else {
        buttonsContainer.innerHTML = `
            <button id="login_button" class="btn btn-success">Login</button>
        `;
        setupLoginButton();
    }
}

function main() {
    setupSearchForm();
    setupInfiniteScroll();
    setupLoginButton();
    setupFavoriteEvent();
}

function setupFavoriteEvent() {
    document.addEventListener("click", async (event) => {
        const favoriteButton = event.target.closest(".gallery__favorite");

        if (favoriteButton) {

            event.stopPropagation();

            const imageId = favoriteButton.dataset.imageId;
            const imageUrl = favoriteButton.dataset.imageUrl;
            const imageAuthor = favoriteButton.dataset.imageAuthor;

            if (imageId && imageUrl && imageAuthor) {
                try {
                    const response = await fetch('/api/favorites', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: imageId,
                            url: imageUrl,
                            author: imageAuthor,
                        }),
                    });

                    if (response.ok) {
                        console.log(`Image ${imageId} added to favorites successfully!`);
                    } else {
                        console.error(`Failed to add image ${imageId} to favorites.`);
                    }
                } catch (error) {
                    console.error('Error adding image to favorites:', error);
                }
            }

            return;
        }
    });


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


async function renderGallery(images) {
    const gallery = document.getElementById('gallery');

    if (gallery) {
        gallery.innerHTML = '';

        if (images.length === 0) {
            const noResultsMessage = document.createElement('p');
            noResultsMessage.className = 'no-results-message';
            noResultsMessage.textContent = 'No results found for your query.';
            gallery.appendChild(noResultsMessage);
        } else {
            const markup = await createGalleryMarkup(images);
            gallery.insertAdjacentHTML('beforeend', markup);
        }
    }
}


async function appendToGallery(images) {
    const gallery = document.getElementById('gallery');

    if (gallery) {
        const markup = await createGalleryMarkup(images);
        gallery.insertAdjacentHTML('beforeend', markup);
    }
}

async function createGalleryMarkup(images) {
    const isLoggedIn = await isUserLoggedIn();

    return images
        .map((image) => {
            const highQualityImageUrl = `${image.urls.raw}&q=80&w=1280&fit=max`;
            const starButton = isLoggedIn
                ? `<button class="btn btn-secondary gallery__favorite"
                           role="button"
                           data-image-id="${image.id}"
                           data-image-url="${highQualityImageUrl}"
                           data-image-author="${image.user.name}">
                        <i class="fa-regular fa-star"></i>
                   </button>`
                : '';

            return `
                <a href="${image.links.html}?utm_source=your_app_name&utm_medium=referral" target="_blank" class="gallery__link">
                    ${starButton}
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


