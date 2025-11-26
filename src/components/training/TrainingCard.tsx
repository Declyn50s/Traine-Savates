import { Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { TrainingSession } from '../../types/api';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface TrainingCardProps {
  session: TrainingSession;
}

export function TrainingCard({ session }: TrainingCardProps) {
  const categoryLabels: Record<string, string> = {
    adult: 'Adultes',
    junior: 'Juniors',
    nordic: 'Nordic Walking',
    prep_20km: 'Préparation 20 km',
  };

  const categoryColors: Record<string, string> = {
    adult: 'from-blue-500 to-blue-600',
    junior: 'from-green-500 to-green-600',
    nordic: 'from-purple-500 to-purple-600',
    prep_20km: 'from-orange-500 to-orange-600',
  };

  return (
    <Card>
      <CardHeader className={`bg-gradient-to-r ${categoryColors[session.category]} text-white`}>
        <h3 className="text-lg font-bold mb-1">{session.title}</h3>
        <p className="text-white/90 text-sm">{categoryLabels[session.category]}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={18} className="text-blue-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{session.day_of_week}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={18} className="text-blue-600 flex-shrink-0" />
            <span className="text-sm">
              {session.start_time}
              {session.end_time && ` - ${session.end_time}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={18} className="text-blue-600 flex-shrink-0" />
            <span className="text-sm">{session.location}</span>
          </div>

          {session.level && (
            <div className="flex items-center gap-2 text-gray-700">
              <TrendingUp size={18} className="text-blue-600 flex-shrink-0" />
              <span className="text-sm">{session.level}</span>
            </div>
          )}
        </div>

        {session.description && (
          <p className="text-gray-600 text-sm mt-4 leading-relaxed">{session.description}</p>
        )}

        {session.target_audience && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Pour qui : </span>
              {session.target_audience}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
