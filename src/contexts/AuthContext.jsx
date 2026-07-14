import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [workerUser, setWorkerUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load worker from localStorage on boot
    const storedWorker = localStorage.getItem('workerUser');
    if (storedWorker) {
      setWorkerUser(JSON.parse(storedWorker));
    }

    // Firebase listener for Admin
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const adminLogin = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const adminLogout = async () => {
    return signOut(auth);
  };

  const workerLogin = (workerData) => {
    localStorage.setItem('workerUser', JSON.stringify(workerData));
    setWorkerUser(workerData);
  };

  const workerLogout = () => {
    localStorage.removeItem('workerUser');
    setWorkerUser(null);
  };

  const value = {
    adminUser,
    workerUser,
    adminLogin,
    adminLogout,
    workerLogin,
    workerLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
