import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Card, CardContent } from '@/components/ui/card'
import { StartChatButton } from '@/features/chat/components/StartChatButton'
import type { PublicProfile } from '@/types/database'

interface MemberCardProps {
  member: PublicProfile
  cityName?: string
  isSelf?: boolean
}

export function MemberCard({ member, cityName, isSelf }: MemberCardProps) {
  const showCity = member.privacy_settings.show_city && cityName

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Link to={`/profile/${member.alias}`}>
          <Avatar src={member.avatar_url} alias={member.alias} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${member.alias}`}
            className="font-semibold hover:text-accent"
          >
            @{member.alias}
          </Link>
          {showCity && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {cityName}
            </p>
          )}
          {member.privacy_settings.show_description && member.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {member.description}
            </p>
          )}
        </div>
        {!isSelf && member.privacy_settings.allow_messages && (
          <StartChatButton
            otherUserId={member.id}
            otherAlias={member.alias}
            size="sm"
            compact
          />
        )}
      </CardContent>
    </Card>
  )
}
