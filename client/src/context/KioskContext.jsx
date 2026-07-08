import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const KioskContext = createContext();

export const KioskProvider = ({ children }) => {
  const [deviceToken, setDeviceToken] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cek token di localStorage saat aplikasi pertama kali dimuat
  useEffect(() => {
    const token = localStorage.getItem('kiosk_token');
    const storedRoomInfo = localStorage.getItem('kiosk_room');
    
    if (token && storedRoomInfo) {
      setDeviceToken(token);
      setRoomInfo(JSON.parse(storedRoomInfo));
      setIsActivated(true);
    }
    setLoading(false);
  }, []);

  const activate = async (token) => {
    try {
      const response = await api.post('/kiosk/activate', { token });
      const { roomId, roomName, kapasitas } = response.data;
      
      const newRoomInfo = { roomId, roomName, kapasitas };
      
      localStorage.setItem('kiosk_token', token);
      localStorage.setItem('kiosk_room', JSON.stringify(newRoomInfo));
      
      setDeviceToken(token);
      setRoomInfo(newRoomInfo);
      setIsActivated(true);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const deactivate = () => {
    localStorage.removeItem('kiosk_token');
    localStorage.removeItem('kiosk_room');
    setDeviceToken(null);
    setRoomInfo(null);
    setIsActivated(false);
  };

  // kioskLogin & kioskLogout removed as kiosk no longer requires human login

  return (
    <KioskContext.Provider value={{ 
      deviceToken, 
      roomInfo, 
      isActivated, 
      activate, 
      deactivate,
      loading 
    }}>
      {children}
    </KioskContext.Provider>
  );
};
