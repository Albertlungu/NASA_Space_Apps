import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Droplets, Wind, Activity, Factory } from "lucide-react";

const EducationalPanel = () => {
  const pollutantInfo = [
    {
      name: "PM2.5 (Fine Particulate Matter)",
      icon: Droplets,
      description: "Tiny particles less than 2.5 micrometers in diameter that can penetrate deep into lungs and bloodstream.",
      sources: ["Vehicle emissions", "Industrial combustion", "Wildfires", "Dust storms"],
      health: "Can cause respiratory issues, cardiovascular disease, and premature death. Most harmful to children, elderly, and those with existing conditions.",
      limits: "WHO guideline: 5 µg/m³ annual mean, 15 µg/m³ 24-hour mean",
    },
    {
      name: "PM10 (Coarse Particulate Matter)",
      icon: Wind,
      description: "Particles between 2.5 and 10 micrometers that can irritate airways and lungs.",
      sources: ["Road dust", "Construction sites", "Agriculture", "Pollen"],
      health: "Causes coughing, breathing difficulties, and aggravates asthma. Can reduce lung function.",
      limits: "WHO guideline: 15 µg/m³ annual mean, 45 µg/m³ 24-hour mean",
    },
    {
      name: "NO₂ (Nitrogen Dioxide)",
      icon: Factory,
      description: "A reddish-brown gas formed from vehicle emissions and power plant combustion.",
      sources: ["Vehicle exhaust", "Power plants", "Industrial facilities", "Heating systems"],
      health: "Inflames airways, reduces immunity to lung infections, worsens asthma and bronchitis.",
      limits: "WHO guideline: 10 µg/m³ annual mean, 25 µg/m³ 24-hour mean",
    },
    {
      name: "O₃ (Ground-level Ozone)",
      icon: Activity,
      description: "Not emitted directly, but forms when pollutants react with sunlight. Worse on hot, sunny days.",
      sources: ["Chemical reactions between NOx and VOCs in sunlight", "Not directly emitted"],
      health: "Triggers asthma, reduces lung function, causes chest pain and coughing. Especially harmful during exercise.",
      limits: "WHO guideline: 60 µg/m³ peak season mean",
    },
  ];

  const aqiScale = [
    { range: "0-50", level: "Good", color: "bg-[hsl(var(--aqi-good))]", description: "Air quality is satisfactory, and air pollution poses little or no risk." },
    { range: "51-100", level: "Moderate", color: "bg-[hsl(var(--aqi-moderate))]", description: "Acceptable for most, but sensitive individuals may experience minor issues." },
    { range: "101-150", level: "Unhealthy for Sensitive Groups", color: "bg-[hsl(var(--aqi-sensitive))]", description: "General public not affected, but sensitive groups may experience health effects." },
    { range: "151-200", level: "Unhealthy", color: "bg-[hsl(var(--aqi-unhealthy))]", description: "Everyone may begin to experience health effects; sensitive groups may experience more serious effects." },
    { range: "201-300", level: "Very Unhealthy", color: "bg-[hsl(var(--aqi-very-unhealthy))]", description: "Health alert: everyone may experience more serious health effects." },
    { range: "301+", level: "Hazardous", color: "bg-[hsl(var(--aqi-hazardous))]", description: "Health warnings of emergency conditions. The entire population is likely to be affected." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">Educational Resources</h3>
          <p className="text-sm text-muted-foreground">
            Understanding air quality and its impact on health
          </p>
        </div>
      </div>

      {/* AQI Scale */}
      <Card className="p-6 glass-effect shadow-md">
        <h4 className="font-semibold mb-4">Understanding the AQI Scale</h4>
        <div className="space-y-3">
          {aqiScale.map((level, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-lg ${level.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {level.range}
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">{level.level}</div>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pollutant Information */}
      <Card className="p-6 glass-effect shadow-md">
        <h4 className="font-semibold mb-4">Common Air Pollutants</h4>
        <Accordion type="single" collapsible className="w-full">
          {pollutantInfo.map((pollutant, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <pollutant.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{pollutant.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{pollutant.description}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-semibold mb-2">Common Sources:</h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {pollutant.sources.map((source, i) => (
                        <li key={i}>{source}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold mb-2">Health Effects:</h5>
                    <p className="text-sm text-muted-foreground">{pollutant.health}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <h5 className="text-sm font-semibold mb-1">WHO Guidelines:</h5>
                    <p className="text-sm text-muted-foreground">{pollutant.limits}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      {/* NASA TEMPO Information */}
      <Card className="p-6 glass-effect shadow-md border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2">About NASA TEMPO</h4>
            <p className="text-sm text-muted-foreground mb-3">
              The Tropospheric Emissions: Monitoring of Pollution (TEMPO) mission is NASA's first 
              space-based instrument to continuously measure air quality over North America. 
              Operating from geostationary orbit, TEMPO provides hourly daytime measurements of 
              ozone, nitrogen dioxide, and other pollutants at a resolution as fine as 4 square miles.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium mb-1">Coverage</div>
                <p className="text-muted-foreground">North America from Mexico City to the Canadian oil sands</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium mb-1">Resolution</div>
                <p className="text-muted-foreground">As fine as 4 square miles (10 km²)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium mb-1">Frequency</div>
                <p className="text-muted-foreground">Hourly measurements during daylight</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EducationalPanel;
