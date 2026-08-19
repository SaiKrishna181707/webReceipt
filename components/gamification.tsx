'use client'
import { Award, Flame, Target, Trophy, Zap, Star, FileText } from 'lucide-react'

interface GamificationProps {
  streak?: number
  level?: number
  xp?: number
  maxXp?: number
  achievements?: Achievement[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
}

export function GamificationPanel({ streak = 0, level = 1, xp = 0, maxXp = 100, achievements = [] }: GamificationProps) {
  const xpPercentage = Math.min((xp / maxXp) * 100, 100)

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Level Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            <span className="font-bold">Level {level}</span>
          </div>
          <span className="text-sm text-gray-400">{xp} / {maxXp} XP</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Streak Counter */}
      {streak > 0 && (
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="relative">
            <Flame size={24} className="text-orange-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
          </div>
          <div>
            <p className="font-bold text-orange-400">{streak} Day Streak</p>
            <p className="text-xs text-gray-400">Keep it going!</p>
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award size={18} className="text-purple-400" />
            Achievements
          </h4>
          <div className="space-y-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  achievement.unlocked
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : 'bg-white/5 border border-white/10 opacity-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked ? 'bg-purple-500/20' : 'bg-white/5'
                }`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-gray-400">{achievement.description}</p>
                </div>
                {achievement.progress !== undefined && (
                  <div className="text-xs font-medium text-purple-400">
                    {achievement.progress}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <Zap size={20} className="text-yellow-400 mx-auto mb-1" />
          <p className="text-lg font-bold">12</p>
          <p className="text-xs text-gray-400">This Week</p>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <Target size={20} className="text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold">89%</p>
          <p className="text-xs text-gray-400">Accuracy</p>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <Star size={20} className="text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold">4.8</p>
          <p className="text-xs text-gray-400">Rating</p>
        </div>
      </div>
    </div>
  )
}

// Achievement definitions
export const achievementDefinitions: Achievement[] = [
  {
    id: 'first-contract',
    title: 'First Contract',
    description: 'Create your first evidence-backed contract',
    icon: <FileText size={20} className="text-white" />,
    unlocked: false,
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day monitoring streak',
    icon: <Flame size={20} className="text-white" />,
    unlocked: false,
  },
  {
    id: 'accuracy-95',
    title: 'Precision Master',
    description: 'Achieve 95% validation accuracy',
    icon: <Target size={20} className="text-white" />,
    unlocked: false,
  },
  {
    id: 'contracts-100',
    title: 'Century Club',
    description: 'Create 100 contracts',
    icon: <Award size={20} className="text-white" />,
    unlocked: false,
    progress: 45,
  },
]