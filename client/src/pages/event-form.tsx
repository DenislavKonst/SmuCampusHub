import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertEventSchema, type InsertEvent, type Event } from '@shared/schema';

export default function EventForm() {
  const [, setLocation] = useLocation();
  const [isEditMode, params] = useRoute('/events/:id/edit');
  const eventId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId && isEditMode,
  });

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'lecture',
      department: user?.department || '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      capacity: 30,
      instructor: user?.fullName || '',
      instructorId: user?.id || '',
    },
  });

  useEffect(() => {
    if (event && isEditMode) {
      form.reset({
        title: event.title,
        description: event.description,
        type: event.type,
        department: event.department,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        capacity: event.capacity,
        instructor: event.instructor,
        instructorId: event.instructorId,
      });
    }
  }, [event, isEditMode, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      return apiRequest('POST', '/api/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Event created!',
        description: 'The event has been created successfully.',
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Creation failed',
        description: error.message || 'Unable to create event.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      return apiRequest('PUT', `/api/events/${eventId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Event updated!',
        description: 'The event has been updated successfully.',
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message || 'Unable to update event.',
      });
    },
  });

  function onSubmit(data: InsertEvent) {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  if (!user || user.role !== 'staff') {
    setLocation('/');
    return null;
  }

  if (eventLoading && isEditMode) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-12 bg-muted animate-pulse rounded" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" data-testid="link-back-dashboard">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-3xl">
                {isEditMode ? 'Edit Event' : 'Create New Event'}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? 'Update the event details below'
                  : 'Fill in the details to create a new event'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Introduction to Algorithms"
                            {...field}
                            data-testid="input-title"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed description of the event..."
                            {...field}
                            data-testid="input-description"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-event-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lecture">Lecture</SelectItem>
                              <SelectItem value="lab">Lab</SelectItem>
                              <SelectItem value="office_hours">Office Hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Computer Science">Computer Science</SelectItem>
                              <SelectItem value="Mathematics">Mathematics</SelectItem>
                              <SelectItem value="Physics">Physics</SelectItem>
                              <SelectItem value="Engineering">Engineering</SelectItem>
                              <SelectItem value="Business">Business</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-date"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-start-time"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-end-time"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Room 301, Building A"
                              {...field}
                              data-testid="input-location"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-capacity"
                              className="h-12"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of students
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Instructor name"
                            {...field}
                            data-testid="input-instructor"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Link href="/dashboard" className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12"
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      className="flex-1 h-12"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        isEditMode ? 'Update Event' : 'Create Event'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
