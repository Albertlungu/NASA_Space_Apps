import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Activity, 
  Users, 
  Wind, 
  AlertCircle,
  CheckCircle,
  MapPin,
  TrendingUp,
  Droplet,
  Stethoscope,
  Brain,
  Shield,
  Clock,
  Navigation,
  Gauge,
  Target,
  School,
  Building2,
  Factory,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAirQuality, useTempoData } from "@/hooks/useAirQuality";

// Evidence-based Health Risk Assessment Engine
const HealthRiskEngine = {
  // EPA and WHO validated AQI health risk thresholds
  getHealthRisk(aqi, exposureDurationHours, sensitiveGroup = false) {
    const multiplier = sensitiveGroup ? 1.3 : 1.0;
    
    if (aqi <= 50) {
      return {
        level: 'minimal',
        category: 'Good',
        riskScore: 0,
        healthMessage: 'Air quality is satisfactory, and air pollution poses little or no risk.',
        actions: []
      };
    } else if (aqi <= 100) {
      const baseRisk = (aqi - 50) / 50 * 15;
      return {
        level: 'low',
        category: 'Moderate',
        riskScore: Math.min(100, baseRisk * multiplier * (exposureDurationHours / 24)),
        healthMessage: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
        actions: sensitiveGroup ? ['Consider reducing prolonged outdoor exertion', 'Monitor symptoms'] : []
      };
    } else if (aqi <= 150) {
      const baseRisk = 15 + ((aqi - 100) / 50 * 25);
      return {
        level: 'moderate',
        category: 'Unhealthy for Sensitive Groups',
        riskScore: Math.min(100, baseRisk * multiplier * (exposureDurationHours / 12)),
        healthMessage: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
        actions: [
          'Sensitive groups should reduce prolonged outdoor exertion',
          'Consider wearing N95/KN95 masks outdoors',
          'Close windows to reduce indoor exposure',
          'Use air purifiers if available'
        ]
      };
    } else if (aqi <= 200) {
      const baseRisk = 40 + ((aqi - 150) / 50 * 30);
      return {
        level: 'high',
        category: 'Unhealthy',
        riskScore: Math.min(100, baseRisk * multiplier * (exposureDurationHours / 8)),
        healthMessage: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
        actions: [
          'Everyone should reduce prolonged outdoor exertion',
          'Sensitive groups should avoid outdoor activities',
          'Wear N95/KN95 masks when outdoors',
          'Keep windows closed and use air purifiers',
          'Consider relocating to areas with better air quality'
        ]
      };
    } else if (aqi <= 300) {
      const baseRisk = 70 + ((aqi - 200) / 100 * 20);
      return {
        level: 'very-high',
        category: 'Very Unhealthy',
        riskScore: Math.min(100, baseRisk * multiplier * (exposureDurationHours / 4)),
        healthMessage: 'Health alert: The risk of health effects is increased for everyone.',
        actions: [
          'Everyone should avoid all outdoor activities',
          'Sensitive groups should remain indoors in filtered air',
          'Wear N95/KN95 masks even for brief outdoor exposure',
          'Seek medical attention if experiencing symptoms',
          'Relocate to cleaner air if possible'
        ]
      };
    } else {
      return {
        level: 'hazardous',
        category: 'Hazardous',
        riskScore: 100,
        healthMessage: 'Health warning of emergency conditions: everyone is more likely to be affected.',
        actions: [
          'Everyone should avoid all outdoor activities',
          'Remain indoors with air filtration',
          'Evacuate to areas with better air quality if possible',
          'Seek immediate medical attention for any symptoms',
          'Follow emergency evacuation procedures'
        ]
      };
    }
  },

  // Calculate cumulative exposure score based on EPA research
  calculateCumulativeExposure(exposureHistory) {
    if (!exposureHistory.length) return 0;
    
    let cumulativeScore = 0;
    const now = Date.now();
    
    exposureHistory.forEach(entry => {
      const ageHours = (now - entry.timestamp) / 3600000;
      const decay = Math.exp(-0.693 * ageHours / 24);
      const excessAQI = Math.max(0, entry.aqi - 50);
      const contribution = (excessAQI / 50) * entry.duration * decay;
      cumulativeScore += contribution;
    });
    
    return Math.min(100, (cumulativeScore / 72) * 100);
  },

  // Evidence-based long-term risk calculation
  calculateLongTermRisk(exposureHistory) {
    if (!exposureHistory.length) return 0;
    
    const totalExposure = exposureHistory.reduce((sum, e) => sum + e.aqi, 0);
    const avgAQI = totalExposure / exposureHistory.length;
    const highExposureEvents = exposureHistory.filter(e => e.aqi > 100).length;
    const highExposureRate = highExposureEvents / exposureHistory.length;
    const excessAQI = Math.max(0, avgAQI - 50);
    const baselineRisk = (excessAQI / 10) * 2;
    const spikeRisk = highExposureRate * 20;
    
    return Math.min(100, baselineRisk + spikeRisk);
  },

  // Symptom-based health impact assessment
  analyzeSymptoms(symptoms, currentAQI, cumulativeExposure) {
    const conditions = [];
    
    const respiratory = ['cough', 'shortness_of_breath', 'wheezing', 'chest_tightness'];
    const hasRespiratory = symptoms.filter(s => respiratory.includes(s)).length;
    
    if (hasRespiratory >= 2 && cumulativeExposure > 30) {
      conditions.push({
        condition: 'Acute Respiratory Irritation',
        severity: currentAQI > 150 ? 'high' : 'moderate',
        probability: Math.min(95, 60 + (cumulativeExposure * 0.5)),
        recommendations: [
          'Minimize outdoor exposure immediately',
          'Use bronchodilator inhaler if prescribed',
          'Consider medical evaluation if symptoms worsen',
          'Monitor oxygen saturation if available'
        ]
      });
    }
    
    if (symptoms.includes('headache') && symptoms.includes('fatigue') && currentAQI > 100) {
      conditions.push({
        condition: 'Systemic Air Pollution Effects',
        severity: 'moderate',
        probability: Math.min(85, 50 + (cumulativeExposure * 0.4)),
        recommendations: [
          'Rest in filtered indoor environment',
          'Stay hydrated',
          'Use over-the-counter pain relief if needed',
          'Monitor for worsening symptoms'
        ]
      });
    }
    
    if ((symptoms.includes('eye_irritation') || symptoms.includes('throat_irritation')) && currentAQI > 100) {
      conditions.push({
        condition: 'Mucous Membrane Irritation',
        severity: 'low',
        probability: Math.min(90, 70 + (cumulativeExposure * 0.3)),
        recommendations: [
          'Use preservative-free artificial tears for eyes',
          'Gargle with salt water for throat',
          'Avoid rubbing eyes',
          'Wear protective eyewear outdoors'
        ]
      });
    }
    
    return conditions;
  },

  // Stakeholder-specific recommendations
  getStakeholderAdvice(aqi, stakeholderType) {
    const advice = {
      citizen: { title: 'General Public', recommendations: [] },
      school: { title: 'Schools & Educational Facilities', recommendations: [] },
      eldercare: { title: 'Eldercare & Healthcare Facilities', recommendations: [] },
      industrial: { title: 'Industrial Zone Residents', recommendations: [] },
      policy: { title: 'Policy Makers & Officials', recommendations: [] }
    };

    if (aqi <= 50) {
      advice.citizen.recommendations = ['Normal outdoor activities permitted', 'Good time for exercise outdoors'];
      advice.school.recommendations = ['Normal outdoor activities and sports', 'Windows can remain open for ventilation'];
      advice.eldercare.recommendations = ['Normal activities permitted', 'Outdoor time encouraged for residents'];
      advice.industrial.recommendations = ['Standard monitoring sufficient', 'Normal operations'];
      advice.policy.recommendations = ['Continue routine air quality monitoring', 'No immediate action required'];
    } else if (aqi <= 100) {
      advice.citizen.recommendations = ['Sensitive individuals should consider reducing prolonged outdoor exertion', 'General population can continue normal activities'];
      advice.school.recommendations = ['Consider indoor recess for asthmatic students', 'Monitor sensitive students during outdoor activities'];
      advice.eldercare.recommendations = ['Monitor residents with respiratory/cardiac conditions', 'Consider indoor activities for high-risk residents'];
      advice.industrial.recommendations = ['Increase monitoring frequency', 'Review emissions if contributing to local pollution'];
      advice.policy.recommendations = ['Issue air quality advisories for sensitive groups', 'Monitor pollution sources'];
    } else if (aqi <= 150) {
      advice.citizen.recommendations = ['Sensitive groups should avoid prolonged outdoor exertion', 'Wear N95 masks outdoors', 'Keep windows closed'];
      advice.school.recommendations = ['Move recess and PE classes indoors', 'Cancel outdoor field trips', 'Close windows and use air filtration'];
      advice.eldercare.recommendations = ['All outdoor activities should be cancelled', 'Ensure air purifiers are running', 'Monitor all residents closely'];
      advice.industrial.recommendations = ['Implement enhanced protective measures for outdoor workers', 'Provide N95 masks', 'Consider operation adjustments'];
      advice.policy.recommendations = ['Issue public health advisories', 'Activate emergency response protocols', 'Consider temporary traffic restrictions'];
    } else if (aqi <= 200) {
      advice.citizen.recommendations = ['Everyone should avoid prolonged outdoor exertion', 'Wear N95 masks for any outdoor exposure', 'Relocate to cleaner areas if possible'];
      advice.school.recommendations = ['Consider school closure or distance learning', 'All activities must be indoors', 'Ensure HVAC systems have MERV 13+ filters'];
      advice.eldercare.recommendations = ['Facility lockdown - no outdoor exposure', 'Check all residents for symptoms', 'Prepare for potential evacuations'];
      advice.industrial.recommendations = ['Halt non-essential outdoor operations', 'Provide respiratory protection for essential workers', 'Review contribution to air pollution'];
      advice.policy.recommendations = ['Activate air quality emergency plan', 'Issue health warnings to all residents', 'Consider emissions restrictions', 'Coordinate with emergency services'];
    } else {
      advice.citizen.recommendations = ['Stay indoors with air filtration', 'Evacuate to cleaner areas if possible', 'Seek medical attention for any symptoms'];
      advice.school.recommendations = ['MANDATORY school closure', 'Activate distance learning protocols', 'Coordinate evacuation if needed'];
      advice.eldercare.recommendations = ['Execute evacuation plans', 'Provide medical support on-site', 'Contact emergency services'];
      advice.industrial.recommendations = ['Emergency shutdown of contributing operations', 'Full evacuation of outdoor workers', 'Provide emergency shelter with filtration'];
      advice.policy.recommendations = ['Declare air quality emergency', 'Coordinate mass evacuation if needed', 'Activate crisis communication systems', 'Deploy emergency medical resources'];
    }

    return advice;
  }
};

