export async function getRandomGif(keyword) {
    const apiKey = process.env.GIPHY_API_KEY;
    const url = `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}&tag=${keyword}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.data.images.original.url;
    } catch (error) {
        console.error('Error fetching GIF:', error);
        return null;
    }
}

export async function getRandomGif2(keyword) {
    const apiKey = process.env.KLIPY_API_KEY;
    const url = `https://api.klipy.com/api/v1/${apiKey}/gifs/search?page=1&per_page=50&q=${keyword}&customer_id=discord&locale=US&content_filter=medium`;
    
    let min = 0;
    let max = 49;
    let random = Math.floor(Math.random() * (max - min + 1)) + min;
    try {
        const response = await fetch(url);
        const data = await response.json();
        //console.log(data.data.data[random].file.hd);
        return data.data.data[random].file.md.gif.url;
    } catch (error) {
        console.error('Error fetching GIF:', error);
        return null;
    }
}


