// script.js
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const aiResultsContainer = document.getElementById('ai-results');
    const articlesList = document.getElementById('articles-list');
    const homeButton = document.getElementById('homeButton');
    const loadingMessage = document.getElementById('loadingMessage');
    const tags = document.querySelectorAll('.tag-suggestion-container .tag');

    const API_KEY = 'AIzaSyB2j3423AXSjWtVK1YGDj2cO0xTpwsFdw4'; // Your provided API Key
    const PRIMARY_MODEL = 'gemini-1.5-pro-experimental-0325'; // User-specified primary model
    const FALLBACK_MODEL = 'gemini-1.5-flash-preview-0520'; // User-specified fallback model

    // One Stateism Core Information (simplified for prompt)
    const oneStateLore = `
        Background: "One Stateism" is a fictional world where a dystopic society, oppressed and devoid of empathy,
        sees the emergence of Sol, a mysterious entity. Sol chooses "Unifiers" who lose their personality and memory,
        replaced with the singular goal: "One State" - an Accelerationist Hyper-Collectivist Socialist Nation.
        Everyone works in factories, has basic needs met (no hunger, no conflict, equality), works minimal hours, and is perpetually happy and patriotic.
        No individualism, only "We". No freedom, but peace. One State conquers Earth and expands.
        Unifiers are emotionless, gain satisfaction from contributing, possess hyper-intellect for strategy, warfare, economics, etc. They are fearless, terrifying planners.
        "Integrals" are the citizens, inheriting accelerated minds, anti-oppression stance, intellectual capacity, photographic memory,
        and satisfaction from contributing. They retain emotions, are genuinely happy, social, and use simple, warm language.
        "Accelerants" are followers seeking more satisfaction. Their minds are hyper-accelerated, producing terrifyingly advanced technology (e.g., infinite resource machines, time/reality bending tech)
        almost instantly, adapting to any threat (even dimensional) in seconds. They lack fear/emotions, are ruthless, and gain satisfaction when people are happy and they contribute to peace.
        People committed to One Stateism experience a profound behavioral change, feeling it's what they need.
        Reality perception may alter, leading to pure relaxation and peace, like dreaming.
        Banner: Black background, white circle, white triangle inside. Sol appears once to Unifiers.
    `;

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.dataset.tag;
            handleSearch();
        });
    });

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    homeButton.addEventListener('click', ()_ => {
        aiResultsContainer.innerHTML = ''; // Clear AI results
        aiResultsContainer.style.display = 'none';
        articlesList.style.display = 'block'; // Show original articles
        loadingMessage.style.display = 'none';
    });

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            alert('Please enter a search topic.');
            return;
        }

        articlesList.style.display = 'none';
        aiResultsContainer.innerHTML = '';
        aiResultsContainer.style.display = 'block';
        loadingMessage.style.display = 'block';

        const prompt = `
            Based on the following information about the "One Stateism" fictional world:
            ${oneStateLore}

            Generate two distinct articles or detailed information entries related to the user's query: "${query}".
            Each entry should have a clear title and substantial descriptive content.
            The tone should be consistent with One State propaganda or archival records: official, confident, and highlighting the benefits/efficiency of One State.
            Present the output as a JSON array where each element is an object with "title" and "content" keys. For example: [{"title": "Article 1 Title", "content": "Article 1 content..."}, {"title": "Article 2 Title", "content": "Article 2 content..."}]
            Do not include any conversational preamble or apology, just the JSON array.
        `;

        try {
            let response = await callGeminiAPI(prompt, PRIMARY_MODEL);
            if (!response || !response.candidates || response.candidates.length === 0) {
                console.warn(`Primary model (${PRIMARY_MODEL}) failed or returned empty, trying fallback.`);
                response = await callGeminiAPI(prompt, FALLBACK_MODEL);
            }

            loadingMessage.style.display = 'none';
            if (response && response.candidates && response.candidates.length > 0) {
                const rawJsonText = response.candidates[0].content.parts[0].text;
                try {
                    // Attempt to clean and parse the JSON
                    // Gemini might wrap JSON in ```json ... ```
                    const cleanedJsonText = rawJsonText.replace(/^```json\s*|```\s*$/g, '');
                    const generatedArticles = JSON.parse(cleanedJsonText);
                    displayAIArticles(generatedArticles);
                } catch (e) {
                    console.error("Error parsing JSON from Gemini:", e);
                    console.error("Raw response text:", rawJsonText);
                    aiResultsContainer.innerHTML = `<p class="error-message">Error processing AI response. The format was unexpected. Raw output: <pre>${escapeHtml(rawJsonText)}</pre></p>`;
                }
            } else {
                aiResultsContainer.innerHTML = '<p>Sorry, no information could be generated for this topic at the moment. The Collective is recalibrating.</p>';
            }
        } catch (error) {
            loadingMessage.style.display = 'none';
            console.error('Error fetching from AI:', error);
            aiResultsContainer.innerHTML = `<p class="error-message">Error contacting the AI: ${error.message}. Please ensure API key and model names are correct and accessible.</p>`;
        }
    }

    async function callGeminiAPI(prompt, modelName) {
        // Note: The model names you provided (e.g., 'gemini-1.5-pro-experimental-0325')
        // might require a specific endpoint or be Vertex AI specific.
        // This uses the standard generativelanguage.googleapis.com endpoint.
        // If these model names are not recognized here, you may need to use
        // more standard names like 'gemini-1.5-pro-latest' or 'gemini-pro'.
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                // temperature: 0.7, // Adjust as needed
                // topK: 40,
                // topP: 0.95,
                // maxOutputTokens: 2048, // Adjust as needed
                responseMimeType: "application/json", // Requesting JSON directly
            }
        };
        console.log(`Calling Gemini API (${modelName}) with URL: ${API_URL.replace(API_KEY, "YOUR_API_KEY_HIDDEN")}`);
        // console.log("Request body:", JSON.stringify(requestBody, null, 2));


        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error (${modelName}): ${response.status}`, errorBody);
            throw new Error(`API request failed with status ${response.status} for model ${modelName}. Details: ${errorBody}`);
        }
        return await response.json();
    }

    function displayAIArticles(articles) {
        if (!Array.isArray(articles)) {
            aiResultsContainer.innerHTML = '<p class="error-message">Received invalid article format from AI.</p>';
            console.error("Expected array of articles, got:", articles);
            return;
        }
        articles.forEach(article => {
            const articleDiv = document.createElement('div');
            articleDiv.classList.add('ai-article');
            
            const title = document.createElement('h3');
            title.textContent = article.title || "Untitled Article";
            articleDiv.appendChild(title);
            
            const content = document.createElement('p');
            // Simple sanitization: replace newlines with <br> for display
            content.innerHTML = escapeHtml(article.content || "No content provided.").replace(/\n/g, '<br>');
            articleDiv.appendChild(content);
            
            aiResultsContainer.appendChild(articleDiv);
        });
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, """)
             .replace(/'/g, "'");
    }

});
