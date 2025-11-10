import type { Request, Response, NextFunction } from "express";

// Request/Response logging middleware
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: (req as any).user?.username || 'anonymous',
  });

  // Capture original end function
  const originalEnd = res.end;
  
  // Override end to log response
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
    );
    
    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}
