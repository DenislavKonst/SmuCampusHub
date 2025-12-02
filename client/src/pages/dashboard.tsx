import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Plus,
  Edit,
  Download,
  Trash2,
  Users,
  CalendarPlus,
} from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { BookingWithDetails, EventWithStats } from '@shared/schema';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/bookings/user'],
    enabled: !!user && user.role === 'student',
  });

  const { data: events, isLoading: eventsLoading } = useQuery<EventWithStats[]>({
    queryKey: ['/api/events/staff'],
    enabled: !!user && user.role === 'staff',
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest('DELETE', `/api/bookings/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/user'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Cancellation failed',
        description: error.message || 'Unable to cancel booking.',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest('DELETE', `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/staff'] });
      toast({
        title: 'Event deleted',
        description: 'The event has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Deletion failed',
        description: error.message || 'Unable to delete event.',
      });
    },
  });

  const handleExportCSV = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-attendees.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: 'Attendee list has been downloaded.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Unable to export attendee list.',
      });
    }
  };

  const handleAddToCalendar = (booking: BookingWithDetails) => {
    const event = booking.event;
    const eventDate = new Date(event.date);
    
    const parseTime = (timeStr: string): { hours: number; minutes: number } => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return { hours: 9, minutes: 0 };
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3];
      
      if (period) {
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      
      return { hours, minutes };
    };

    const escapeICSText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');
    };

    const foldLine = (line: string): string => {
      if (line.length <= 75) return line;
      const result: string[] = [];
      let remaining = line;
      result.push(remaining.slice(0, 75));
      remaining = remaining.slice(75);
      while (remaining.length > 0) {
        result.push(' ' + remaining.slice(0, 74));
        remaining = remaining.slice(74);
      }
      return result.join('\r\n');
    };
    
    const startTime = parseTime(event.startTime);
    const endTime = parseTime(event.endTime);
    
    const startDate = new Date(eventDate);
    startDate.setHours(startTime.hours, startTime.minutes, 0, 0);
    
    const endDate = new Date(eventDate);
    endDate.setHours(endTime.hours, endTime.minutes, 0, 0);
    
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    const uid = `${booking.id}@smucampushub`;
    const now = formatICSDate(new Date());
    
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SMUCampusHub//Event Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `DTSTAMP:${now}`,
      `UID:${uid}`,
      `CREATED:${now}`,
      foldLine(`DESCRIPTION:${escapeICSText(event.description)}`),
      `LAST-MODIFIED:${now}`,
      foldLine(`LOCATION:${escapeICSText(event.location)}`),
      'SEQUENCE:0',
      'STATUS:CONFIRMED',
      foldLine(`SUMMARY:${escapeICSText(event.title)}`),
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    
    const icsContent = lines.join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Calendar file downloaded',
      description: 'Open the .ics file to add the event to your calendar.',
    });
  };

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (user.role === 'student') {
    const confirmedBookings = bookings?.filter((b) => b.status === 'confirmed') || [];
    const waitlistedBookings = bookings?.filter((b) => b.status === 'waitlisted') || [];

    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="font-heading text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">
              View and manage your event bookings
            </p>
          </div>

          {bookingsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold mb-4">
                  Confirmed Bookings ({confirmedBookings.length})
                </h2>
                {confirmedBookings.length > 0 ? (
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => (
                      <Card key={booking.id} className="hover-elevate" data-testid={`card-booking-${booking.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="font-heading text-xl mb-2">
                                {booking.event.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {booking.event.description}
                              </CardDescription>
                            </div>
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 shrink-0">
                              Confirmed
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {booking.event.startTime} - {booking.event.endTime}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {booking.event.location}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-4">
                            <Link href={`/events/${booking.event.id}`} className="flex-1" data-testid={`link-view-event-${booking.id}`}>
                              <Button variant="outline" className="w-full">
                                View Event
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAddToCalendar(booking)}
                              data-testid={`button-calendar-${booking.id}`}
                            >
                              <CalendarPlus className="h-4 w-4 mr-2" />
                              Add to Calendar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  data-testid={`button-cancel-${booking.id}`}
                                >
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel your booking for "{booking.event.title}"?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelMutation.mutate(booking.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Cancel Booking
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-heading text-lg font-semibold mb-2">
                      No confirmed bookings
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start by browsing available events
                    </p>
                    <Link href="/">
                      <Button>Browse Events</Button>
                    </Link>
                  </Card>
                )}
              </div>

              <div>
                <h2 className="font-heading text-2xl font-semibold mb-4">
                  Waitlisted Events ({waitlistedBookings.length})
                </h2>
                {waitlistedBookings.length > 0 ? (
                  <div className="space-y-4">
                    {waitlistedBookings.map((booking) => (
                      <Card key={booking.id} className="hover-elevate" data-testid={`card-waitlist-${booking.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="font-heading text-xl mb-2">
                                {booking.event.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {booking.event.description}
                              </CardDescription>
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 shrink-0">
                              Waitlisted
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {booking.event.startTime} - {booking.event.endTime}
                          </div>
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            You'll be automatically promoted if a spot opens up
                          </p>
                          <div className="flex gap-2">
                            <Link href={`/events/${booking.event.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Event
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => cancelMutation.mutate(booking.id)}
                              disabled={cancelMutation.isPending}
                            >
                              Leave Waitlist
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-heading text-lg font-semibold mb-2">
                      No waitlisted events
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You're not on any waitlists at the moment
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Staff Dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-4xl font-bold mb-2">Event Management</h1>
            <p className="text-muted-foreground">
              Create and manage university events
            </p>
          </div>
          <Link href="/events/create" data-testid="link-create-event">
            <Button size="default" className="gap-2 h-12">
              <Plus className="h-5 w-5" />
              Create Event
            </Button>
          </Link>
        </div>

        {eventsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-semibold">Event Name</th>
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold">Department</th>
                    <th className="p-4 font-semibold">Capacity</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr
                      key={event.id}
                      className={`border-b last:border-0 hover-elevate ${
                        index % 2 === 0 ? 'bg-muted/30' : ''
                      }`}
                      data-testid={`row-event-${event.id}`}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {event.description}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{new Date(event.date).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            {event.startTime} - {event.endTime}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{event.department}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>
                            {event.bookedCount} / {event.capacity}
                          </p>
                          {event.waitlistedCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              +{event.waitlistedCount} waitlisted
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportCSV(event.id)}
                            title="Export CSV"
                            data-testid={`button-export-${event.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Link href={`/events/${event.id}/edit`} data-testid={`link-edit-${event.id}`}>
                            <Button variant="ghost" size="icon" title="Edit Event">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Event"
                                data-testid={`button-delete-${event.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete event?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{event.title}"? This will cancel all
                                  bookings. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEventMutation.mutate(event.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete Event
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-2xl font-semibold mb-2">
              No events created yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first event to get started
            </p>
            <Link href="/events/create">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Create Event
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
