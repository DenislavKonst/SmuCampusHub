import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Clock, MapPin, Users, Filter } from 'lucide-react';
import { Link } from 'wouter';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EventWithStats } from '@shared/schema';
import heroImage from '@assets/generated_images/University_campus_students_collaborating_ecf2464f.png';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const { data: events, isLoading } = useQuery<EventWithStats[]>({
    queryKey: ['/api/events'],
  });

  const filteredEvents = events?.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesDepartment =
      selectedDepartment === 'all' || event.department === selectedDepartment;
    return matchesSearch && matchesType && matchesDepartment;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'lab':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
      case 'office_hours':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (event: EventWithStats) => {
    const percentage = (event.bookedCount / event.capacity) * 100;

    if (event.bookedCount >= event.capacity) {
      return <Badge variant="destructive" className="text-xs">Full - Waitlist</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20 text-xs">Limited</Badge>;
    } else {
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 text-xs">Available</Badge>;
    }
  };

  const formatType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const departments = [...new Set(events?.map(e => e.department) || [])];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="relative h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />

        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <div className="w-full max-w-3xl text-center space-y-6">
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
              Discover Campus Events
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md max-w-2xl mx-auto">
              Browse lectures, labs, and office hours. Book your spot instantly.
            </p>

            <div className="flex gap-2 backdrop-blur-md bg-white/10 p-2 rounded-lg border border-white/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50"
                  data-testid="input-search"
                />
              </div>
              <Button size="default" className="h-12 px-6" data-testid="button-search">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <h2 className="font-heading text-3xl font-semibold">
            {selectedType === 'all' && selectedDepartment === 'all'
              ? 'All Events'
              : 'Filtered Events'}
          </h2>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]" data-testid="select-type">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lecture">Lectures</SelectItem>
                <SelectItem value="lab">Labs</SelectItem>
                <SelectItem value="office_hours">Office Hours</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]" data-testid="select-department">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-2 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const percentage = (event.bookedCount / event.capacity) * 100;
              return (
                <Card key={event.id} className="hover-elevate group" data-testid={`card-event-${event.id}`}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-xl font-semibold line-clamp-2 flex-1">
                        {event.title}
                      </h3>
                      <Badge className={getTypeColor(event.type)}>
                        {formatType(event.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.bookedCount}/{event.capacity} spots filled
                          </span>
                        </div>
                        {getStatusBadge(event)}
                      </div>
                      <Progress value={percentage} className="h-2" />
                      {event.waitlistedCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {event.waitlistedCount} on waitlist
                        </p>
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {event.department}
                    </Badge>
                  </CardContent>

                  <CardFooter>
                    <Link href={`/events/${event.id}`} className="w-full" data-testid={`link-event-${event.id}`}>
                      <Button className="w-full h-12" size="default">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-heading text-2xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery || selectedType !== 'all' || selectedDepartment !== 'all'
                ? 'Try adjusting your filters to see more events.'
                : 'There are no events available at the moment. Check back soon!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
