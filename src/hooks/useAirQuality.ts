import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Hook for getting current air quality data
export function useAirQuality(
  lat: number | undefined,
  lon: number | undefined,
  pollutant = 'pm25'
) {
  return useQuery({
    queryKey: ['air-quality', lat, lon, pollutant],
    queryFn: () => {
      if (!lat || !lon) throw new Error('Location required');
      return api.getPollutantData(pollutant, lat, lon);
    },
    enabled: !!lat && !!lon,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    staleTime: 10 * 60 * 1000, // Consider data stale after 10 minutes
  });
}

// Hook for getting historical data
export function useHistoricalData(
  lat: number | undefined,
  lon: number | undefined,
  pollutant: string,
  days = 7
) {
  return useQuery({
    queryKey: ['historical', lat, lon, pollutant, days],
    queryFn: () => {
      if (!lat || !lon) throw new Error('Location required');
      return api.getHistoricalData(pollutant, lat, lon, days);
    },
    enabled: !!lat && !!lon,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    retry: 1,
  });
}

// Hook for getting alerts
export function useAlerts(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['alerts', lat, lon],
    queryFn: () => {
      if (!lat || !lon) throw new Error('Location required');
      return api.getAlerts(lat, lon);
    },
    enabled: !!lat && !!lon,
    refetchInterval: 5 * 60 * 1000, // Check for new alerts every 5 minutes
    staleTime: 3 * 60 * 1000,
  });
}

// Hook for getting user exposure
export function useUserExposure(userId: number, days = 7) {
  return useQuery({
    queryKey: ['user-exposure', userId, days],
    queryFn: () => api.getUserExposure(userId, days),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for getting weather data
export function useWeather(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => {
      if (!lat || !lon) throw new Error('Location required');
      return api.getWeather(lat, lon);
    },
    enabled: !!lat && !!lon,
    refetchInterval: 30 * 60 * 1000, // Refresh every 30 minutes
    staleTime: 20 * 60 * 1000,
  });
}

// Hook for TEMPO satellite data
export function useTempoData(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['tempo', lat, lon],
    queryFn: () => {
      if (!lat || !lon) throw new Error('Location required');
      return api.getTempoData(lat, lon);
    },
    enabled: !!lat && !!lon,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for AI pattern insights
export function usePatternInsights(
  lat: number | undefined,
  lon: number | undefined,
  pollutant: string,
  days = 7
) {
  return useQuery({
    queryKey: ['pattern-insights', lat, lon, pollutant, days],
    queryFn: () => {
      if (!lat || !lon) throw new Error('Location required');
      return api.getPatternInsights(pollutant, lat, lon, days);
    },
    enabled: !!lat && !!lon,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 1,
  });
}
