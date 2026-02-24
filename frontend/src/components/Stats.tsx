import React, { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useApi } from '../utils/api';

interface DashboardResponse {
  overview: {
    totalGames: number;
    overallAccuracy: number;
    currentStreak: number;
    longestStreak: number;
    multiplayerWinRate: number;
  };
  subjectStats: {
    mathAccuracy: number;
    logicAccuracy: number;
  };
  soloStats: {
    totalGames: number;
    averageScore: number;
    bestScore: number;
  };
  multiplayerStats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  performanceOverTime: Array<{
    date: string;
    soloAverageScore: number | null;
    multiplayerAverageScore: number | null;
  }>;
  recentGames: Array<{
    gameId: string;
    date: string;
    mode: 'solo' | 'multiplayer';
    score: number;
    result: string;
  }>;
}

interface StatsProps {
  onBack: () => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await request('/stats/dashboard');
        setDashboard(data);
      } catch (error: any) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !dashboard) {
    return (
      <div className="flex flex-col min-h-screen bg-amber-50 items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-xl font-bold text-gray-900">Loading dashboard...</p>
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Performance Dashboard</h1>
            <p className="text-gray-500 text-sm mt-2">Track your progress across all games</p>
          </div>
          <button 
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-6 rounded-2xl transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Overview Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Games</p>
              <p className="text-4xl font-bold text-cyan-600">{dashboard.overview.totalGames}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Overall Accuracy</p>
              <p className="text-4xl font-bold text-blue-600">{dashboard.overview.overallAccuracy}%</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Current Streak</p>
              <p className="text-4xl font-bold text-orange-600">{dashboard.overview.currentStreak}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Win Rate</p>
              <p className="text-4xl font-bold text-green-600">{dashboard.overview.multiplayerWinRate}%</p>
            </div>
          </div>

          {/* Subject & Mode Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Accuracy */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📊 By Subject</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">🔢 Mathematics</span>
                  <span className="text-xl font-bold text-blue-600">{dashboard.subjectStats.mathAccuracy}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">🧠 Logic & IQ</span>
                  <span className="text-xl font-bold text-purple-600">{dashboard.subjectStats.logicAccuracy}%</span>
                </div>
              </div>
            </div>

            {/* Solo Stats */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">👤 Solo Mode</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">Games</span>
                  <span className="text-xl font-bold text-gray-700">{dashboard.soloStats.totalGames}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">Avg Score</span>
                  <span className="text-xl font-bold text-gray-700">{dashboard.soloStats.averageScore}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">Best Score</span>
                  <span className="text-xl font-bold text-yellow-600">{dashboard.soloStats.bestScore}%</span>
                </div>
              </div>
            </div>

            {/* Multiplayer Stats */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🎮 Multiplayer</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">Games</span>
                  <span className="text-xl font-bold text-gray-700">{dashboard.multiplayerStats.totalGames}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">Wins</span>
                  <span className="text-xl font-bold text-green-600">{dashboard.multiplayerStats.wins}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                  <span className="text-gray-700 font-semibold">Losses</span>
                  <span className="text-xl font-bold text-red-600">{dashboard.multiplayerStats.losses}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Performance Over Time (Last 30 Days)</h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [value === null ? 'N/A' : `${value}%`, 'Avg Score']} />
                  <Legend />
                  <Line type="monotone" dataKey="soloAverageScore" name="Solo" stroke="#3b82f6" strokeWidth={3} connectNulls />
                  <Line type="monotone" dataKey="multiplayerAverageScore" name="Multiplayer" stroke="#10b981" strokeWidth={3} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Games Table */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Recent Games</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
                    <th className="px-4 py-3 text-left font-bold text-sm">Date</th>
                    <th className="px-4 py-3 text-left font-bold text-sm">Mode</th>
                    <th className="px-4 py-3 text-left font-bold text-sm">Score</th>
                    <th className="px-4 py-3 text-left font-bold text-sm">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.recentGames.map((game) => (
                    <tr key={game.gameId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{new Date(game.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          game.mode === 'solo' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {game.mode === 'solo' ? '👤 Solo' : '🎮 Multi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{game.score}%</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          game.result === 'passed' 
                            ? 'bg-green-100 text-green-800'
                            : game.result === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {game.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
