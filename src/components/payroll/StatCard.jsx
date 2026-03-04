import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendUp ? "text-green-600" : "text-red-500"
              )}>
                <span>{trendUp ? "↑" : "↓"}</span>
                <span>{trend}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
    </Card>
  );
}