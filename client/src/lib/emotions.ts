import {
  // Positive emotion icons
  Smile, Star, Target, Zap, Heart, Sun, Trophy, Crown, 
  CheckCircle, TrendingUp, Shield, Rocket, Sparkles, Medal,
  Brain, Eye, ThumbsUp, FlameKindling, Mountain, Gem,

  // Negative emotion icons  
  Frown, AlertTriangle, CloudRain, X, RotateCcw, Skull,
  HelpCircle, Clock, Zap as ZapNeg, CloudSnow, Zap as Tremor,
  AlertCircle, TrendingDown, Puzzle, DollarSign, Wind,
  Angry as AngryIcon, Users, Flame, Tornado,

  // Neutral emotion icons
  Minus, Search, Calculator, Moon, Bot, RotateCw,
  Eye as EyeNeutral, BarChart3, AlertTriangle as CautiousIcon,
  Plus, List, Scale, Circle as Mask, Briefcase, Mountain as StoicIcon,
  Microscope, Lock, MessageCircle, Circle, Activity
} from 'lucide-react';

export interface DefaultEmotion {
  name: string;
  icon: any; // Lucide React icon component
  category: 'positive' | 'negative' | 'neutral';
}

export const defaultEmotions: DefaultEmotion[] = [
  // Positive emotions (20)
  { name: 'Confident', icon: Crown, category: 'positive' },
  { name: 'Excited', icon: Sparkles, category: 'positive' },
  { name: 'Focused', icon: Target, category: 'positive' },
  { name: 'Determined', icon: Mountain, category: 'positive' },
  { name: 'Optimistic', icon: Sun, category: 'positive' },
  { name: 'Patient', icon: Shield, category: 'positive' },
  { name: 'Grateful', icon: Heart, category: 'positive' },
  { name: 'Calm', icon: Smile, category: 'positive' },
  { name: 'Proud', icon: Medal, category: 'positive' },
  { name: 'Satisfied', icon: CheckCircle, category: 'positive' },
  { name: 'Energetic', icon: Zap, category: 'positive' },
  { name: 'Motivated', icon: Flame, category: 'positive' },
  { name: 'Relaxed', icon: Sun, category: 'positive' },
  { name: 'Hopeful', icon: Star, category: 'positive' },
  { name: 'Inspired', icon: Sparkles, category: 'positive' },
  { name: 'Ambitious', icon: Rocket, category: 'positive' },
  { name: 'Accomplished', icon: Trophy, category: 'positive' },
  { name: 'Disciplined', icon: Medal, category: 'positive' },
  { name: 'Sharp', icon: Brain, category: 'positive' },
  { name: 'Alert', icon: Eye, category: 'positive' },

  // Negative emotions (20)
  { name: 'Anxious', icon: CloudRain, category: 'negative' },
  { name: 'Frustrated', icon: X, category: 'negative' },
  { name: 'Fearful', icon: AlertTriangle, category: 'negative' },
  { name: 'Angry', icon: Flame, category: 'negative' },
  { name: 'Regretful', icon: RotateCcw, category: 'negative' },
  { name: 'Overwhelmed', icon: Tornado, category: 'negative' },
  { name: 'Doubtful', icon: HelpCircle, category: 'negative' },
  { name: 'Impatient', icon: Clock, category: 'negative' },
  { name: 'Stressed', icon: ZapNeg, category: 'negative' },
  { name: 'Worried', icon: CloudSnow, category: 'negative' },
  { name: 'Nervous', icon: Tremor, category: 'negative' },
  { name: 'Panic', icon: AlertCircle, category: 'negative' },
  { name: 'Disappointed', icon: TrendingDown, category: 'negative' },
  { name: 'Confused', icon: Puzzle, category: 'negative' },
  { name: 'Greedy', icon: DollarSign, category: 'negative' },
  { name: 'Impulsive', icon: Wind, category: 'negative' },
  { name: 'Revenge', icon: Skull, category: 'negative' },
  { name: 'FOMO', icon: Users, category: 'negative' },
  { name: 'Desperate', icon: AlertTriangle, category: 'negative' },
  { name: 'Reckless', icon: Tornado, category: 'negative' },

  // Neutral emotions (20)
  { name: 'Neutral', icon: Minus, category: 'neutral' },
  { name: 'Curious', icon: Search, category: 'neutral' },
  { name: 'Analytical', icon: Calculator, category: 'neutral' },
  { name: 'Tired', icon: Moon, category: 'neutral' },
  { name: 'Mechanical', icon: Bot, category: 'neutral' },
  { name: 'Routine', icon: RotateCw, category: 'neutral' },
  { name: 'Observant', icon: EyeNeutral, category: 'neutral' },
  { name: 'Methodical', icon: BarChart3, category: 'neutral' },
  { name: 'Cautious', icon: CautiousIcon, category: 'neutral' },
  { name: 'Calculating', icon: Calculator, category: 'neutral' },
  { name: 'Systematic', icon: List, category: 'neutral' },
  { name: 'Balanced', icon: Scale, category: 'neutral' },
  { name: 'Detached', icon: Mask, category: 'neutral' },
  { name: 'Professional', icon: Briefcase, category: 'neutral' },
  { name: 'Stoic', icon: StoicIcon, category: 'neutral' },
  { name: 'Objective', icon: Microscope, category: 'neutral' },
  { name: 'Reserved', icon: Lock, category: 'neutral' },
  { name: 'Contemplative', icon: Brain, category: 'neutral' },
  { name: 'Indifferent', icon: Circle, category: 'neutral' },
  { name: 'Steady', icon: Activity, category: 'neutral' },
];

