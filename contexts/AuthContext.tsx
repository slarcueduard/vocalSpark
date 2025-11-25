// src/contexts/AuthContext.tsx

// ... (importuri existente)

interface AuthContextType {
  // ... (celelalte câmpuri)
  isTrialExpired: boolean; // Câmp nou
}

// ...

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... (state-uri existente)
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
          if (!docSnap.exists()) {
             // ... (Logica de creare user nou rămâne la fel)
          } else {
            const data = docSnap.data() as UserProfile;
            // ... (Setare profil și credite rămâne la fel)

            // --- LOGICA DE EXPIRARE TRIAL ---
            if (data.subscriptionTier === 'trial' && data.createdAt) {
               // @ts-ignore
               const startDate = data.createdAt.toDate(); 
               const now = new Date();
               const diffTime = Math.abs(now.getTime() - startDate.getTime());
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               const remaining = 5 - diffDays;
               setDaysRemaining(remaining > 0 ? remaining : 0);
               setIsTrialExpired(remaining <= 0); // Dacă au trecut 5 zile, e expirat
            } else {
               setDaysRemaining(30); 
               setIsTrialExpired(false); // Dacă e pe abonament, nu expiră așa
            }
          }
          setLoading(false);
        });
        return () => unsubscribeSnapshot();
      }
      // ...
    });
    return unsubscribeAuth;
  }, []);

  // Modificăm checkCredits să blocheze dacă e expirat
  const checkCredits = (cost: number) => {
    if (isTrialExpired) return false; // Blocat total
    return credits >= cost;
  };

  return (
    <AuthContext.Provider value={{ 
      // ... (celelalte valori)
      isTrialExpired, // Exportăm starea
      checkCredits
    }}>
      {children}
    </AuthContext.Provider>
  );
};
