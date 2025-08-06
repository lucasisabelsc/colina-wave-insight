import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  groupName: string;
  clientName: string;
  lastMessage: {
    text: string;
    timestamp: string;
  };
  waitingTime: {
    value: number;
    unit: "minutes" | string;
  };
  priority: "high" | "medium" | "low";
  messageCount: number;
}

export function AlertCard({
  groupName,
  clientName,
  lastMessage,
  waitingTime,
  priority,
  messageCount
}: AlertCardProps) {
  const priorityConfig = {
    high: {
      color: "destructive",
      animation: "animate-pulse-glow",
      badge: "Urgente"
    },
    medium: {
      color: "warning",
      animation: "",
      badge: "Atenção"
    },
    low: {
      color: "muted",
      animation: "",
      badge: "Normal"
    }
  };

  const config = priorityConfig[priority];

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-elevation",
      config.animation,
      priority === "high" && "border-destructive/30 bg-destructive/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{groupName}</CardTitle>
          <Badge variant={config.color as any} className="text-xs">
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{clientName}</span>
        </div>
        
        <div className="text-sm text-foreground bg-muted/30 p-2 rounded">
        "{lastMessage.text}"
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
              <span>
                Aguardando há{" "}
                {Math.floor(waitingTime.value / 60) > 0 && `${Math.floor(waitingTime.value / 60)}h `}
                {waitingTime.value % 60}min
              </span>
            </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>{messageCount} msg{messageCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <Button size="sm" className="w-full mt-3" variant={priority === "high" ? "destructive" : "outline"}>
          Responder Agora
        </Button>
      </CardContent>
    </Card>
  );
}