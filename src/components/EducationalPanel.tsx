import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Droplets, Wind, Activity, Factory, AlertTriangle, Newspaper, Leaf, Heart, Globe, ExternalLink, Loader2 } from "lucide-react";
import { useNews } from "@/hooks/useNews";

const EducationalPanel = () => {
  const { articles, loading: newsLoading, error: newsError } = useNews();

  // Organization links for proper attribution
  const organizationLinks = {
    "WHO": "https://www.who.int/",
    "World Health Organization": "https://www.who.int/",
    "NASA": "https://www.nasa.gov/",
    "NASA Earth Observatory": "https://earthobservatory.nasa.gov/",
    "NASA TEMPO": "https://tempo.si.edu/",
    "Environmental Research Letters": "https://iopscience.iop.org/journal/1748-9326",
    "Nature": "https://www.nature.com/",
    "Transport for London": "https://tfl.gov.uk/",
    "EPA": "https://www.epa.gov/",
    "European Environment Agency": "https://www.eea.europa.eu/"
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

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

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="importance">AQI Importance</TabsTrigger>
          <TabsTrigger value="news">News & Mitigation</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6 mt-6">
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
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-sm font-semibold">WHO Guidelines:</h5>
                          <a 
                            href={organizationLinks["WHO"]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">About NASA TEMPO</h4>
                  <a 
                    href={organizationLinks["NASA TEMPO"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  The Tropospheric Emissions: Monitoring of Pollution (TEMPO) mission is <a 
                    href={organizationLinks["NASA"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >NASA's</a> first 
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
        </TabsContent>

        <TabsContent value="importance" className="space-y-6 mt-6">
          {/* Why AQI Matters */}
          <Card className="p-6 glass-effect shadow-md">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Why Air Quality Index (AQI) Matters</h4>
                <p className="text-sm text-muted-foreground">
                  The AQI is a critical public health tool that translates complex air pollution data into simple, 
                  actionable information for everyone to understand and respond to daily air quality conditions.
                </p>
              </div>
            </div>
          </Card>

          {/* Health Impacts */}
          <Card className="p-6 glass-effect shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Health Impacts of Poor Air Quality</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <h5 className="font-semibold text-red-800 dark:text-red-300 mb-2">Short-term Effects</h5>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    <li>• Eye, nose, and throat irritation</li>
                    <li>• Coughing and shortness of breath</li>
                    <li>• Asthma attacks and bronchitis</li>
                    <li>• Reduced lung function</li>
                    <li>• Headaches and fatigue</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h5 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Vulnerable Groups</h5>
                  <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                    <li>• Children and elderly</li>
                    <li>• People with asthma or COPD</li>
                    <li>• Individuals with heart disease</li>
                    <li>• Outdoor workers and athletes</li>
                    <li>• Pregnant women</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                  <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Long-term Effects</h5>
                  <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                    <li>• Cardiovascular disease</li>
                    <li>• Lung cancer and respiratory diseases</li>
                    <li>• Premature death</li>
                    <li>• Developmental issues in children</li>
                    <li>• Reduced life expectancy</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Economic Impact</h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• $150+ billion in health costs annually (US)</li>
                    <li>• Lost productivity from sick days</li>
                    <li>• Increased healthcare expenses</li>
                    <li>• Reduced property values</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Environmental Impacts */}
          <Card className="p-6 glass-effect shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Environmental Impacts</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <h5 className="font-semibold text-green-800 dark:text-green-300 mb-2">Ecosystem Damage</h5>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Air pollution damages forests, crops, and wildlife habitats. Acid rain from pollutants 
                  harms soil and water bodies, affecting entire ecosystems.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Climate Change</h5>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Many air pollutants are also greenhouse gases or contribute to climate change, 
                  affecting global weather patterns and temperatures.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Visibility & Quality of Life</h5>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Poor air quality reduces visibility, creates haze, and diminishes the quality 
                  of outdoor activities and tourism.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-6 mt-6">
          {/* Recent News */}
          <Card className="p-6 glass-effect shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Recent Air Quality News & Research</h4>
            </div>
            
            {newsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading latest news...</span>
              </div>
            ) : newsError ? (
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Unable to load latest news. Showing recent highlights instead.
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              {articles.slice(0, 6).map((article, index) => {
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
                const sourceLink = organizationLinks[article.source.name as keyof typeof organizationLinks];
                
                return (
                  <div key={index} className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]} mt-2 flex-shrink-0`}></div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h5 className="font-semibold leading-tight">{article.title}</h5>
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                            title="Read full article"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Source: {sourceLink ? (
                              <a 
                                href={sourceLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {article.source.name}
                              </a>
                            ) : article.source.name}
                          </span>
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Mitigation Efforts */}
          <Card className="p-6 glass-effect shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Global Mitigation Efforts</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <h5 className="font-semibold text-green-800 dark:text-green-300 mb-2">Transportation Solutions</h5>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li>• Electric vehicle incentives and infrastructure</li>
                    <li>• Public transit expansion and electrification</li>
                    <li>• Low emission zones in city centers</li>
                    <li>• Bike lanes and pedestrian infrastructure</li>
                    <li>• Stricter vehicle emission standards</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Industrial Regulations</h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Stricter emission limits for power plants</li>
                    <li>• Clean air acts and enforcement</li>
                    <li>• Carbon pricing and cap-and-trade systems</li>
                    <li>• Renewable energy mandates</li>
                    <li>• Industrial pollution monitoring</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                  <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Urban Planning</h5>
                  <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                    <li>• Green building standards and certifications</li>
                    <li>• Urban forests and green spaces</li>
                    <li>• Smart city air quality monitoring</li>
                    <li>• Sustainable development policies</li>
                    <li>• Air quality-based urban design</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                  <h5 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Individual Actions</h5>
                  <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                    <li>• Use public transportation or carpool</li>
                    <li>• Choose energy-efficient appliances</li>
                    <li>• Support renewable energy options</li>
                    <li>• Reduce, reuse, and recycle</li>
                    <li>• Advocate for clean air policies</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Success Stories */}
          <Card className="p-6 glass-effect shadow-md border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-4 text-green-800 dark:text-green-300">Success Stories</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-medium">London, UK</h5>
                  <a 
                    href={organizationLinks["Transport for London"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ultra Low Emission Zone reduced NO₂ levels by 44% in central London since 2019.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-medium">Beijing, China</h5>
                  <a 
                    href={organizationLinks["Nature"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comprehensive air pollution control reduced PM2.5 by over 50% between 2013-2020.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-medium">California, USA</h5>
                  <a 
                    href={organizationLinks["EPA"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">
                  <a 
                    href={organizationLinks["EPA"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >Clean Air Act</a> implementation led to 70% reduction in air pollution since 1970.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationalPanel;
