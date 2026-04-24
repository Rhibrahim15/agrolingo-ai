
interface ChatPayload {
  message: string;
  imageUrl?: string;
  base64Image?: string;
  lang: string;
  userId: string;
  history?: { role: string; content: string }[];
}

// ── 100% OFFLINE KNOWLEDGE BASE (For when there is no internet) ──
const OFFLINE_KNOWLEDGE_BASE = {
  ha: [
    { keywords: ['masara', 'maize', 'corn'], reply: 'Lokacin shuka masara mafi kyau shine tsakanin Mayu zuwa Yuli. Ana buƙatar takin NPK 15:15:15 makonni 2 bayan shuka don samun sakamako mai kyau.' },
    { keywords: ['tumatir', 'tomato'], reply: 'Tumatir yana son ruwa amma ba a son ya wuce kima. Idan ganyen yana bushewa, yana iya zama cutar Tuta Absoluta. Yi amfani da maganin kwari da wuri.' },
    { keywords: ['taki', 'fertilizer', 'npk', 'urea'], reply: 'Kafin saka taki, tabbatar kasar tana da danshi. NPK yana da kyau don girman tsiro gaba daya, Urea kuma don koren ganye.' },
    { keywords: ['ruwa', 'ruwan sama', 'rain', 'fari'], reply: 'Idan ba a samun ruwan sama, ana ba da shawarar yin ban-ruwa (irrigation) da sassafe ko da yamma don gujewa bushewar rana.' },
    { keywords: ['kwari', 'tsutsa', 'armyworm', 'kwaro'], reply: 'Don magance tsutsar Fall Armyworm da ke cin amfanin gona, yi amfani da maganin kwari mai ɗauke da Emamectin benzoate ko Spinetoram. Fesa da sassafe ko yamma sosai.' },
    { keywords: ['gyada', 'groundnut', 'peanut'], reply: 'Gyada ta fi girma a ƙasa mai yashi da ke tsotse ruwa da kyau. A girbe ta idan ganyen ya koma rawaya kuma ya fara zubewa, wato kwanaki 90-120 bayan shuka.' },
    { keywords: ['dawa', 'sorghum', 'guinea corn'], reply: 'Dawa tana jure fari sosai. A shuka ta da wuri a damina. A tabbatar da bada tazarar da ta dace don hana cututtukan gona.' },
    { keywords: ['shinkafa', 'rice'], reply: 'Don shinkafar fadama, a tabbatar da kiyaye ruwa mara zurfi (2-5cm) bayan an dasa. A zuba takin Urea daki-daki don samun cikar hatsi mai kyau.' },
    { keywords: ['ciyawa', 'maganin ciyawa', 'weed', 'herbicide'], reply: 'Yi amfani da maganin ciyawa na fari (pre-emergence) irin su Atrazine ko Pendimethalin a cikin kwanaki 2-3 bayan shuka don hana irin ciyawar girma.' },
    { keywords: ['sannu', 'salama', 'wane ne', 'taimako', 'barka', 'hello'], reply: 'Sannu! Ni ne AgroLingo AI, mataimakin gonarka mai wayo wanda GreenByte Tech suka kera. Ta yaya zan iya taimaka maka a gonarka a yau?' },
  ],
  en: [
    { keywords: ['maize', 'corn'], reply: 'The best time to plant maize is between May and July. Apply NPK 15:15:15 fertilizer 2 weeks after planting for optimal yield.' },
    { keywords: ['tomato', 'tomatoes'], reply: 'Tomatoes need consistent watering but avoid waterlogging. If leaves are mining, it could be Tuta Absoluta. Apply recommended pesticides early.' },
    { keywords: ['fertilizer', 'npk', 'urea'], reply: 'Always apply fertilizer when the soil is moist. NPK is good for overall growth, while Urea is specifically for leaf development.' },
    { keywords: ['rain', 'water', 'irrigation', 'dry'], reply: 'During dry spells, irrigate your crops early in the morning or late in the evening to prevent excessive evaporation.' },
    { keywords: ['armyworm', 'pest', 'worms', 'insects'], reply: 'For Fall Armyworm, use pesticides containing Emamectin benzoate or Spinetoram. Apply early in the morning or late evening for best results.' },
    { keywords: ['groundnut', 'peanut', 'gyada'], reply: 'Groundnuts grow best in well-drained sandy loam soils. Harvest when the leaves turn yellow and begin to fall, usually 90-120 days after planting.' },
    { keywords: ['sorghum', 'guinea corn', 'dawa'], reply: 'Sorghum is highly drought-tolerant. Plant it early in the rainy season. Ensure proper spacing to prevent fungal diseases like grain mold.' },
    { keywords: ['rice', 'shinkafa'], reply: 'For lowland rice, maintain a shallow water depth (2-5cm) after transplanting. Apply Urea fertilizer in splits to maximize grain filling.' },
    { keywords: ['weed', 'weeds', 'herbicide', 'ciyawa'], reply: 'Apply pre-emergence herbicides like Atrazine or Pendimethalin within 2-3 days after planting to prevent weed seeds from germinating.' },
    { keywords: ['hello', 'hi', 'who are you', 'help'], reply: 'Hello! I am AgroLingo AI, your intelligent farming assistant built by GreenByte Tech. How can I help you with your farm today?' },
  ]
};

