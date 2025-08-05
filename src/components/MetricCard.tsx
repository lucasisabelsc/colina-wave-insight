import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  className?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  className,
  variant = "default" 
}: MetricCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    destructive: "border-destructive/30 bg-destructive/5"
  };

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive"
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-elevation hover:scale-[1.02]",
      variantStyles[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {change && (
            <p className={cn(
              "text-xs flex items-center gap-1",
              change.type === "increase" ? "text-success" : "text-destructive"
            )}>
              <span className={cn(
                "inline-block w-0 h-0 border-l-2 border-r-2 border-l-transparent border-r-transparent",
                change.type === "increase" 
                  ? "border-b-2 border-b-success" 
                  : "border-t-2 border-t-destructive"
              )} />
              {change.value}% desde ontem
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}