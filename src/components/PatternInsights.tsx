import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  Lightbulb,
  Clock,
  Activity
} from "lucide-react";
import { PatternInsight } from "@/lib/api";

interface PatternInsightsProps {
  insights: PatternInsight[];
  summary: string;
  confidence: number;
}

const PatternInsights = ({ insights, summary, confidence }: PatternInsightsProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'moderate':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'hourly_pattern':
        return <Clock className="w-5 h-5" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5" />;
      case 'variability':
        return <Activity className="w-5 h-5" />;
      case 'peak_detection':
        return <AlertTriangle className="w-5 h-5" />;
      case 'health':
        return <Info className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Summary Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold">AI Pattern Analysis</h4>
              <Badge variant="outline" className="text-xs">
                {confidence}% Confidence
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      </Card>

      {/* Insights Grid */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <Card 
              key={index} 
              className={`p-5 border-l-4 transition-all hover:shadow-lg ${getSeverityColor(insight.severity)}`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    {getInsightIcon(insight.type)}
                    <h5 className="font-semibold text-sm leading-tight">
                      {insight.title}
                    </h5>
                  </div>
                  {getSeverityIcon(insight.severity)}
                </div>

                {/* Main Insight */}
                <p className="text-sm font-medium">
                  {insight.insight}
                </p>

                {/* Detail */}
                <p className="text-xs text-muted-foreground">
                  {insight.detail}
                </p>

                {/* Action */}
                {insight.actionable && insight.action && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-medium text-primary">
                        {insight.action}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {insights.length === 0 && (
        <Card className="p-8 text-center">
          <Info className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Not enough historical data to generate pattern insights.
            <br />
            Insights will appear after collecting more data points.
          </p>
        </Card>
      )}
    </div>
  );
};

export default PatternInsights;
