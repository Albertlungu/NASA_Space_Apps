export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

class NewsService {
  private readonly baseUrl = 'https://newsapi.org/v2';
  private readonly apiKey = process.env.REACT_APP_NEWS_API_KEY || '';

  async getAirQualityNews(): Promise<NewsArticle[]> {
    // If no API key is provided, return mock data
    if (!this.apiKey) {
      return this.getMockNews();
    }

    const queries = [
      'air quality',
      'nitrogen dioxide NO2',
      'air pollution',
      'WHO air quality guidelines',
      'NASA TEMPO satellite'
    ];

    try {
      const allArticles: NewsArticle[] = [];
      
      for (const query of queries) {
        const response = await fetch(
          `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=5`,
          {
            headers: {
              'X-API-Key': this.apiKey,
            },
          }
        );

        if (response.ok) {
          const data: NewsResponse = await response.json();
          allArticles.push(...data.articles);
        }
      }

      // Remove duplicates and sort by date
      const uniqueArticles = allArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.title === article.title)
      );

      return uniqueArticles
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 10); // Return top 10 most recent
    } catch (error) {
      console.error('Error fetching news:', error);
      return this.getMockNews();
    }
  }

  private getMockNews(): NewsArticle[] {
    return [
      {
        title: "WHO Updates Air Quality Guidelines with Stricter Standards",
        description: "The World Health Organization has released updated air quality guidelines with more stringent limits for PM2.5 and NO₂ based on new health evidence showing greater risks at lower pollution levels.",
        url: "https://www.who.int/news/item/22-09-2021-new-who-global-air-quality-guidelines-aim-to-save-millions-of-lives-from-air-pollution",
        urlToImage: "",
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        source: { name: "WHO" }
      },
      {
        title: "NASA TEMPO Satellite Reveals Detailed NO₂ Pollution Maps",
        description: "NASA's TEMPO mission provides unprecedented hourly measurements of nitrogen dioxide pollution across North America, revealing pollution hotspots over major highways and industrial areas.",
        url: "https://tempo.si.edu/",
        urlToImage: "",
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        source: { name: "NASA Earth Observatory" }
      },
      {
        title: "Electric Vehicle Adoption Shows Measurable Impact on Urban Air Quality",
        description: "New research demonstrates that cities with higher electric vehicle adoption rates are experiencing significant reductions in nitrogen dioxide levels, particularly in downtown areas and along major transportation corridors.",
        url: "https://iopscience.iop.org/journal/1748-9326",
        urlToImage: "",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        source: { name: "Environmental Research Letters" }
      },
      {
        title: "London's Ultra Low Emission Zone Shows 44% Reduction in NO₂",
        description: "Transport for London reports that the Ultra Low Emission Zone has achieved a 44% reduction in nitrogen dioxide concentrations in central London since its implementation in 2019.",
        url: "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone",
        urlToImage: "",
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        source: { name: "Transport for London" }
      },
      {
        title: "Beijing's Air Pollution Control Measures Cut PM2.5 by Over 50%",
        description: "A comprehensive study shows that Beijing's coordinated air pollution control measures between 2013-2020 resulted in a dramatic reduction of PM2.5 concentrations by more than 50%.",
        url: "https://www.nature.com/articles/s41586-021-03718-z",
        urlToImage: "",
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        source: { name: "Nature" }
      }
    ];
  }
}

export const newsService = new NewsService();
