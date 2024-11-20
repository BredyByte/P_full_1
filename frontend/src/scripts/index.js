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


makeRequest('/api/getKeys', (data) => {
    console.log('Received data:', data);
});
