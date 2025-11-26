import { Clock, MapPin, Users, Trophy } from 'lucide-react';
import { RaceCategory } from '../../types/api';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface RaceCardProps {
  race: RaceCategory;
  onDetailsClick?: () => void;
}

export function RaceCard({ race, onDetailsClick }: RaceCardProps) {
  const typeLabels: Record<string, string> = {
    adult: 'Adultes',
    junior: 'Juniors',
    walking: 'Walking',
    villageoise: 'Villageoise',
  };

  return (
    <Card hoverable onClick={onDetailsClick}>
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-1">{race.name}</h3>
            <p className="text-orange-100 text-sm">{typeLabels[race.type]}</p>
          </div>
          <div className="bg-white text-orange-600 px-3 py-1 rounded-full font-bold text-lg">
            {race.distance_km} km
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={18} className="text-orange-600 flex-shrink-0" />
            <span className="text-sm">Départ : {race.start_time}</span>
          </div>

          {race.start_location && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={18} className="text-orange-600 flex-shrink-0" />
              <span className="text-sm">{race.start_location}</span>
            </div>
          )}

          {(race.min_age || race.max_age) && (
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={18} className="text-orange-600 flex-shrink-0" />
              <span className="text-sm">
                {race.min_age && race.max_age
                  ? `${race.min_age}-${race.max_age} ans`
                  : race.min_age
                  ? `Dès ${race.min_age} ans`
                  : `Jusqu'à ${race.max_age} ans`}
              </span>
            </div>
          )}

          {race.price && (
            <div className="flex items-center gap-2 text-gray-700">
              <Trophy size={18} className="text-orange-600 flex-shrink-0" />
              <span className="text-sm font-semibold">CHF {race.price}.-</span>
            </div>
          )}
        </div>

        {race.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{race.description}</p>
        )}

        {onDetailsClick && (
          <Button variant="outline" size="sm" className="w-full">
            Voir les détails
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
