import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../utils/api';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  totalWins: number;
  totalGames: number;
  winRate: number;
  currentStreak: number;
  subject: string;
}

interface LeaderboardProps {
  onBack?: () => void;
}

type SortMode = 'wins' | 'winRate';

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { request } = useApi();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('wins');

  const fetchLeaderboard = async () => {
    try {
      const response = await request('/games/leaderboard/global');
      setLeaderboard(response);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getSortedLeaderboard = () => {
    if (sortMode === 'winRate') {
      return [...leaderboard].sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalWins - a.totalWins;
      }).map((entry, index) => ({ ...entry, rank: index + 1 }));
    }
    return leaderboard;
  };

  const getPodiumColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-amber-600 to-amber-700';
    return 'from-gray-100 to-gray-200';
  };

  const getPodiumIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getSubjectEmoji = (subject: string) => {
    return subject === 'math' ? '🔢' : '🧠';
  };

  const sortedData = getSortedLeaderboard();
  const topThree = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f5f0] to-[#e8e8dd] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f0] to-[#e8e8dd] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 top-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">←</span>
            </button>
          )}
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-600">Top players and their achievements</p>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortMode('wins')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              sortMode === 'wins'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🏅 Most Wins
          </button>
          <button
            onClick={() => setSortMode('winRate')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              sortMode === 'winRate'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🎯 Best Accuracy
          </button>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-6 space-y-3">
            {topThree.map((entry) => {
              const isCurrentUser = user?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`bg-gradient-to-r ${getPodiumColor(entry.rank)} rounded-2xl p-4 shadow-lg ${
                    isCurrentUser ? 'ring-4 ring-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="text-4xl">
                      {getPodiumIcon(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {entry.username}
                          {isCurrentUser && <span className="text-sm ml-1">(You)</span>}
                        </h3>
                        <span className="text-xl">{getSubjectEmoji(entry.subject)}</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-gray-700">
                        <span className="font-semibold">
                          {sortMode === 'wins' ? `${entry.totalWins} wins` : `${entry.winRate}% accuracy`}
                        </span>
                        <span>•</span>
                        <span>{entry.totalGames} games</span>
                        {entry.currentStreak > 0 && (
                          <>
                            <span>•</span>
                            <span>🔥 {entry.currentStreak} days</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Rank Number */}
                    <div className="text-3xl font-bold text-gray-700">
                      #{entry.rank}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest of Leaderboard */}
        {restOfList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {restOfList.map((entry) => {
                const isCurrentUser = user?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-cyan-100 to-cyan-200 border-2 border-cyan-400'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isCurrentUser ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {entry.rank}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {entry.username}
                            {isCurrentUser && <span className="text-sm text-cyan-600 ml-1">(You)</span>}
                          </span>
                          <span>{getSubjectEmoji(entry.subject)}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-600 mt-0.5">
                          <span className="font-medium">
                            {sortMode === 'wins' ? `${entry.totalWins}W` : `${entry.winRate}%`}
                          </span>
                          <span>•</span>
                          <span>{entry.totalGames}G</span>
                          {entry.currentStreak > 0 && (
                            <>
                              <span>•</span>
                              <span>🔥{entry.currentStreak}d</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats Badge */}
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-700">
                          {sortMode === 'wins' ? entry.totalWins : `${entry.winRate}%`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sortMode === 'wins' ? 'wins' : 'rate'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Players Yet</h3>
            <p className="text-gray-600">Be the first to play and top the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
