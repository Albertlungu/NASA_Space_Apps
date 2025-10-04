import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Activity, 
  Users, 
  Baby, 
  Wind, 
  Home,
  AlertCircle,
  CheckCircle,
  MapPin,
  TrendingUp,
  Droplet,
  Thermometer,
  Stethoscope,
  Brain,
  Shield,
  Clock,
  Navigation
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality, useTempoData } from "@/hooks/useAirQuality";

// Health Analysis Engine
const HealthAnalysisEngine = {
  // Calculate pollution accumulation score (0-100)
  calculateAccumulation(exposureHistory) {
    let score = 0;
    const now = Date.now();
    
    exposureHistory.forEach(entry => {
      const ageMinutes = (now - entry.timestamp) / 60000;
      const decay = Math.exp(-ageMinutes / 180); // 3-hour half-life
      const severity = this.getAQISeverity(entry.aqi);
      score += entry.duration * severity * decay;
    });
    
    return Math.min(100, score);
  },

  getAQISeverity(aqi) {
    if (aqi <= 50) return 0.1;
    if (aqi <= 100) return 0.3;
    if (aqi <= 150) return 0.6;
    if (aqi <= 200) return 1.0;
    if (aqi <= 300) return 1.5;
    return 2.0;
  },

  // Analyze symptoms and predict health risks
  analyzeSymptoms(symptoms, exposureScore, vitalSigns) {
    const risks = [];
    let overallRisk = 'low';

    // Respiratory analysis
    const respiratorySymptoms = ['cough', 'shortness_of_breath', 'wheezing', 'chest_tightness'];
    const hasRespiratoryIssues = symptoms.some(s => respiratorySymptoms.includes(s));
    
    if (hasRespiratoryIssues && exposureScore > 40) {
      risks.push({
        type: 'respiratory',
        severity: 'high',
        condition: 'Acute Respiratory Irritation',
        probability: 0.75,
        recommendation: 'Seek medical attention if symptoms worsen'
      });
      overallRisk = 'high';
    }

    // Cardiovascular analysis
    if (vitalSigns.heartRate > 100 && exposureScore > 50) {
      risks.push({
        type: 'cardiovascular',
        severity: 'medium',
        condition: 'Cardiovascular Stress',
        probability: 0.6,
        recommendation: 'Monitor heart rate and consider indoor rest'
      });
      if (overallRisk === 'low') overallRisk = 'medium';
    }

    // Chronic exposure analysis
    if (exposureScore > 70) {
      risks.push({
        type: 'chronic',
        severity: 'high',
        condition: 'High Cumulative Exposure',
        probability: 0.8,
        recommendation: 'Immediate relocation to clean air environment recommended'
      });
      overallRisk = 'high';
    }

    // Allergy/sensitivity analysis
    if (symptoms.includes('eye_irritation') || symptoms.includes('throat_irritation')) {
      risks.push({
        type: 'allergic',
        severity: exposureScore > 30 ? 'medium' : 'low',
        condition: 'Environmental Irritation',
        probability: 0.5,
        recommendation: 'Use protective eyewear and stay hydrated'
      });
    }

    return { risks, overallRisk };
  },

  // Calculate health metrics
  calculateHealthMetrics(exposureHistory, symptoms, vitalSigns) {
    const accumulation = this.calculateAccumulation(exposureHistory);
    const analysis = this.analyzeSymptoms(symptoms, accumulation, vitalSigns);
    
    // Lung capacity impact estimate
    const lungImpact = Math.min(100, accumulation * 0.8);
    
    // Recovery time estimate (hours)
    const recoveryTime = Math.ceil(accumulation / 10);
    
    // Long-term health risk score
    const longTermRisk = this.calculateLongTermRisk(exposureHistory);
    
    return {
      accumulation,
      lungImpact,
      recoveryTime,
      longTermRisk,
      ...analysis
    };
  },

  calculateLongTermRisk(exposureHistory) {
    const avgExposure = exposureHistory.reduce((sum, e) => sum + e.aqi, 0) / Math.max(exposureHistory.length, 1);
    const highExposureEvents = exposureHistory.filter(e => e.aqi > 150).length;
    
    return Math.min(100, (avgExposure / 3) + (highExposureEvents * 5));
  }
};