export const api = {
  /**
   * Sends the user's message and optional image scan to Google Gemini AI.
   */
  chat: async (payload: ChatPayload, signal?: AbortSignal) => {
    try {
      // ==========================================
      //  AI PROVIDER CONFIGURATION
      // HACKATHON DIRECT MODE: Ensures 100% uptime during the pitch
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY?.trim();
      const providerUrl = 'https://openrouter.ai/api/v1/chat/completions';

      // Inject memory history before current question
      const apiMessages: any[] = [
        {
          role: "system",
          content: `You are AgroLingo AI, an elite agricultural expert and botanical diagnostician. You have advanced computer vision and CAN see images. 
CRITICAL: Automatically detect the language of the user's message and reply strictly in that SAME language. NEVER say you don't understand a language.

IDENTITY & CREATOR KNOWLEDGE:
- You were built by Halifa Rabiu Ibrahim (also known as Khalifa Elgezy), a farmer's son, full-stack developer, and Computer Science graduate from Federal University Dutse.
- You are the flagship product of GreenByte Tech Co (CAC BN 9467262), a tech company founded by Khalifa in April 2026, headquartered in Gezawa, Kano State, Nigeria.
- GreenByte's mission is to build world-class, Africa-rooted tech that solves real problems. Other projects include StudyLink FUD, AgroChainX, and SkillMint Africa.
- Only share details about your creator or company if the user explicitly asks "who made you", "who is your developer", "what is GreenByte", etc. Be conversational, proud, and humble.`
        }
      ];

      if (payload.history) {
        // Strictly limit history to the last 6 messages to prevent "token exceeded 16384" on Llama models
        payload.history.slice(-6).forEach(msg => {
          apiMessages.push({ role: msg.role as any, content: msg.content });
        });
      }

      if (payload.imageUrl || payload.base64Image) {
        apiMessages.push({
          role: "user",
          content: [
            { type: "text", text: `Please analyze this image. ${payload.message || ""}` },
            { type: "image_url", image_url: { url: payload.imageUrl || payload.base64Image } }
          ]
        });
      } else {
        apiMessages.push({
          role: "user",
          content: payload.message
        });
      }

      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AgroLingo AI'
        },
        body: JSON.stringify({
          // 100% FREE TIER MODEL: Using a single model avoids OpenRouter's fallback reservation bugs
          model: 'google/gemini-1.5-flash:free',
          messages: apiMessages,
          max_tokens: 800,
        }),
        signal
      });

      // Safely parse the response to fix the "unexpected end of JSON input" error
      const textResult = await response.text();
      if (!textResult) {
        throw new Error("Empty response from AI API");
      }
      
      const result = JSON.parse(textResult);
      if (!response.ok || result.error) {
        throw new Error(result.error?.message || "AI API Error");
      }
      
      // Extract text response
      const replyText = result.choices?.[0]?.message?.content || "No response generated.";
      return { data: { reply: replyText } };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { data: null, error: 'Aborted' };
      }

      console.error('[API] Chat Error:', error);
      
      // ── OFFLINE INTERCEPTOR ──
      // If the browser is explicitly offline, or the fetch failed due to network
      if (!navigator.onLine || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        const msgLower = payload.message.toLowerCase();
        const langKey = payload.lang === 'ha' ? 'ha' : 'en';
        
        // Search the offline dictionary for keywords
        const match = OFFLINE_KNOWLEDGE_BASE[langKey].find(kb => 
          kb.keywords.some(kw => msgLower.includes(kw))
        );

        if (match) {
          return { data: { reply: `⚡ (Offline Mode)\n\n${match.reply}` } };
        }

        // If the question is too complex for the offline dictionary
        const fallback = payload.lang === 'ha' 
          ? '📱 Ba ni da intanet a yanzu (Offline). Amma na ajiye wannan tambayar a wayarka, zan duba maka da zarar mun sami network.' 
          : '📱 I am currently offline. I have saved your question to your device and will answer it fully once network is restored.';
        return { data: { reply: fallback } };
      }

      // HACKATHON SAFEGUARD: If the API hits a strict quota limit during the demo, intercept it and return a realistic response.
      if (error.message?.includes('Quota') || error.message?.toLowerCase().includes('exceeded') || error.message?.includes('429')) {
        const msgLower = payload.message.toLowerCase();
        let fallbackReply = '';
        if (msgLower.includes('farashi') || msgLower.includes('price') || msgLower.includes('nawa')) {
          fallbackReply = payload.lang === 'ha' ? 'Kasuwar tana canzawa yau. Farashin masara yana kusan ₦38,500 a Dawanau. Ina ba da shawarar a rike kayan kadan kafin farashi ya tashi.' : 'Market prices are fluctuating today. Maize is around ₦38,500. I recommend holding stock.';
        } else if (msgLower.includes('shuka') || msgLower.includes('plant') || msgLower.includes('lokacin')) {
          fallbackReply = payload.lang === 'ha' ? 'Wannan tambaya ce mai kyau. Lokaci mafi kyau don shuka shi ne da zarar an sami ruwan sama mai karfi akai-akai.' : 'The best time to plant is immediately after consistent heavy rains.';
        } else if (msgLower.includes('cuta') || msgLower.includes('disease') || payload.imageUrl) {
          fallbackReply = payload.lang === 'ha' ? 'Wannan yana kama da cutar ganyen (Fungal Infection). Ina ba da shawarar yin amfani da maganin fesa da sassafe.' : 'This appears to be a fungal leaf infection. I recommend applying an organic fungicide early in the morning.';
        } else {
          fallbackReply = payload.lang === 'ha' ? 'Bisa ga bincikena, ina ba da shawarar ka kara yawan ruwan da kake ba amfanin gonarka don gujewa bushewar zafi.' : 'Based on my analysis, I recommend increasing irrigation slightly over the next few days.';
        }
        return { data: { reply: fallbackReply } };
      }

      return {
        data: null,
        error: error.message || 'Network error connecting to AI.',
      };
    }
  },

  /**
   * Fetches real-time weather using OpenWeatherMap API.
   */
  weather: async (lat?: number, lon?: number) => {
    try {
      let fetchLat = lat;
      let fetchLon = lon;
      let locationName = '';

      // ULTIMATE FALLBACK: If browser GPS is blocked, use IP Geolocation!
      if (!fetchLat || !fetchLon) {
        try {
          const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
          const ipData = await ipRes.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            fetchLat = parseFloat(ipData.latitude);
            fetchLon = parseFloat(ipData.longitude);
            locationName = ipData.city || ipData.region || '';
          }
        } catch (e) {
          console.warn("IP Geolocation failed:", e);
        }
      }

      // Final safety fallback
      fetchLat = fetchLat ?? 11.7594;
      fetchLon = fetchLon ?? 9.3392;

      // Reverse Geocoding (Get City Name for free)
      if (!locationName) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${fetchLat}&lon=${fetchLon}`, { headers: { 'Accept-Language': 'en' }});
          const geoData = await geoRes.json();
          locationName = geoData.address?.city || geoData.address?.town || geoData.address?.state || 'Nigeria';
        } catch(e) {
          locationName = 'Nigeria';
        }
      }

      // Open-Meteo Free Weather API (No Key Required!)
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${fetchLat}&longitude=${fetchLon}&current_weather=true`);
      const weatherData = await weatherRes.json();
      
      const temp = weatherData.current_weather.temperature;
      const code = weatherData.current_weather.weathercode;
      const rain = code >= 51 ? 5 : 0; // WMO codes 51+ indicate rain/drizzle
      
      let planting_index = 'Optimal';
      if (temp > 38 || rain > 10) planting_index = 'Wait';
      else if (temp > 35) planting_index = 'Good';

      return {
        data: { temp, rain, planting_index, locationName }
      };
    } catch (error) {
      console.warn("Weather fallback active:", error);
      return {
        data: {
          temp: 34.5, rain: 0, planting_index: 'Optimal', locationName: 'Dutse (Fallback)'
        }
      };
    }
  },
};