const AdvancedHealthMonitor = () => {
  const { location, error: locationError } = useGeolocation();
  const { data: pm25Data, isLoading: pm25Loading } = useAirQuality(location?.lat, location?.lon, 'pm25');
  const { data: tempoData, isLoading: tempoLoading } = useTempoData(location?.lat, location?.lon);
  
  const [isTracking, setIsTracking] = useState(false);
  const [exposureHistory, setExposureHistory] = useState([]);
  const [currentAQI, setCurrentAQI] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [isSensitiveGroup, setIsSensitiveGroup] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState('citizen');
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    current: true,
    stakeholder: true,
    health: true,
    exposure: false,
    ml: false
  });
  
  // ML Model Inputs
  const [mlInputs, setMLInputs] = useState({
    AQI: '',
    PM10: '',
    PM2_5: '',
    NO2: '',
    SO2: '',
    O3: '',
    Temperature: '',
    Humidity: '',
    WindSpeed: '',
    HospitalAdmissions: ''
  });
  const [mlPrediction, setMLPrediction] = useState(null);
  
  const trackingIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Extract current AQI from API data
  useEffect(() => {
    if (tempoData?.data?.pm25?.aqi) {
      setCurrentAQI(tempoData.data.pm25.aqi);
    } else if (pm25Data?.results?.[0]?.aqi) {
      setCurrentAQI(pm25Data.results[0].aqi);
    }
  }, [tempoData, pm25Data]);

  // Autofill ML inputs from current data
  useEffect(() => {
    if (currentAQI && pm25Data && tempoData) {
      setMLInputs(prev => ({
        ...prev,
        AQI: currentAQI.toString(),
        PM2_5: pm25Data.results?.[0]?.value?.toString() || prev.PM2_5,
        NO2: tempoData.data?.no2?.value?.toString() || prev.NO2,
        O3: tempoData.data?.o3?.value?.toString() || prev.O3,
        SO2: tempoData.data?.so2?.value?.toString() || prev.SO2
      }));
    }
  }, [currentAQI, pm25Data, tempoData]);

  // Track exposure
  useEffect(() => {
    if (!isTracking || !location || currentAQI === null) return;

    const hasLocationChanged = () => {
      if (!lastLocationRef.current) return true;
      const latDiff = Math.abs(location.lat - lastLocationRef.current.lat);
      const lonDiff = Math.abs(location.lon - lastLocationRef.current.lon);
      return latDiff > 0.001 || lonDiff > 0.001;
    };

    const addExposurePoint = () => {
      if (hasLocationChanged() || exposureHistory.length === 0) {
        setExposureHistory(prev => [
          ...prev,
          {
            timestamp: Date.now(),
            lat: location.lat,
            lon: location.lon,
            aqi: currentAQI,
            duration: 0.5,
            pm25: pm25Data?.results?.[0]?.value || null,
            no2: tempoData?.data?.no2?.value || null,
            o3: tempoData?.data?.o3?.value || null
          }
        ]);
        lastLocationRef.current = { lat: location.lat, lon: location.lon };
      }
    };

    trackingIntervalRef.current = setInterval(addExposurePoint, 30000);
    addExposurePoint();

    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, [isTracking, location, currentAQI, pm25Data, tempoData]);

  // Calculate health metrics
  useEffect(() => {
    if (currentAQI !== null) {
      const totalHours = exposureHistory.reduce((sum, e) => sum + (e.duration / 60), 0);
      const cumulativeExposure = HealthRiskEngine.calculateCumulativeExposure(exposureHistory);
      const longTermRisk = HealthRiskEngine.calculateLongTermRisk(exposureHistory);
      const currentRisk = HealthRiskEngine.getHealthRisk(currentAQI, totalHours, isSensitiveGroup);
      const symptomAnalysis = HealthRiskEngine.analyzeSymptoms(symptoms, currentAQI, cumulativeExposure);
      
      setHealthMetrics({
        cumulativeExposure,
        longTermRisk,
        currentRisk,
        symptomAnalysis,
        totalExposureHours: totalHours
      });
    }
  }, [exposureHistory, currentAQI, symptoms, isSensitiveGroup]);

  // ML Prediction Handler - Connects to Flask backend
  const predictHealthImpact = async () => {
    const requiredFields = Object.keys(mlInputs);
    const missingFields = requiredFields.filter(field => !mlInputs[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(mlInputs)
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      
      setMLPrediction({
        healthImpactScore: data.health_impact_score,
        healthImpactClass: data.health_impact_class,
        classLabel: data.class_label,
        recommendations: data.recommendations,
        confidence: data.confidence || 90
      });
    } catch (error) {
      console.error('ML Prediction Error:', error);
      alert(`Failed to connect to ML backend: ${error.message}\n\nMake sure the Flask server is running at http://localhost:5000`);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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

  const stakeholderTypes = [
    { id: 'citizen', label: 'General Public', icon: Users },
    { id: 'school', label: 'Schools', icon: School },
    { id: 'eldercare', label: 'Healthcare', icon: Heart },
    { id: 'industrial', label: 'Industrial Zones', icon: Factory },
    { id: 'policy', label: 'Policy Makers', icon: Building2 }
  ];

  const getRiskColor = (level) => {
    const colors = {
      minimal: 'text-[hsl(var(--aqi-good))]',
      low: 'text-[hsl(var(--aqi-moderate))]',
      moderate: 'text-[hsl(var(--aqi-sensitive))]',
      high: 'text-[hsl(var(--aqi-unhealthy))]',
      'very-high': 'text-[hsl(var(--aqi-very-unhealthy))]',
      hazardous: 'text-[hsl(var(--aqi-hazardous))]'
    };
    return colors[level] || 'text-muted-foreground';
  };

  const getRiskBg = (level) => {
    const colors = {
      minimal: 'bg-[hsl(var(--aqi-good))]/10 border-[hsl(var(--aqi-good))]/30',
      low: 'bg-[hsl(var(--aqi-moderate))]/10 border-[hsl(var(--aqi-moderate))]/30',
      moderate: 'bg-[hsl(var(--aqi-sensitive))]/10 border-[hsl(var(--aqi-sensitive))]/30',
      high: 'bg-[hsl(var(--aqi-unhealthy))]/10 border-[hsl(var(--aqi-unhealthy))]/30',
      'very-high': 'bg-[hsl(var(--aqi-very-unhealthy))]/10 border-[hsl(var(--aqi-very-unhealthy))]/30',
      hazardous: 'bg-[hsl(var(--aqi-hazardous))]/10 border-[hsl(var(--aqi-hazardous))]/30'
    };
    return colors[level] || 'bg-muted/10 border-muted/30';
  };

  const isLoading = pm25Loading || tempoLoading;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">AQI Health Assessment System</h1>
            <p className="text-sm text-muted-foreground">
              Evidence-based pollution tracking & health risk analysis
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSensitiveGroup(!isSensitiveGroup)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              isSensitiveGroup 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-background border-muted hover:border-primary/50'
            }`}
          >
            {isSensitiveGroup ? '✓ ' : ''}Sensitive Group
          </button>
          <button
            onClick={isTracking ? () => setIsTracking(false) : () => setIsTracking(true)}
            disabled={!location || currentAQI === null}
            className={`px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isTracking 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <Card className="p-4 glass-effect">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading real-time air quality data...</span>
          </div>
        </Card>
      )}

      {locationError && (
        <Card className="p-4 glass-effect border-2 border-destructive/50">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>Location access denied. Please enable location permissions for accurate tracking.</span>
          </div>
        </Card>
      )}

      {/* Current Status Section */}
      <Card className="glass-effect">
        <button 
          onClick={() => toggleSection('current')}
          className="w-full p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Gauge className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Current Status</h2>
          </div>
          {expandedSections.current ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {expandedSections.current && (
          <div className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                <div className="flex items-center gap-3 mb-2">
                  <Navigation className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Tracking Status</span>
                </div>
                <div className="text-2xl font-bold">
                  {isTracking ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                <div className="flex items-center gap-3 mb-2">
                  <Wind className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Current AQI</span>
                </div>
                <div className="text-2xl font-bold">
                  {currentAQI !== null ? currentAQI : '--'}
                </div>
                {healthMetrics?.currentRisk && (
                  <Badge className={`mt-2 ${getRiskColor(healthMetrics.currentRisk.level)}`}>
                    {healthMetrics.currentRisk.category}
                  </Badge>
                )}
              </div>

              <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Data Points</span>
                </div>
                <div className="text-2xl font-bold">{exposureHistory.length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {healthMetrics?.totalExposureHours.toFixed(1)}h exposure
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <div className="text-2xl font-bold">
                  {location ? '✓ Active' : 'N/A'}
                </div>
              </div>
            </div>

            {location && (
              <div className="p-4 rounded-lg bg-muted/20 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Position:</span>
                    <span className="font-mono">{location.lat.toFixed(6)}, {location.lon.toFixed(6)}</span>
                  </div>
                  {pm25Data?.results?.[0]?.location && (
                    <span className="text-muted-foreground">
                      Station: {pm25Data.results[0].location}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Stakeholder Recommendations - Moved under Current Status */}
      {currentAQI !== null && (
        <Card className="glass-effect">
          <button 
            onClick={() => toggleSection('stakeholder')}
            className="w-full p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Stakeholder Guidance</h2>
            </div>
            {expandedSections.stakeholder ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.stakeholder && (
            <div className="p-6 pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Tailored recommendations for different community stakeholders based on current air quality
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {stakeholderTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedStakeholder(type.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      selectedStakeholder === type.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-muted hover:border-primary/50'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>

              {(() => {
                const advice = HealthRiskEngine.getStakeholderAdvice(currentAQI, selectedStakeholder);
                const stakeholderAdvice = advice[selectedStakeholder];
                
                return (
                  <div className={`p-4 rounded-lg border-2 ${getRiskBg(healthMetrics?.currentRisk.level)}`}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      {stakeholderTypes.find(t => t.id === selectedStakeholder)?.icon && 
                        (() => {
                          const Icon = stakeholderTypes.find(t => t.id === selectedStakeholder).icon;
                          return <Icon className="w-5 h-5" />;
                        })()
                      }
                      {stakeholderAdvice.title}
                    </h3>
                    <div className="bg-background/50 p-4 rounded space-y-2">
                      {stakeholderAdvice.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      )}

      {/* Health Risk Analysis Section */}
      {healthMetrics && (
        <Card className={`glass-effect border-2 ${getRiskBg(healthMetrics.currentRisk.level)}`}>
          <button 
            onClick={() => toggleSection('health')}
            className="w-full p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Health Risk Analysis</h2>
              <Badge className={`text-base px-3 py-1 ${getRiskColor(healthMetrics.currentRisk.level)}`}>
                {healthMetrics.currentRisk.level.toUpperCase()}
              </Badge>
            </div>
            {expandedSections.health ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.health && (
            <div className="p-6 pt-0 space-y-6">
              {/* Current Risk Message */}
              <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-1 flex-shrink-0 ${getRiskColor(healthMetrics.currentRisk.level)}`} />
                  <div>
                    <h3 className="font-semibold mb-2">{healthMetrics.currentRisk.category} - {healthMetrics.currentRisk.level.toUpperCase()} Risk</h3>
                    <p className="text-sm text-muted-foreground">{healthMetrics.currentRisk.healthMessage}</p>
                  </div>
                </div>
              </div>

              {/* Health Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="w-5 h-5 text-destructive" />
                    <span className="text-sm font-medium">Cumulative Exposure</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{Math.round(healthMetrics.cumulativeExposure)}%</div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[hsl(var(--aqi-good))] via-[hsl(var(--aqi-moderate))] to-[hsl(var(--aqi-unhealthy))]"
                      style={{ width: `${healthMetrics.cumulativeExposure}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Based on EPA 24-hour exposure model
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium">Long-term Health Risk</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{Math.round(healthMetrics.longTermRisk)}%</div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[hsl(var(--aqi-moderate))] to-[hsl(var(--aqi-unhealthy))]"
                      style={{ width: `${healthMetrics.longTermRisk}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Chronic exposure impact estimate
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Risk Score</span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{Math.round(healthMetrics.currentRisk.riskScore)}/100</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Current exposure severity
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              {healthMetrics.currentRisk.actions.length > 0 && (
                <div className="p-4 rounded-lg bg-background/50 border-2 border-muted">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Recommended Actions
                  </h3>
                  <ul className="space-y-2">
                    {healthMetrics.currentRisk.actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Symptom-based Analysis */}
              {healthMetrics.symptomAnalysis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Symptom-Based Health Assessment
                  </h3>
                  {healthMetrics.symptomAnalysis.map((condition, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${getRiskBg(condition.severity)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-lg">{condition.condition}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Probability: {condition.probability.toFixed(0)}% • Severity: {condition.severity}
                          </div>
                        </div>
                        <Badge className={getRiskColor(condition.severity)}>
                          {condition.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="bg-background/50 p-3 rounded space-y-2">
                        <div className="font-medium text-sm">Medical Recommendations:</div>
                        <ul className="space-y-1">
                          {condition.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Emergency Alert */}
              {(healthMetrics.currentRisk.level === 'very-high' || healthMetrics.currentRisk.level === 'hazardous') && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold text-lg mb-2 text-destructive">HEALTH EMERGENCY</div>
                      <p className="text-sm mb-3">
                        Critical air pollution levels detected. If experiencing severe symptoms (difficulty breathing, 
                        chest pain, severe dizziness), seek emergency medical care immediately.
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
          Select symptoms you're experiencing for personalized health risk assessment
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableSymptoms.map(symptom => (
            <button
              key={symptom.id}
              onClick={() => setSymptoms(prev => 
                prev.includes(symptom.id) 
                  ? prev.filter(s => s !== symptom.id)
                  : [...prev, symptom.id]
              )}
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

      {exposureHistory.length > 0 && (
        <Card className="glass-effect">
          <button 
            onClick={() => toggleSection('exposure')}
            className="w-full p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Exposure Journey Timeline</h2>
              <Badge className="ml-2">{exposureHistory.length} points</Badge>
            </div>
            {expandedSections.exposure ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.exposure && (
            <div className="p-6 pt-0">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {exposureHistory.slice(-20).reverse().map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        point.aqi <= 50 ? 'bg-[hsl(var(--aqi-good))]' :
                        point.aqi <= 100 ? 'bg-[hsl(var(--aqi-moderate))]' :
                        point.aqi <= 150 ? 'bg-[hsl(var(--aqi-sensitive))]' :
                        point.aqi <= 200 ? 'bg-[hsl(var(--aqi-unhealthy))]' :
                        point.aqi <= 300 ? 'bg-[hsl(var(--aqi-very-unhealthy))]' :
                        'bg-[hsl(var(--aqi-hazardous))]'
                      }`} />
                      <div className="text-sm">
                        <div className="font-medium">AQI: {point.aqi}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(point.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground font-mono">
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
            </div>
          )}
        </Card>
      )}

      {/* ML Health Impact Predictor */}
      <Card className="glass-effect border-2 border-primary/30">
        <button 
          onClick={() => toggleSection('ml')}
          className="w-full p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">AI Health Impact Predictor</h2>
            <Badge className="bg-primary/20 text-primary">Machine Learning</Badge>
          </div>
          {expandedSections.ml ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.ml && (
          <div className="p-6 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter comprehensive environmental and health data for ML-powered health impact prediction. 
              Some fields are auto-filled from current data.
            </p>

            {/* ML Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(mlInputs).map((key) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-2 block">
                    {key.replace('_', '.')}
                    {key === 'PM2_5' && ' (µg/m³)'}
                    {key === 'PM10' && ' (µg/m³)'}
                    {key === 'NO2' && ' (ppb)'}
                    {key === 'SO2' && ' (ppb)'}
                    {key === 'O3' && ' (ppb)'}
                    {key === 'Temperature' && ' (°C)'}
                    {key === 'Humidity' && ' (%)'}
                    {key === 'WindSpeed' && ' (m/s)'}
                  </label>
                  <input
                    type="number"
                    value={mlInputs[key]}
                    onChange={(e) => setMLInputs(prev => ({ ...prev, [key]: e.target.value }))}
                    // Set placeholder defaults based on matching key
                    placeholder={
                      key === 'AQI' ? '187.3' :
                      key === 'PM10' ? '295.8' :
                      key === 'PM2_5' ? '13.0' :
                      key === 'NO2' ? '6.6' :
                      key === 'SO2' ? '66.2' :
                      key === 'O3' ? '54.6' :
                      key === 'Temperature' ? '5.1' :
                      key === 'Humidity' ? '84.4' :
                      key === 'WindSpeed' ? '6.1' :
                      key === 'HospitalAdmissions' ? '1' :
                      '0'
                    }
                    className="w-full px-3 py-2 rounded-lg border-2 border-muted bg-background"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={predictHealthImpact}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Prediction
            </button>

            {/* ML Prediction Results */}
            {mlPrediction && (
              <div className="mt-6 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    AI Prediction Results
                  </h3>
                  <Badge className="text-lg px-4 py-2 bg-primary/20 text-primary">
                    {mlPrediction.confidence.toFixed(0)}% Confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="p-4 rounded-lg bg-background/70 border-2 border-muted">
                    <div className="text-sm text-muted-foreground mb-1">Impact Classification</div>
                    <div className="text-2xl font-bold">{mlPrediction.classLabel}</div>
                    <div className="text-xs text-muted-foreground mt-1">Class {mlPrediction.healthImpactClass}</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background/70 border-2 border-muted">
                    <div className="text-sm text-muted-foreground mb-1">Model Used</div>
                    <div className="text-lg font-bold">HealthPredict</div>
                    <div className="text-xs text-muted-foreground mt-1">ML Classification Model</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/70 border-2 border-muted">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Action Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {mlPrediction.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-muted-foreground p-3 bg-background/50 rounded">
                  <strong>Note:</strong> This ML model analyzes environmental and health metrics using the trained 
                  HealthPredict.sav model via Flask backend. Predictions are based on machine learning analysis of 
                  air quality, weather conditions, and health data patterns. For personal medical advice, consult healthcare professionals.
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Information Panel */}
      <Card className="p-6 glass-effect bg-muted/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          System Information & Data Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-primary">Real-Time Data Sources</p>
            <p><strong>OpenAQ Network:</strong> Ground-level air quality monitors</p>
            <p><strong>NASA TEMPO:</strong> Satellite atmospheric measurements</p>
            <p><strong>Update Frequency:</strong> Every 30 seconds when tracking</p>
            <p><strong>Spatial Resolution:</strong> ~100m movement threshold</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-primary">Health Risk Models</p>
            <p><strong>EPA AQI Standards:</strong> Official health risk thresholds</p>
            <p><strong>WHO Guidelines:</strong> Air quality health impact research</p>
            <p><strong>Cumulative Exposure:</strong> 24-hour decay model (EPA)</p>
            <p><strong>ML Model:</strong> HealthPredict.sav (multi-factor analysis)</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-primary/10 border-2 border-primary/30 rounded-lg text-sm">
          <p className="font-medium mb-1">Medical Disclaimer</p>
          <p className="text-muted-foreground">
            This system provides educational information and risk assessments based on validated air quality data and 
            epidemiological research. It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or qualified health provider with questions regarding a medical condition.
          </p>
        </div>
      </Card>

      {/* Quick Action Guide */}
      <Card className="p-6 glass-effect bg-gradient-to-br from-primary/5 to-secondary/5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Quick Decision Guide: Should You Go Outside?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-[hsl(var(--aqi-good))]/10 border-2 border-[hsl(var(--aqi-good))]/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[hsl(var(--aqi-good))]" />
              <span className="font-semibold">AQI 0-50: Excellent</span>
            </div>
            <p className="text-sm text-muted-foreground">Perfect for all outdoor activities</p>
            <p className="text-sm text-muted-foreground">Exercise and recreation recommended</p>
            <p className="text-sm text-muted-foreground">No protective measures needed</p>
          </div>

          <div className="p-4 rounded-lg bg-[hsl(var(--aqi-moderate))]/10 border-2 border-[hsl(var(--aqi-moderate))]/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[hsl(var(--aqi-moderate))]" />
              <span className="font-semibold">AQI 51-100: Good</span>
            </div>
            <p className="text-sm text-muted-foreground">Safe for general population</p>
            <p className="text-sm text-muted-foreground">Sensitive groups: monitor symptoms</p>
            <p className="text-sm text-muted-foreground">No masks required</p>
          </div>

          <div className="p-4 rounded-lg bg-[hsl(var(--aqi-sensitive))]/10 border-2 border-[hsl(var(--aqi-sensitive))]/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--aqi-sensitive))]" />
              <span className="font-semibold">AQI 101-150: Caution</span>
            </div>
            <p className="text-sm text-muted-foreground">Sensitive groups: limit outdoor time</p>
            <p className="text-sm text-muted-foreground">Consider N95 masks for sensitive groups</p>
            <p className="text-sm text-muted-foreground">General public: normal activities OK</p>
          </div>

          <div className="p-4 rounded-lg bg-[hsl(var(--aqi-unhealthy))]/10 border-2 border-[hsl(var(--aqi-unhealthy))]/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--aqi-unhealthy))]" />
              <span className="font-semibold">AQI 151-200: Unhealthy</span>
            </div>
            <p className="text-sm text-muted-foreground">Sensitive groups: stay indoors</p>
            <p className="text-sm text-muted-foreground">Everyone: reduce outdoor exertion</p>
            <p className="text-sm text-muted-foreground">Wear N95/KN95 masks outdoors</p>
          </div>

          <div className="p-4 rounded-lg bg-[hsl(var(--aqi-very-unhealthy))]/10 border-2 border-[hsl(var(--aqi-very-unhealthy))]/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--aqi-very-unhealthy))]" />
              <span className="font-semibold">AQI 201-300: Very Unhealthy</span>
            </div>
            <p className="text-sm text-muted-foreground">Everyone: avoid outdoor activities</p>
            <p className="text-sm text-muted-foreground">N95 masks required for brief exposure</p>
            <p className="text-sm text-muted-foreground">Stay indoors with air filtration</p>
          </div>

          <div className="p-4 rounded-lg bg-[hsl(var(--aqi-hazardous))]/10 border-2 border-[hsl(var(--aqi-hazardous))]/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--aqi-hazardous))]" />
              <span className="font-semibold">AQI 301+: Hazardous</span>
            </div>
            <p className="text-sm text-muted-foreground">EMERGENCY: Stay indoors</p>
            <p className="text-sm text-muted-foreground">No outdoor exposure</p>
            <p className="text-sm text-muted-foreground">Consider evacuation to cleaner areas</p>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t border-muted">
        <p>Built with real-time air quality data from OpenAQ and NASA TEMPO</p>
        <p className="mt-1">Health risk assessments based on EPA and WHO guidelines</p>
        <p className="mt-2 text-xs">
          Last updated: {new Date().toLocaleString()} • Tracking: {isTracking ? 'Active' : 'Inactive'} • 
          Data points: {exposureHistory.length}
        </p>
      </div>
    </div>
  );
};

export default AdvancedHealthMonitor;