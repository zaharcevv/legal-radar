import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bookmark, LogOut, Undo2, ExternalLink, Save, Scale, Globe, FileText, BookmarkX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import appName from "@/assets/app-name.png";

const LAW_AREA_KEYS = [
  "energyLaw", "labourLaw", "dataProtection", "environmentalLaw",
  "taxLaw", "financialLaw", "corporateLaw", "healthSafetyLaw",
  "consumerProtection", "digitalTechLaw",
] as const;

const LAW_AREA_LABELS: Record<string, string> = {
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
};

interface BookmarkItem {
  id: string;
  act: string;
  area?: string;
  areas?: string[];
  date: string;
  phase: string;
  summary: string;
  source: string;
  sourceName: string;
  importance: number;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, saveProfile } = useUserProfile();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoItem, setUndoItem] = useState<BookmarkItem | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Local form state for profile fields
  const [localAreas, setLocalAreas] = useState<string[]>([]);
  const [localWebsite, setLocalWebsite] = useState("");
  const [localNeeds, setLocalNeeds] = useState("");
  const [dirty, setDirty] = useState(false);

  // Sync local state when profile loads
  useEffect(() => {
    if (!profileLoading) {
      setLocalAreas(profile.lawAreas);
      setLocalWebsite(profile.companyWebsite);
      setLocalNeeds(profile.describeYourNeeds);
    }
  }, [profile, profileLoading]);

  const toggleArea = (area: string) => {
    setLocalAreas((prev) => {
      const next = prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area];
      setDirty(true);
      return next;
    });
  };

  const handleSaveProfile = async () => {
    await saveProfile({
      lawAreas: localAreas,
      companyWebsite: localWebsite,
      describeYourNeeds: localNeeds,
    });
    setDirty(false);
    toast.success("Profile saved successfully");
  };

  // Profile completion
  const profileCompletion = useMemo(() => {
    let steps = 0;
    if (localAreas.length > 0) steps++;
    if (localWebsite.trim()) steps++;
    if (localNeeds.trim()) steps++;
    return steps;
  }, [localAreas, localWebsite, localNeeds]);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "bookmarks"));
      const items: BookmarkItem[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookmarkItem));
      items.sort((a, b) => b.importance - a.importance);
      setBookmarks(items);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  const removeBookmark = async (item: BookmarkItem) => {
    if (!user) return;
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoItem(null);
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== item.id));
    setUndoItem(item);
    const timer = setTimeout(async () => {
      try {
        await deleteDoc(doc(db, "users", user.uid, "bookmarks", item.id));
      } catch (err) {
        console.error("Error deleting bookmark:", err);
        setBookmarks((prev) => [...prev, item].sort((a, b) => b.importance - a.importance));
      }
      setUndoItem(null);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleUndo = async () => {
    if (!undoItem || !user) return;
    if (undoTimer) clearTimeout(undoTimer);
    setBookmarks((prev) => [...prev, undoItem].sort((a, b) => b.importance - a.importance));
    try {
      const { id, ...data } = undoItem;
      await setDoc(doc(db, "users", user.uid, "bookmarks", id), data);
    } catch (err) {
      console.error("Error restoring bookmark:", err);
    }
    setUndoItem(null);
    setUndoTimer(null);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[hsl(var(--header-from))] to-[hsl(var(--header-to))] shadow-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logo} alt="LegalRadar logo" className="h-10 w-10 object-contain" />
            <img src={appName} alt="LegalRadar" className="h-10 object-contain" />
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to search
        </button>

        {/* User Info */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-bold text-foreground mb-2">Profile</h1>

          {/* Profile Completion */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{profileCompletion}/3 sections completed</span>
              <span className="text-xs font-medium text-foreground">{Math.round((profileCompletion / 3) * 100)}%</span>
            </div>
            <Progress value={(profileCompletion / 3) * 100} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            <span className="font-medium text-foreground">Email:</span>{" "}
            <span className="text-primary">{user?.email}</span>
          </p>

          {/* Law Areas */}
          <div className="mb-5">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-label flex items-center gap-2">
              <Scale className="h-4 w-4" /> Law Areas
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">Select areas relevant to your business</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LAW_AREA_KEYS.map((key) => {
                const selected = localAreas.includes(key);
                const disabled = false;
                return (
                  <button
                    key={key}
                    onClick={() => toggleArea(key)}
                    disabled={disabled}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all text-center ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : disabled
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                        : "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    {LAW_AREA_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Website */}
          <div className="mb-5">
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wider text-label">
              <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Company Website <span className="normal-case font-normal text-muted-foreground">(optional)</span></span>
            </label>
            <Input
              value={localWebsite}
              onChange={(e) => { setLocalWebsite(e.target.value); setDirty(true); }}
              placeholder="https://www.your-company.com"
              type="url"
            />
          </div>

          {/* Describe Your Needs */}
          <div className="mb-5">
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wider text-label flex items-center gap-2">
              <FileText className="h-4 w-4" /> Describe Your Needs
            </label>
            <Textarea
              value={localNeeds}
              onChange={(e) => { setLocalNeeds(e.target.value); setDirty(true); }}
              placeholder="e.g. We are an energy company operating solar farms in Slovenia and need to track any new EU regulations on renewable energy subsidies..."
              className="min-h-[100px] resize-y"
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSaveProfile} disabled={!dirty} className="w-full sm:w-auto bg-label hover:bg-label/90 text-white">
            <Save className="mr-2 h-4 w-4" /> Save Profile
          </Button>
        </div>

        {/* Bookmarks */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Saved Bookmarks ({bookmarks.length})
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading bookmarks…</p>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
              <BookmarkX className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No bookmarks saved yet</p>
              <button onClick={() => navigate("/")} className="mt-2 text-sm text-primary hover:underline">
                Start bookmarking from search results →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-start gap-3"
                >
                  <button
                    onClick={() => removeBookmark(item)}
                    className="shrink-0 text-primary transition-colors hover:text-destructive mt-0.5"
                    aria-label="Remove bookmark"
                  >
                    <Bookmark className="h-5 w-5" fill="currentColor" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground leading-snug">{item.act}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {(item.areas || (item.area ? [item.area] : [])).map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">{LAW_AREA_LABELS[a] || a}</Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">{item.phase}</Badge>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    {item.summary && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.summary}</p>
                    )}
                    {item.source && (
                      <a
                        href={item.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {item.sourceName} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-muted">
                    {item.importance.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Undo toast */}
      {undoItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm text-foreground">Bookmark removed</span>
          <Button size="sm" variant="outline" onClick={handleUndo}>
            <Undo2 className="mr-1 h-3 w-3" /> Undo
          </Button>
        </div>
      )}
    </div>
  );
};

export default Profile;
