document.addEventListener("DOMContentLoaded", () => {
    renderFavorites();
});

async function renderFavorites() {
    const favoritesGallery = document.getElementById('favorites_gallery');

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (favorites.length === 0) {
        favoritesGallery.innerHTML = '<p>No favorites found.</p>';
    } else {
        const galleryMarkup = await createGalleryMarkup(favorites);
        favoritesGallery.innerHTML = galleryMarkup;
    }
}

async function createGalleryMarkup(images) {
    return images
        .map((image) => {
            return `
                <div class="gallery__item">
                    <a href="${image.url}" target="_blank" class="gallery__link">
                        <figure class="gallery__thumb">
                            <img src="${image.url}" alt="Photo by ${image.author}" class="gallery__image">
                            <figcaption class="gallery__caption">Photo by ${image.author}</figcaption>
                        </figure>
                    </a>
                </div>
            `;
        })
        .join('');
}
