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
        });
    } catch (error) {
        console.error("Error fetching images:", error);
    }
}

fetchImages('Horses');
