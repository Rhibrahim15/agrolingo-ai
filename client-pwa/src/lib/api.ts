import { supabase } from './supabase';

interface ChatPayload {
  message: string;
  imageUrl?: string;
  base64Image?: string;
  lang: string;
  userId: string;
  history?: { role: string; content: string }[];
}

interface ForecastDay {
  date: string;
  temperatureMax: number;
  precipitationProbability: number;
  weatherCode: number;
}

interface WeatherData {
  temp: number;
  rain: number;
  windSpeed: number;
  weatherCode: number;
  planting_index: 'Unavailable';
  locationName: string;
  forecast: ForecastDay[];
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (response.status === 401) return 'Your session has expired. Please sign in again.';
    if (response.status === 429) return 'The service is busy. Please wait and try again.';
    if (response.status >= 500) return 'The agricultural assistant is temporarily unavailable.';
    return typeof body?.error === 'string' && body.error.length < 180
      ? body.error
      : 'The request could not be completed.';
  } catch {
    return response.status >= 500
      ? 'The service is temporarily unavailable.'
      : 'The request could not be completed.';
  }
}

export const api = {
  chat: async (payload: ChatPayload, signal?: AbortSignal) => {
    const message = payload.message.trim();
    if (!message && !payload.imageUrl && !payload.base64Image) {
      return { data: null, error: 'Enter a question before sending.' };
    }
    if (message.length > 4_000) {
      return { data: null, error: 'Your question is too long. Please shorten it and try again.' };
    }
    if (!apiBaseUrl) {
      return { data: null, error: 'The agricultural assistant is not configured right now.' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { data: null, error: 'Please sign in to use Ask AgroLingo.' };
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          lang: ['ha', 'en', 'fr'].includes(payload.lang) ? payload.lang : 'en',
          history: payload.history?.slice(-10),
          imageUrl: payload.imageUrl,
          base64Image: payload.base64Image,
        }),
        signal,
      });

      if (!response.ok) return { data: null, error: await parseError(response) };
      const data = await response.json();
      const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (!reply) return { data: null, error: 'The assistant returned an empty response. Please try again.' };
      return { data: { reply }, error: null };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { data: null, error: 'Aborted' };
      }
      return {
        data: null,
        error: navigator.onLine
          ? 'Unable to reach the agricultural assistant. Please try again.'
          : 'You are offline. Reconnect to request new agricultural guidance.',
      };
    }
  },

  weather: async (lat?: number, lon?: number): Promise<{ data: WeatherData | null; error: string | null }> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { data: null, error: 'Location permission is required for local weather.' };
    }

    try {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: 'temperature_2m,precipitation,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,precipitation_probability_max',
        forecast_days: '7',
        timezone: 'auto',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error('Weather request failed');
      const body = await response.json();
      const current = body?.current;
      const daily = body?.daily;
      if (!current || !Array.isArray(daily?.time)) throw new Error('Weather response was incomplete');

      const forecast: ForecastDay[] = daily.time.map((date: string, index: number) => ({
        date,
        temperatureMax: Number(daily.temperature_2m_max?.[index]),
        precipitationProbability: Number(daily.precipitation_probability_max?.[index] ?? 0),
        weatherCode: Number(daily.weather_code?.[index] ?? 0),
      })).filter((day: ForecastDay) => Number.isFinite(day.temperatureMax));

      return {
        data: {
          temp: Number(current.temperature_2m),
          rain: Number(current.precipitation ?? 0),
          windSpeed: Number(current.wind_speed_10m ?? 0),
          weatherCode: Number(current.weather_code ?? 0),
          // A planting recommendation requires crop, soil, season and forecast context.
          planting_index: 'Unavailable',
          locationName: 'Current location',
          forecast,
        },
        error: null,
      };
    } catch {
      return { data: null, error: 'Weather information is temporarily unavailable.' };
    }
  },
};
