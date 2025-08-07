import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, TrendingUp } from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  todayMessages: number;
  avgResponseTime: string;
  lastActivity: string;
  status: "active" | "waiting" | "idle";
}

interface GroupsTableProps {
  groups: GroupData[];
}

export function GroupsTable({ groups }: GroupsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success text-success-foreground">Ativo</Badge>;
      case "waiting":
        return <Badge variant="destructive">Aguardando</Badge>;
      case "idle":
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Grupos Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Hoje
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  Tempo Resp.
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold text-foreground">{group.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Última atividade: {group.lastActivity}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {group.todayMessages}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`${
                    group.avgResponseTime.includes('min') && parseInt(group.avgResponseTime) > 30
                      ? 'text-warning' 
                      : 'text-success'
                  }`}>
                    {group.avgResponseTime}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(group.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
