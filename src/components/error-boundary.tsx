"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-800">
              <AlertCircle className="h-5 w-5" />
              Failed to load section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-rose-600">
              An unexpected error occurred while loading this part of the dashboard.
            </p>
            <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100"
                onClick={() => this.setState({ hasError: false })}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
