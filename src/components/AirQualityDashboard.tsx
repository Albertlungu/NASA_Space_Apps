// Example Air Quality Dashboard Component
// Shows how to use the backend integration

import { useAirQuality, useHistoricalData, useAlerts } from '@/hooks/useAirQuality';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAQIColor, getAQILevel, getAQIDescription } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MapPin, TrendingUp } from 'lucide-react';

export function AirQualityDashboard() {
  // Get user's location
  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  // Fetch air quality data
  const { data: airQualityData, isLoading: aqLoading } = useAirQuality(
    location?.lat,
    location?.lon,
    'pm25'
  );

  // Fetch historical data
  const { data: historicalData, isLoading: histLoading } = useHistoricalData(
    location?.lat,
    location?.lon,
    'pm25',
    7
  );

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading } = useAlerts(
    location?.lat,
    location?.lon
  );

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Getting your location...</p>
        </div>
      </div>
    );
  }

  const currentReading = airQualityData?.results?.[0];
  const aqi = currentReading?.aqi || 0;
  const alerts = alertsData?.alerts || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">NASA TEMPO Air Quality Monitor</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Unknown location'}
          </span>
          {locationError && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
              Using default location (NYC)
            </span>
          )}
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}</AlertTitle>
          <AlertDescription>{alerts[0].message}</AlertDescription>
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current AQI Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current AQI</CardTitle>
            <CardDescription>PM2.5 Air Quality Index</CardDescription>
          </CardHeader>
          <CardContent>
            {aqLoading ? (
              <div className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="text-6xl font-bold text-center py-4"
                  style={{ color: getAQIColor(aqi) }}
                >
                  {aqi}
                </div>
                <div className="text-center space-y-2">
                  <div
                    className="inline-block px-4 py-2 rounded-full text-white font-semibold"
                    style={{ backgroundColor: getAQIColor(aqi) }}
                  >
                    {getAQILevel(aqi)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getAQIDescription(aqi)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Readings */}
        <Card>
          <CardHeader>
            <CardTitle>Current Readings</CardTitle>
            <CardDescription>Nearby monitoring stations</CardDescription>
          </CardHeader>
          <CardContent>
            {aqLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {airQualityData?.results?.slice(0, 3).map((reading, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{reading.location || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {reading.value?.toFixed(1)} {reading.unit}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getAQIColor(reading.aqi) }}
                    >
                      {reading.aqi}
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No readings available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              7-Day Trend
            </CardTitle>
            <CardDescription>Historical air quality data</CardDescription>
          </CardHeader>
          <CardContent>
            {histLoading ? (
              <div className="animate-pulse">
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {historicalData?.data_points || 0} data points
                </p>
                {historicalData?.data && historicalData.data.length > 0 ? (
                  <div className="space-y-1">
                    {historicalData.data.slice(0, 5).map((point, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(point.timestamp).toLocaleDateString()}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: getAQIColor(point.aqi) }}
                        >
                          AQI {point.aqi}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No historical data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {!alertsLoading && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>{alerts.length} alert{alerts.length > 1 ? 's' : ''} in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{alert.pollutant.toUpperCase()} Alert</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                    style={{ backgroundColor: getAQIColor(alert.aqi) }}
                  >
                    AQI {alert.aqi}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
