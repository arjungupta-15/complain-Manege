import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Added axios import

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  // Removed otpData state as OTP will be handled by backend
  // const [otpData, setOtpData] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedToken = localStorage.getItem('token'); // Retrieve token
    
    if (savedUser && savedAuth === 'true' && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      // Attach token to user object for easier access if needed
      setUser({ ...parsedUser, token: savedToken });
      setIsAuthenticated(true);
      // Set default Authorization header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    } else {
      // Ensure we are not authenticated if no valid session found
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
    }
  }, []);

  // Mock encryption function - keep if used elsewhere, otherwise remove
  const encryptData = (data) => {
    return btoa(JSON.stringify(data)); // Simple base64 encoding for demo
  };

  // Mock decryption function - keep if used elsewhere, otherwise remove
  const decryptData = (encryptedData) => {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      return null;
    }
  };

  // Generate OTP - now triggers backend to send OTP
  const generateOTP = async (email) => {
    try {
      // This function internally calls loginStudent, which now correctly uses '/api/auth/student/login'
      // No direct change needed here, as loginStudent will be updated below.
      await loginStudent({ email }); // Call loginStudent (which handles OTP generation on backend)
      return true; // OTP request initiated successfully
    } catch (error) {
      console.error('Error requesting OTP:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Failed to generate OTP.');
    }
  };

  // Verify OTP - now calls backend for verification
  const verifyOTP = async (email, otp) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/student/verify-otp', { email, otp });
      const { token } = response.data;

      // Fetch user details or use info from token if sufficient
      // For this example, let's assume the backend returns a basic user object with the token
      const userInfo = {
        email,
        role: 'student',
        name: email.split('@')[0],
        loginTime: Date.now(),
        token: token, // Store the token
      };

      setUser(userInfo);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', token); // Store the token

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return true;
    } catch (error) {
      console.error('OTP verification failed:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Invalid OTP or verification failed.');
    }
  };

  // Admin login function (already updated)
  const loginAdmin = async ({ email, password }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
        email,
        password,
      });

      const { token } = response.data;
      const userInfo = {
        email,
        role: 'admin',
        name: 'Administrator',
        loginTime: Date.now(),
        token: token,
      };

      setUser(userInfo);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', token);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return true;
    } catch (error) {
      console.error('Admin login failed:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Invalid admin credentials');
    }
  };

  // Student signup function
  const signupStudent = async ({ name, email, password }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/student/signup', {
        name,
        email,
        password,
      });
      // Assuming signup automatically logs in or returns a token to log in
      // For now, after successful signup, we can navigate to login page or auto-login
      // If auto-login, you'd get token and set user/isAuthenticated here
      console.log('Student signup response:', response.data);
      return true; // Indicate success
    } catch (error) {
      console.error('Student signup failed:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create account.');
    }
  };

  // Admin signup function (new)
  const signupAdmin = async ({ email, password }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/admin/signup', {
        email,
        password,
      });
      console.log('Admin signup response:', response.data);
      return true; // Indicate success
    } catch (error) {
      console.error('Admin signup failed:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create admin account.');
    }
  };

  // Student login function (triggers OTP generation on backend)
  const loginStudent = async ({ email, password }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/student/login', { email, password });
      // The response here indicates OTP sent, not full login
      return response.data.message; // Should be 'OTP sent'
    } catch (error) {
      console.error('Student login failed:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Invalid student credentials.');
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // setOtpData(null); // Removed
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token'); // Remove token
    // localStorage.removeItem('otpData'); // Removed
    delete axios.defaults.headers.common['Authorization']; // Clear auth header
  };

  const value = {
    isAuthenticated,
    user,
    generateOTP,
    verifyOTP,
    loginAdmin,
    signupStudent,
    signupAdmin, // Expose signupAdmin
    loginStudent,
    encryptData,
    decryptData,
    logout // Ensure logout is exposed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 