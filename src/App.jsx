import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import Signup from './Components/Signup';
import Login from './Components/Login';
import Chat from './Components/Chat';
import { Toaster } from 'react-hot-toast';
import Lottie from 'lottie-react';
import loading from './assets/Loading.json';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setEmailVerified(user.emailVerified);
        if (!user.emailVerified) {
          user.reload().then(() => {
            setEmailVerified(user.emailVerified);
          });
        }
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        {/* <Lottie animationData={loading} loop={true} className="w-64 h-64" /> */}
        <div className="text-2xl font-semibold text-gray-800 mt-4">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="flex flex-col h-screen bg-gray-100">
        <Routes>
          <Route path="/signup" element={user ? <Navigate to="/chat" /> : <Signup />} />
          <Route path="/login" element={user ? <Navigate to="/chat" /> : <Login />} />
          <Route 
            path="/chat" 
            element={
              user ? (
                emailVerified ? (
                  <Chat />
                ) : (
                  <Navigate to="/verify-email" />
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/verify-email" 
            element={
              user && !emailVerified ? (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                  <h1 className="text-2xl font-semibold text-gray-800 mb-4">Please verify your email</h1>
                  <p className="text-gray-600 mb-4">Check your inbox and click the verification link to access the chat.</p>
                  <button 
                    onClick={() => {
                      auth.currentUser.reload().then(() => {
                        setEmailVerified(auth.currentUser.emailVerified);
                      });
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  >
                    I've verified my email
                  </button>
                </div>
              ) : (
                <Navigate to="/chat" />
              )
            }
          />
          <Route path="/" element={<Navigate to={user ? "/chat" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;