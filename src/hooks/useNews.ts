import { useState, useEffect } from 'react';
import { newsService, NewsArticle } from '@/services/newsService';

export const useNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const newsArticles = await newsService.getAirQualityNews();
        setArticles(newsArticles);
      } catch (err) {
        setError('Failed to fetch news articles');
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return { articles, loading, error };
};
