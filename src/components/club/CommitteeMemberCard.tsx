import { Mail, Phone } from 'lucide-react';
import { CommitteeMember } from '../../types/api';
import { Card, CardContent } from '../ui/Card';

interface CommitteeMemberCardProps {
  member: CommitteeMember;
}

export function CommitteeMemberCard({ member }: CommitteeMemberCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="mb-4 mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {member.first_name[0]}
            {member.last_name[0]}
          </div>

          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {member.first_name} {member.last_name}
          </h3>

          <p className="text-orange-600 font-semibold text-sm mb-4">{member.role}</p>

          <div className="space-y-2">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Mail size={16} />
                <span>{member.email}</span>
              </a>
            )}

            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Phone size={16} />
                <span>{member.phone}</span>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
