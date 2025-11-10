import { Link, useLocation } from 'wouter';
import { Calendar, LayoutGrid, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-heading text-xl font-bold">SMUCampusHub</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" data-testid="link-nav-home">
              <Button
                variant={location === '/' ? 'secondary' : 'ghost'}
                size="default"
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Browse Events
              </Button>
            </Link>

            {user && (
              <Link href="/dashboard" data-testid="link-nav-dashboard">
                <Button
                  variant={location === '/dashboard' ? 'secondary' : 'ghost'}
                  size="default"
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  My Dashboard
                </Button>
              </Link>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2" data-testid="button-user-menu">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">
                        {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user.fullName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {user.role === 'staff' ? 'Staff' : 'Student'}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.department}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