export function getEmotionsByCategory(category?: 'positive' | 'negative' | 'neutral') {
  if (!category) return defaultEmotions;
  return defaultEmotions.filter(emotion => emotion.category === category);
}

export function findEmotionByName(name: string) {
  return defaultEmotions.find(emotion => 
    emotion.name.toLowerCase() === name.toLowerCase()
  );
}

// Icon mapping from string to component
export const iconMap: Record<string, any> = {
  // Positive emotions
  'Crown': Crown,
  'Sparkles': Sparkles,
  'Target': Target,
  'Mountain': Mountain,
  'Sun': Sun,
  'Shield': Shield,
  'Heart': Heart,
  'Smile': Smile,
  'Medal': Medal,
  'CheckCircle': CheckCircle,
  'Zap': Zap,
  'Flame': Flame,
  'Star': Star,
  'Rocket': Rocket,
  'Trophy': Trophy,
  'Brain': Brain,
  'Eye': Eye,

  // Negative emotions
  'CloudRain': CloudRain,
  'X': X,
  'AlertTriangle': AlertTriangle,
  'RotateCcw': RotateCcw,
  'Tornado': Tornado,
  'HelpCircle': HelpCircle,
  'Clock': Clock,
  'ZapNeg': ZapNeg,
  'CloudSnow': CloudSnow,
  'Tremor': Zap,
  'AlertCircle': AlertCircle,
  'TrendingDown': TrendingDown,
  'Puzzle': Puzzle,
  'DollarSign': DollarSign,
  'Wind': Wind,
  'Skull': Skull,
  'Users': Users,

  // Neutral emotions
  'Minus': Minus,
  'Search': Search,
  'Calculator': Calculator,
  'Moon': Moon,
  'Bot': Bot,
  'RotateCw': RotateCw,
  'EyeNeutral': EyeNeutral,
  'BarChart3': BarChart3,
  'CautiousIcon': CautiousIcon,
  'List': List,
  'Scale': Scale,
  'Mask': Mask,
  'Briefcase': Briefcase,
  'StoicIcon': StoicIcon,
  'Microscope': Microscope,
  'Lock': Lock,
  'Circle': Circle,
  'Activity': Activity,
};

export function getIconByName(iconName: string) {
  return iconMap[iconName] || Circle; // Fallback to Circle icon
}

// Convert default emotions to database format
export const emotionsForDatabase = defaultEmotions.map(emotion => ({
  name: emotion.name,
  icon: emotion.icon.name || Object.keys(iconMap).find(key => iconMap[key] === emotion.icon) || 'Circle',
  category: emotion.category,
  isDefault: true,
}));
