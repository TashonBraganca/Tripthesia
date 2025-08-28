"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, TrendingDown, TrendingUp, AlertCircle, DollarSign, Calendar, Clock } from 'lucide-react';

interface PriceTrackerProps {
  transportOption: {
    id: string;
    type: string;
    provider: string;
    route: string;
    currentPrice: number;
    currency: string;
  };
  onPriceAlert?: (alertData: PriceAlert) => void;
}

interface PriceAlert {
  id: string;
  transportId: string;
  alertType: 'drop' | 'threshold' | 'increase';
  threshold: number;
  enabled: boolean;
  notificationEmail?: string;
}

interface PriceHistory {
  date: string;
  price: number;
  change?: number;
  changePercent?: number;
}

export default function PriceTracker({ transportOption, onPriceAlert }: PriceTrackerProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(transportOption.currentPrice * 0.9);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    loadPriceHistory();
  }, [transportOption.id]);

  const loadPriceHistory = async () => {
    // Simulate loading price history - replace with real API
    const mockHistory: PriceHistory[] = [];
    const basePrice = transportOption.currentPrice;
    
    // Generate 7 days of mock price history
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 0.2; // ±20% variation
      const price = Math.round(basePrice * (1 + variation));
      const prevPrice = mockHistory.length > 0 ? mockHistory[mockHistory.length - 1].price : price;
      const change = price - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
      
      mockHistory.push({
        date: date.toISOString().split('T')[0],
        price,
        change: mockHistory.length > 0 ? change : 0,
        changePercent: mockHistory.length > 0 ? changePercent : 0,
      });
    }
    
    setPriceHistory(mockHistory);
  };

  const createPriceAlert = () => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      transportId: transportOption.id,
      alertType: 'threshold',
      threshold: alertThreshold,
      enabled: true,
      notificationEmail: notificationEmail || undefined,
    };
    
    setAlerts([...alerts, newAlert]);
    setTracking(true);
    setShowAlertForm(false);
    onPriceAlert?.(newAlert);
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, enabled: !alert.enabled }
        : alert
    ));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    if (alerts.length <= 1) {
      setTracking(false);
    }
  };

  const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : null;
  const priceChange = currentPrice?.change || 0;
  const priceChangePercent = currentPrice?.changePercent || 0;

  const getLowestPrice = () => {
    if (priceHistory.length === 0) return null;
    return Math.min(...priceHistory.map(h => h.price));
  };

  const getHighestPrice = () => {
    if (priceHistory.length === 0) return null;
    return Math.max(...priceHistory.map(h => h.price));
  };

  return (
    <motion.div 
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Price Tracking
          </h3>
          <p className="text-sm text-gray-600">
            {transportOption.provider} • {transportOption.route}
          </p>
        </div>
        
        <motion.button
          onClick={() => setShowAlertForm(!showAlertForm)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            tracking
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-indigo-100 text-indigo-700 border border-indigo-300 hover:bg-indigo-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="h-4 w-4 inline mr-2" />
          {tracking ? 'Tracking' : 'Track Prices'}
        </motion.button>
      </div>

      {/* Current Price Display */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current Price</p>
            <p className="text-3xl font-bold text-gray-900">
              ${transportOption.currentPrice}
            </p>
          </div>
          
          {priceHistory.length > 1 && (
            <motion.div 
              className={`flex items-center space-x-1 ${
                priceChange > 0 ? 'text-red-600' : 
                priceChange < 0 ? 'text-green-600' : 'text-gray-600'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {priceChange > 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : priceChange < 0 ? (
                <TrendingDown className="h-5 w-5" />
              ) : null}
              <div className="text-right">
                <p className="font-semibold">
                  {priceChange > 0 ? '+' : ''}${Math.abs(priceChange)}
                </p>
                <p className="text-xs">
                  {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Price History Stats */}
      {priceHistory.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Lowest (7 days)</p>
            <p className="text-xl font-bold text-green-600">${getLowestPrice()}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Highest (7 days)</p>
            <p className="text-xl font-bold text-red-600">${getHighestPrice()}</p>
          </div>
        </div>
      )}

      {/* Price Chart (Simple) */}
      {priceHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">7-Day Price History</h4>
          <div className="h-24 flex items-end space-x-1">
            {priceHistory.map((entry, index) => {
              const maxPrice = Math.max(...priceHistory.map(h => h.price));
              const minPrice = Math.min(...priceHistory.map(h => h.price));
              const height = ((entry.price - minPrice) / (maxPrice - minPrice)) * 80 + 10;
              
              return (
                <motion.div
                  key={entry.date}
                  className={`flex-1 rounded-t ${
                    entry.price === transportOption.currentPrice ? 'bg-indigo-500' :
                    entry.price === minPrice ? 'bg-green-500' :
                    entry.price === maxPrice ? 'bg-red-500' : 'bg-gray-400'
                  }`}
                  style={{ height: `${height}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}px` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  title={`${entry.date}: $${entry.price}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{priceHistory[0]?.date}</span>
            <span>{priceHistory[priceHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Alert Form */}
      <AnimatePresence>
        {showAlertForm && (
          <motion.div
            className="border border-gray-200 rounded-lg p-4 space-y-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="font-medium text-gray-900 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Set Price Alert
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert when price drops below:
                </label>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email notifications (optional):
                </label>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <motion.button
                onClick={createPriceAlert}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Alert
              </motion.button>
              <motion.button
                onClick={() => setShowAlertForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Active Price Alerts</h4>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.enabled 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                <Bell className={`h-4 w-4 ${alert.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Alert when price drops below ${alert.threshold}
                  </p>
                  {alert.notificationEmail && (
                    <p className="text-xs text-gray-600">
                      Email: {alert.notificationEmail}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => toggleAlert(alert.id)}
                  className={`px-3 py-1 text-xs rounded ${
                    alert.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {alert.enabled ? 'Enabled' : 'Disabled'}
                </motion.button>
                <motion.button
                  onClick={() => deleteAlert(alert.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ×
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Insights */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-blue-600" />
          Price Insights
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Prices typically drop 2-3 weeks before departure</li>
          <li>• Tuesday and Wednesday often have lower prices</li>
          <li>• Book early morning or late evening for better deals</li>
          {getLowestPrice() && getLowestPrice()! < transportOption.currentPrice && (
            <li>• Current price is ${transportOption.currentPrice - getLowestPrice()!} above the recent low</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}