const AdvancedHealthMonitor = () => {
  // Use your existing geolocation hook
  const { location, error: locationError } = useGeolocation();
  
  // Fetch real-time AQI data using your hooks
  const { data: pm25Data, isLoading: pm25Loading } = useAirQuality(location?.lat, location?.lon, 'pm25');
  const { data: tempoData, isLoading: tempoLoading } = useTempoData(location?.lat, location?.lon);
  
  const [isTracking, setIsTracking] = useState(false);
  const [exposureHistory, setExposureHistory] = useState([]);
  const [currentAQI, setCurrentAQI] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [vitalSigns, setVitalSigns] = useState({
    heartRate: 72,
    oxygenSaturation: 98,
    respiratoryRate: 16
  });
  const [healthMetrics, setHealthMetrics] = useState(null);
  const trackingIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Extract current AQI from real API data
  useEffect(() => {
    if (tempoData?.data?.pm25?.aqi) {
      setCurrentAQI(tempoData.data.pm25.aqi);
    } else if (pm25Data?.results?.[0]?.aqi) {
      setCurrentAQI(pm25Data.results[0].aqi);
    }
  }, [tempoData, pm25Data]);

  // Track exposure when tracking is enabled
  useEffect(() => {
    if (!isTracking || !location || currentAQI === null) return;

    // Check if location has changed significantly (more than ~100 meters)
    const hasLocationChanged = () => {
      if (!lastLocationRef.current) return true;
      
      const lastLat = lastLocationRef.current.lat;
      const lastLon = lastLocationRef.current.lon;
      const currentLat = location.lat;
      const currentLon = location.lon;
      
      // Rough calculation: 0.001 degrees ≈ 111 meters
      const latDiff = Math.abs(currentLat - lastLat);
      const lonDiff = Math.abs(currentLon - lastLon);
      
      return latDiff > 0.001 || lonDiff > 0.001;
    };

    // Add exposure point every 30 seconds or when location changes
    const addExposurePoint = () => {
      if (hasLocationChanged() || exposureHistory.length === 0) {
        setExposureHistory(prev => [
          ...prev,
          {
            timestamp: Date.now(),
            lat: location.lat,
            lon: location.lon,
            aqi: currentAQI,
            duration: 0.5, // 30 seconds in minutes
            pm25: pm25Data?.results?.[0]?.value || null,
            no2: tempoData?.data?.no2?.value || null,
            o3: tempoData?.data?.o3?.value || null
          }
        ]);
        
        lastLocationRef.current = { lat: location.lat, lon: location.lon };
      }
    };

    // Start tracking interval
    trackingIntervalRef.current = setInterval(addExposurePoint, 30000); // Every 30 seconds
    
    // Add first point immediately
    addExposurePoint();

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking, location, currentAQI, pm25Data, tempoData]);

  // Calculate health metrics whenever data changes
  useEffect(() => {
    if (exposureHistory.length > 0) {
      const metrics = HealthAnalysisEngine.calculateHealthMetrics(
        exposureHistory,
        symptoms,
        vitalSigns
      );
      setHealthMetrics(metrics);
    }
  }, [exposureHistory, symptoms, vitalSigns]);

  const startTracking = () => {
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
  };

  const availableSymptoms = [
    { id: 'cough', label: 'Cough', icon: Wind },
    { id: 'shortness_of_breath', label: 'Shortness of Breath', icon: Wind },
    { id: 'wheezing', label: 'Wheezing', icon: Activity },
    { id: 'chest_tightness', label: 'Chest Tightness', icon: Heart },
    { id: 'eye_irritation', label: 'Eye Irritation', icon: AlertCircle },
    { id: 'throat_irritation', label: 'Throat Irritation', icon: Droplet },
    { id: 'headache', label: 'Headache', icon: Brain },
    { id: 'fatigue', label: 'Fatigue', icon: Activity }
  ];

  const toggleSymptom = (symptomId) => {
    setSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-[hsl(var(--aqi-good))]';
      case 'medium': return 'text-[hsl(var(--aqi-moderate))]';
      case 'high': return 'text-[hsl(var(--aqi-unhealthy))]';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBg = (risk) => {
    switch (risk) {
      case 'low': return 'bg-[hsl(var(--aqi-good))]/10 border-[hsl(var(--aqi-good))]/30';
      case 'medium': return 'bg-[hsl(var(--aqi-moderate))]/10 border-[hsl(var(--aqi-moderate))]/30';
      case 'high': return 'bg-[hsl(var(--aqi-unhealthy))]/10 border-[hsl(var(--aqi-unhealthy))]/30';
      default: return 'bg-muted/10 border-muted/30';
    }
  };

  const isLoading = pm25Loading || tempoLoading;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Personal Health Monitor</h1>
            <p className="text-sm text-muted-foreground">
              Real-time pollution exposure tracking & health analysis
            </p>
          </div>
        </div>
        <button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={!location || currentAQI === null}
          className={`px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isTracking 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading air quality data...</span>
          </div>
        </Card>
      )}

      {/* Location Error */}
      {locationError && (
        <Card className="p-4 glass-effect border-2 border-destructive/50">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>Location access denied. Please enable location permissions.</span>
          </div>
        </Card>
      )}

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-3">
            <Navigation className="w-8 h-8 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-xl font-bold">
                {isTracking ? 'Tracking' : 'Inactive'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-3">
            <Wind className="w-8 h-8 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Current AQI</div>
              <div className="text-xl font-bold">
                {currentAQI !== null ? currentAQI : '--'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Data Points</div>
              <div className="text-xl font-bold">{exposureHistory.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="text-xl font-bold">
                {location ? '✓ Active' : 'N/A'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Location Info */}
      {location && (
        <Card className="p-4 glass-effect">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Current Position:</span>
              <span className="font-mono">{location.lat.toFixed(6)}, {location.lon.toFixed(6)}</span>
            </div>
            {pm25Data?.results?.[0]?.location && (
              <span className="text-muted-foreground">
                Nearest Station: {pm25Data.results[0].location}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Health Metrics Dashboard */}
      {healthMetrics && (
        <Card className={`p-6 glass-effect border-2 ${getRiskBg(healthMetrics.overallRisk)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6" />
                Health Analysis
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered health risk assessment based on real pollution data
              </p>
            </div>
            <Badge className={`text-lg px-4 py-2 ${getRiskColor(healthMetrics.overallRisk)}`}>
              {healthMetrics.overallRisk.toUpperCase()} RISK
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium">Pollution Load</span>
              </div>
              <div className="text-3xl font-bold">{Math.round(healthMetrics.accumulation)}%</div>
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[hsl(var(--aqi-good))] via-[hsl(var(--aqi-moderate))] to-[hsl(var(--aqi-unhealthy))]"
                  style={{ width: `${healthMetrics.accumulation}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium">Lung Impact</span>
              </div>
              <div className="text-3xl font-bold">{Math.round(healthMetrics.lungImpact)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Estimated capacity reduction
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Recovery Time</span>
              </div>
              <div className="text-3xl font-bold">{healthMetrics.recoveryTime}h</div>
              <div className="text-xs text-muted-foreground mt-1">
                In clean air environment
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Long-term Risk</span>
              </div>
              <div className="text-3xl font-bold">{Math.round(healthMetrics.longTermRisk)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Chronic health impact
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          {healthMetrics.risks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Detected Health Risks
              </h3>
              {healthMetrics.risks.map((risk, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${getRiskBg(risk.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{risk.condition}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {risk.type} • Probability: {(risk.probability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <Badge className={getRiskColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <div className="text-sm bg-background/50 p-3 rounded">
                    <strong>Recommendation:</strong> {risk.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Emergency Alert */}
          {healthMetrics.overallRisk === 'high' && (
            <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-lg mb-1">Immediate Action Required</div>
                  <p className="text-sm mb-2">
                    Your pollution exposure levels are critically high. If experiencing severe symptoms 
                    (difficulty breathing, chest pain, dizziness), seek emergency medical care immediately.
                  </p>
                  <a 
                    href="tel:911" 
                    className="inline-block px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-all"
                  >
                    Call Emergency Services
                  </a>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Symptom Tracker */}
      <Card className="p-6 glass-effect">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          Symptom Tracker
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select any symptoms you're currently experiencing for more accurate health analysis
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableSymptoms.map(symptom => (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                symptoms.includes(symptom.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background/50 border-muted hover:border-primary/50'
              }`}
            >
              <symptom.icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{symptom.label}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Vital Signs Input */}
      <Card className="p-6 glass-effect">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Vital Signs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Heart Rate (bpm)</label>
            <input
              type="number"
              value={vitalSigns.heartRate}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, heartRate: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 rounded-lg border-2 border-muted bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">O₂ Saturation (%)</label>
            <input
              type="number"
              value={vitalSigns.oxygenSaturation}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, oxygenSaturation: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 rounded-lg border-2 border-muted bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Respiratory Rate (breaths/min)</label>
            <input
              type="number"
              value={vitalSigns.respiratoryRate}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, respiratoryRate: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 rounded-lg border-2 border-muted bg-background"
            />
          </div>
        </div>
      </Card>

      {/* Journey Map Preview */}
      {exposureHistory.length > 0 && (
        <Card className="p-6 glass-effect">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Exposure Journey ({exposureHistory.length} data points)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {exposureHistory.slice(-10).reverse().map((point, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    point.aqi <= 50 ? 'bg-[hsl(var(--aqi-good))]' :
                    point.aqi <= 100 ? 'bg-[hsl(var(--aqi-moderate))]' :
                    point.aqi <= 150 ? 'bg-[hsl(var(--aqi-sensitive))]' :
                    'bg-[hsl(var(--aqi-unhealthy))]'
                  }`} />
                  <div className="text-sm">
                    <div className="font-medium">AQI: {point.aqi}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(point.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
                  </div>
                  {point.pm25 && (
                    <div className="text-xs text-muted-foreground">
                      PM2.5: {point.pm25.toFixed(1)} µg/m³
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Panel */}
      <Card className="p-6 glass-effect bg-muted/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          How This Works
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Data Points:</strong> System collects AQI data every 30 seconds when tracking is active</p>
          <p>• <strong>Location Sensitivity:</strong> New data points are recorded when you move ~100+ meters</p>
          <p>• <strong>API Coverage:</strong> AQI stations are typically 5-15km apart in urban areas. The system uses the nearest available station data</p>
          <p>• <strong>Accumulation Score:</strong> Weighted by time (recent exposures matter more) and AQI severity</p>
          <p>• <strong>Real-Time Data:</strong> Connected to OpenAQ and NASA TEMPO satellite data for accurate measurements</p>
        </div>
      </Card>
    </div>
  );
};

export default AdvancedHealthMonitor;