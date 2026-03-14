import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bookmark, ChevronDown, ExternalLink } from "lucide-react";

interface ResultCardProps {
  act: string;
  areas: string[];
  date: string;
  phase: string;
  summary: string;
  source: string;
  sourceName: string;
  importance: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  t: { summary: string; source: string };
}

function getImportanceColor(score: number): string {
  if (score >= 9) return "hsl(142, 70%, 35%)";
  if (score >= 8) return "hsl(142, 60%, 40%)";
  if (score >= 7) return "hsl(142, 50%, 45%)";
  if (score >= 6) return "hsl(80, 50%, 42%)";
  if (score >= 5) return "hsl(45, 70%, 45%)";
  if (score >= 4) return "hsl(30, 75%, 48%)";
  if (score >= 3) return "hsl(15, 75%, 50%)";
  return "hsl(0, 75%, 50%)";
}

function getImportanceBg(score: number): string {
  if (score >= 9) return "bg-green-100 dark:bg-green-900/40";
  if (score >= 8) return "bg-green-50 dark:bg-green-950/30";
  if (score >= 7) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (score >= 6) return "bg-lime-50 dark:bg-lime-950/30";
  if (score >= 5) return "bg-yellow-50 dark:bg-yellow-950/30";
  if (score >= 4) return "bg-amber-50 dark:bg-amber-950/30";
  if (score >= 3) return "bg-orange-50 dark:bg-orange-950/30";
  return "bg-red-50 dark:bg-red-950/30";
}

const ResultCard = ({
  act, areas, date, phase, summary, source, sourceName,
  importance, bookmarked, onToggleBookmark, t,
}: ResultCardProps) => {
  return (
    <div
      className={`rounded-lg border transition-all duration-200 hover:shadow-md hover:border-l-[3px] hover:border-l-primary ${
        bookmarked
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <Collapsible>
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className={`shrink-0 transition-colors ${
              bookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
            aria-label="Bookmark"
          >
            <Bookmark className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"} />
          </button>

          <CollapsibleTrigger className="flex flex-1 items-center gap-3 text-left group">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground leading-snug">{act}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {areas.map((area, i) => (
                    <Badge key={i} variant="secondary" className="text-xs text-muted-foreground bg-muted">
                      {area}
                    </Badge>
                ))}
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${
                    phase === "In force"
                      ? "border-blue-400/50 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300"
                      : phase === "Proposal"
                        ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {phase}
                </Badge>
                <span className="text-sm font-semibold text-foreground">{date}</span>
              </div>
            </div>

            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getImportanceBg(importance)}`}
              style={{ color: getImportanceColor(importance) }}
            >
              {importance.toFixed(1)}
            </span>

            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border px-4 py-3 space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{t.summary}: </span>
              {summary}
            </p>
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              {t.source}: {sourceName}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ResultCard;
