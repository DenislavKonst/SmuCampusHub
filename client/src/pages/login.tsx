import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { loginSchema, type LoginCredentials, type AuthResponse } from '@shared/schema';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginCredentials) {
    setIsLoading(true);
    try {
      const response = await apiRequest<AuthResponse>('POST', '/api/auth/login', data);
      login(response.token, response.user);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${response.user.fullName}`,
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-10 w-10 text-primary" />
            <span className="font-heading text-3xl font-bold">SMUCampusHub</span>
          </div>
          <CardTitle className="font-heading text-2xl">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials to access the event booking platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        data-testid="input-username"
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        data-testid="input-password"
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading}
                data-testid="button-submit-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 border-t pt-6">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Demo Accounts for Testing:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium">Student Account:</p>
                <p className="text-muted-foreground">Username: alice / Password: password123</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium">Staff Account:</p>
                <p className="text-muted-foreground">Username: dr.smith / Password: password123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
