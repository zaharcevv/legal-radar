import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Search, X, ArrowDownNarrowWide, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import flagEu from "@/assets/flag-eu.png";
import flagSi from "@/assets/flag-si.png";
import flagUk from "@/assets/flag-uk.png";
import logo from "@/assets/logo.png";
import appName from "@/assets/app-name.png";
import ResultCard from "@/components/ResultCard";
import SkeletonResults from "@/components/SkeletonResults";

// ── Constants ──

const TIME_RANGE_OPTIONS = [
  { key: "1m", value: "1m" },
  { key: "3m", value: "3m" },
  { key: "6m", value: "6m" },
  { key: "1y", value: "1y" },
] as const;

const REGIONS_DATA = [
  { key: "eu", value: "eu", flag: flagEu },
  { key: "si", value: "si", flag: flagSi },
] as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

// ── Translations ──

const TRANSLATIONS = {
  en: {
    timeRange: "Time Range",
    region: "Region",
    searchBtn: "Search Legislation",
    clearAll: "Clear All",
    results: "Results",
    summary: "Summary",
    source: "Source",
    importance: "Importance",
    errNoProfile: "Please set up your law areas in your Profile first.",
    errTimeRange: "Please select a time range.",
    errRegion: "Please select at least one region.",
    loadMore: "Load More",
    show: "Show",
    sortBy: "Sort by",
    filterPhase: "Phase",
    filterArea: "Area",
    all: "All",
    inForce: "In force",
    proposal: "Proposal",
    date: "Date",
    // Law areas
    energyLaw: "Energy Law",
    labourLaw: "Labour Law",
    dataProtection: "Data Protection",
    environmentalLaw: "Environmental Law",
    taxLaw: "Tax Law",
    financialLaw: "Financial Law",
    corporateLaw: "Corporate Law",
    healthSafetyLaw: "Health and Safety Law",
    consumerProtection: "Consumer Protection",
    digitalTechLaw: "Digital / Technology Law",
    // Time ranges
    "1m": "1 Month",
    "3m": "1 Trimester",
    "6m": "1 Semester",
    "1y": "1 Year",
    // Regions
    eu: "EU",
    si: "Slovenia",
  },
  si: {
    timeRange: "Časovno obdobje",
    region: "Regija",
    searchBtn: "Iskanje zakonodaje",
    clearAll: "Počisti vse",
    results: "Rezultati",
    summary: "Povzetek",
    source: "Vir",
    importance: "Pomembnost",
    errNoProfile: "Najprej nastavite pravna področja v svojem profilu.",
    errTimeRange: "Izberite časovno obdobje.",
    errRegion: "Izberite vsaj eno regijo.",
    loadMore: "Naloži več",
    show: "Prikaži",
    sortBy: "Razvrsti po",
    filterPhase: "Faza",
    filterArea: "Področje",
    all: "Vse",
    inForce: "V veljavi",
    proposal: "Predlog",
    date: "Datum",
    // Law areas
    energyLaw: "Energy law",
    labourLaw: "Labour law",
    dataProtection: "Data protection",
    environmentalLaw: "Environmental law",
    taxLaw: "Tax law",
    financialLaw: "Financial law",
    corporateLaw: "Corporate law",
    healthSafetyLaw: "Health and safety law",
    consumerProtection: "Consumer protection",
    digitalTechLaw: "Digital / technology law",
    // Time ranges
    "1m": "1 mesec",
    "3m": "1 trimester",
    "6m": "1 semester",
    "1y": "1 leto",
    // Regions
    eu: "EU",
    si: "Slovenija",
  },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS.en;

// ── Types ──

interface LawResult {
  act: string;
  areas: string[];
  date: string;
  phase: string;
  summary: string;
  source: string;
  sourceName: string;
  importance: number;
}

const API_URL = "https://myneki.dev/ai-x-pravo/laws";

// ── Component ──

const Index = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [results, setResults] = useState<LawResult[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<"en" | "si">("en");
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "importance">("date");
  const [filterPhase, setFilterPhase] = useState<"all" | "inForce" | "proposal">("all");
  const [filterArea, setFilterArea] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Load bookmarked IDs from Firestore on mount
  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "bookmarks"));
      const ids = new Set(snap.docs.map((d) => d.id));
      setBookmarkedIds(ids);
    } catch (err) {
      console.error("Error loading bookmarks:", err);
    }
  }, [user]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const topRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const t = (key: TranslationKey) => TRANSLATIONS[lang][key];

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleSearch = async () => {
    const newErrors: Record<string, string> = {};
    if (profile.lawAreas.length === 0 && profile.describeYourNeeds.trim() === "") {
      newErrors.profile = t("errNoProfile");
    }
    if (!timeRange) newErrors.timeRange = t("errTimeRange");
    if (selectedRegions.length === 0) newErrors.region = t("errRegion");
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    setResults(null);
    setVisibleCount(pageSize);
    setSortBy("date");
    setFilterPhase("all");
    setFilterArea(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("API request failed");
      const raw = await response.json();

      const now = new Date();
      const monthsMap: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 };
      const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsMap[timeRange], now.getDate());

      const data: LawResult[] = raw
        .filter((item: any) => new Date(item.date) >= cutoff)
        .map((item: any) => ({
          act: item.title,
          areas: item.area,
          date: new Date(item.date).toLocaleDateString('sl-SI'),
          phase: "In force",
          summary: item.summary.join(" "),
          source: item.url,
          sourceName: "TFL",
          importance: item.weight * 10,
        }));

      setResults(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Error fetching laws:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setTimeRange("");
    setSelectedRegions([]);
    setResults(null);
    setErrors({});
    setIsLoading(false);
  };

  const generateBookmarkId = (row: LawResult) => {
    return row.act.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 80);
  };

  const toggleBookmark = async (row: LawResult) => {
    if (!user) return;
    const id = generateBookmarkId(row);
    const isBookmarked = bookmarkedIds.has(id);

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isBookmarked) {
        await deleteDoc(doc(db, "users", user.uid, "bookmarks", id));
      } else {
        await setDoc(doc(db, "users", user.uid, "bookmarks", id), {
          act: row.act,
          areas: row.areas,
          date: row.date,
          phase: row.phase,
          summary: row.summary,
          source: row.source,
          sourceName: row.sourceName,
          importance: row.importance,
        });
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  // Filtered & sorted results
  const processedResults = useMemo(() => {
    if (!results) return [];
    let filtered = [...results];

    if (filterPhase === "inForce") {
      const inForce = filtered.filter((r) => r.phase === "In force");
      const rest = filtered.filter((r) => r.phase !== "In force");
      filtered = [...inForce, ...rest];
    } else if (filterPhase === "proposal") {
      const proposals = filtered.filter((r) => r.phase === "Proposal");
      const rest = filtered.filter((r) => r.phase !== "Proposal");
      filtered = [...proposals, ...rest];
    }

    if (filterArea) {
        const filterAreaLabel = TRANSLATIONS[lang][filterArea as TranslationKey];
        filtered = filtered.filter((r) => r.areas.includes(filterAreaLabel));
    }

    if (sortBy === "date") {
      if (filterPhase !== "all" || filterArea) {
        const primaryCount = filtered.filter((r) => {
          if (filterPhase === "inForce") return r.phase === "In force";
          if (filterPhase === "proposal") return r.phase === "Proposal";
          if (filterArea) return r.areas.includes(filterArea);
          return true;
        }).length;
        const primary = filtered.slice(0, primaryCount).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const secondary = filtered.slice(primaryCount).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        filtered = [...primary, ...secondary];
      } else {
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } else if (sortBy === "importance") {
      filtered.sort((a, b) => b.importance - a.importance);
    }

    return filtered;
  }, [results, sortBy, filterPhase, filterArea]);

  const visibleResults = processedResults.slice(0, visibleCount);
  const hasMore = visibleCount < processedResults.length;

  // Area filter options: only areas from the user's profile
  const resultAreas = useMemo(() => {
    return profile.lawAreas;
  }, [profile.lawAreas]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[hsl(var(--header-from))] to-[hsl(var(--header-to))] shadow-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LegalRadar logo" className="h-10 w-10 object-contain" />
            <img src={appName} alt="LegalRadar" className="h-10 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-3 h-10 text-sm font-medium text-white transition-colors hover:bg-white/10"
              aria-label="Profile"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {(user?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white">
                {user?.displayName || user?.email?.split("@")[0] || "Profile"}
              </span>
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "si" : "en")}
              className="flex items-center gap-2 rounded-lg bg-white/20 px-3 h-10 text-sm font-medium text-white transition-colors hover:bg-white/30"
            >
              <img
                src={lang === "en" ? flagSi : flagUk}
                alt={lang === "en" ? "Slovenian flag" : "UK flag"}
                className="h-4 w-6 rounded-sm object-cover"
              />
              {lang === "en" ? "SI" : "EN"}
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl px-4 py-8 animate-fade-in" ref={topRef}>
        {/* Welcome Hero */}
        {user && !profileLoading && profile.lawAreas.length > 0 && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold text-foreground">
              {lang === "en" ? "Welcome back" : "Dobrodošli nazaj"}, {user.displayName || user.email?.split("@")[0]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "en"
                ? `Tracking ${profile.lawAreas.length} law area${profile.lawAreas.length !== 1 ? "s" : ""} across ${selectedRegions.length > 0 ? selectedRegions.map((r) => t(r as TranslationKey)).join(" & ") : "EU & Slovenia"}`
                : `Sledite ${profile.lawAreas.length} pravnim področjem`}
            </p>
          </div>
        )}

        {/* Profile info hint */}
        {!profileLoading && profile.lawAreas.length === 0 && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
            <p>
              Set up your <button onClick={() => navigate("/profile")} className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">law areas and business needs</button> in your profile to start searching.
            </p>
          </div>
        )}

        {errors.profile && (
          <p className="mb-4 text-sm text-destructive">{errors.profile}</p>
        )}

        {/* Time Range & Region */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <section>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-label">
              {t("timeRange")} <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGE_OPTIONS.map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => setTimeRange(tr.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    timeRange === tr.value
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {t(tr.key)}
                </button>
              ))}
            </div>
            {errors.timeRange && (
              <p className="mt-1 text-sm text-destructive">{errors.timeRange}</p>
            )}
          </section>

          <section>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-label">
              {t("region")} <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              {REGIONS_DATA.map((r) => (
                <button
                  key={r.value}
                  onClick={() => toggleRegion(r.value)}
                  className={`flex w-36 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedRegions.includes(r.value)
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <img src={r.flag} alt={`${t(r.key)} flag`} className="h-4 w-6 rounded-sm object-cover" />
                  {t(r.key)}
                </button>
              ))}
            </div>
            {errors.region && (
              <p className="mt-1 text-sm text-destructive">{errors.region}</p>
            )}
          </section>
        </div>

        {/* Search & Clear Buttons */}
        <div className="mb-10 flex gap-3">
          <Button onClick={handleSearch} size="lg" className="flex-1 text-base">
            <Search className="mr-2 h-5 w-5" /> {t("searchBtn")}
          </Button>
          <Button onClick={handleClearAll} size="lg" variant="outline" className="text-base">
            <X className="mr-2 h-4 w-4" /> {t("clearAll")}
          </Button>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div ref={resultsRef}>
            <SkeletonResults />
          </div>
        )}

        {/* Results */}
        {results && !isLoading && (
          <section ref={resultsRef}>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {t("results")} ({processedResults.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("show")}:</span>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setPageSize(size); setVisibleCount(size); }}
                    className={`rounded-md border px-3 py-1 text-sm font-medium transition-all ${
                      pageSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter / Sort Bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 sticky top-16 z-40 backdrop-blur">
              <ArrowDownNarrowWide className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{t("sortBy")}:</span>

              <button
                onClick={() => setSortBy("date")}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                  sortBy === "date"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                {t("date")}
              </button>
              <button
                onClick={() => setSortBy("importance")}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                  sortBy === "importance"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                {t("importance")}
              </button>

              <span className="mx-1 text-border">|</span>

              <span className="text-sm font-medium text-muted-foreground">{t("filterPhase")}:</span>
              {(["all", "inForce", "proposal"] as const).map((phase) => (
                <button
                  key={phase}
                  onClick={() => setFilterPhase(phase)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                    filterPhase === phase
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary"
                  }`}
                >
                  {t(phase)}
                </button>
              ))}

              <span className="mx-1 text-border">|</span>

              <span className="text-sm font-medium text-muted-foreground">{t("filterArea")}:</span>
              <button
                onClick={() => setFilterArea(null)}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                  filterArea === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary"
                }`}
              >
                {t("all")}
              </button>
              {resultAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => setFilterArea(area === filterArea ? null : area)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                    filterArea === area
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary"
                  }`}
                >
                  {t(area as TranslationKey)}
                </button>
              ))}
            </div>

            {/* Importance Score Legend */}
            <Collapsible>
              <CollapsibleTrigger className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-3.5 w-3.5" />
                {lang === "en" ? "What does the score mean?" : "Kaj pomeni ocena?"}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-green-500" /> 8–10 High relevance</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-yellow-500" /> 5–7 Medium</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-500" /> 1–4 Low</span>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Result Cards */}
            <div className="space-y-3">
              {visibleResults.map((row) => {
                const bookmarkId = generateBookmarkId(row);
                return (
                  <ResultCard
                    key={bookmarkId}
                    act={row.act}
                    areas={row.areas}
                    date={row.date}
                    phase={row.phase === "In force" ? t("inForce") : t("proposal")}
                    summary={row.summary}
                    source={row.source}
                    sourceName={row.sourceName}
                    importance={row.importance}
                    bookmarked={bookmarkedIds.has(bookmarkId)}
                    onToggleBookmark={() => toggleBookmark(row)}
                    t={{ summary: t("summary"), source: t("source") }}
                  />
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount((prev) => prev + pageSize)}
                  className="text-base"
                >
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Back to top */}
      {results && !isLoading && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Index;
