import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Loader2, User as UserIcon } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { EventWithStats, BookingWithDetails } from '@shared/schema';

export default function EventDetail() {
  const [, params] = useRoute('/events/:id');
  const eventId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery<EventWithStats>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: userBookings } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/bookings/user'],
    enabled: !!user && user.role === 'student',
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/bookings', {
        eventId: eventId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Booking successful!',
        description: 'You have been registered for this event.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Booking failed',
        description: error.message || 'Unable to book this event. Please try again.',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest('DELETE', `/api/bookings/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Cancellation failed',
        description: error.message || 'Unable to cancel booking. Please try again.',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-24 w-full mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-2/3" />
              </Card>
            </div>
            <div>
              <Card className="p-6">
                <Skeleton className="h-12 w-full" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-heading text-2xl font-semibold mb-2">Event not found</h2>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const percentage = (event.bookedCount / event.capacity) * 100;
  const isFull = event.bookedCount >= event.capacity;
  const userBooking = userBookings?.find((b) => b.eventId === eventId);
  const canBook =
    user &&
    user.role === 'student' &&
    !userBooking &&
    (user.department === event.department || user.role === 'staff');

  const formatType = (type: string | undefined) => {
    if (!type) return '';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-muted text-muted-foreground';
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/" data-testid="link-back">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <Badge className={getTypeColor(event.type)}>
                    {formatType(event.type)}
                  </Badge>
                  <Badge variant="outline">{event.department}</Badge>
                </div>
                <CardTitle className="font-heading text-3xl">{event.title}</CardTitle>
                <CardDescription className="text-base mt-4">
                  {event.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
                    <UserIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Instructor</p>
                      <p className="text-sm text-muted-foreground">{event.instructor}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="font-heading text-lg font-semibold mb-4">Capacity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {event.bookedCount} / {event.capacity} spots filled
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    {event.waitlistedCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {event.waitlistedCount} student{event.waitlistedCount > 1 ? 's' : ''} on waitlist
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Please sign in to book this event
                    </p>
                    <Link href="/login" className="w-full block">
                      <Button className="w-full h-12" data-testid="button-go-to-login">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                ) : user.role === 'staff' ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Staff members cannot book events
                    </p>
                  </div>
                ) : userBooking ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-md">
                      <p className="text-sm font-medium text-center">
                        {userBooking.status === 'confirmed' ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                            Waitlisted
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {userBooking.status === 'confirmed'
                          ? 'You are registered for this event'
                          : 'You are on the waitlist'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-12"
                      onClick={() => cancelMutation.mutate(userBooking.id)}
                      disabled={cancelMutation.isPending}
                      data-testid="button-cancel-booking"
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Booking'
                      )}
                    </Button>
                  </div>
                ) : user.department !== event.department ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This event is only available for {event.department} students
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your department: {user.department}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isFull && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                        <p className="text-xs text-center text-yellow-700 dark:text-yellow-300">
                          Event is full. You will be added to the waitlist.
                        </p>
                      </div>
                    )}
                    <Button
                      className="w-full h-12"
                      onClick={() => bookMutation.mutate()}
                      disabled={!canBook || bookMutation.isPending}
                      data-testid="button-book-event"
                    >
                      {bookMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : isFull ? (
                        'Join Waitlist'
                      ) : (
                        'Book Event'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By booking, you agree to attend the event at the scheduled time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
