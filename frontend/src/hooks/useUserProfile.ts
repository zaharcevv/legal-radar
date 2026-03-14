import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  email: string;
  lawAreas: string[];
  companyWebsite: string;
  describeYourNeeds: string;
}

const DEFAULT_PROFILE: UserProfile = {
  email: "",
  lawAreas: [],
  companyWebsite: "",
  describeYourNeeds: "",
};

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          email: data.email || user.email || "",
          lawAreas: data.lawAreas || [],
          companyWebsite: data.companyWebsite || "",
          describeYourNeeds: data.describeYourNeeds || "",
        });
      } else {
        // Initialize profile document
        const initial: UserProfile = {
          email: user.email || "",
          lawAreas: [],
          companyWebsite: "",
          describeYourNeeds: "",
        };
        await setDoc(doc(db, "users", user.uid), initial);
        setProfile(initial);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      const updated = { ...profile, ...updates };
      setProfile(updated);
      try {
        await setDoc(doc(db, "users", user.uid), updated, { merge: true });
      } catch (err) {
        console.error("Error saving user profile:", err);
      }
    },
    [user, profile]
  );

  return { profile, loading, saveProfile, refetch: fetchProfile };
};
