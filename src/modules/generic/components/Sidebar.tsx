"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Briefcase, FolderOpen, ChevronRight, ChevronDown, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/modules/projects/models/Project";
import { projectService } from "@/modules/projects/services/ProjectService";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BankLogo } from "@/components/BankLogo";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAll();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Listen for updates
    const handleProjectUpdate = () => {
      fetchProjects();
    };

    window.addEventListener("project-update", handleProjectUpdate);

    return () => {
      window.removeEventListener("project-update", handleProjectUpdate);
    };
  }, []);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  return (
    <div className={cn("flex h-full w-full flex-col bg-background border-r", className)}>
      <div className="flex items-center px-4 py-4">
        <Briefcase className="mr-2 h-6 w-6" />
        <span className="font-semibold text-lg tracking-tight">Oportunidades</span>
      </div>
      <Separator />
      
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {loading ? (
             <div className="space-y-2 px-2">
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
             </div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center flex flex-col items-center">
              <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
              <p>Nenhum projeto</p>
            </div>
          ) : (
            projects.map((project) => {
              const isExpanded = expandedProjects[project.id];
              const lotes = project.lotes || [];
              const sortedLotes = [...lotes].sort((a, b) => {
                  if (a.is_favorite === b.is_favorite) {
                      return a.title.localeCompare(b.title);
                  }
                  return a.is_favorite ? -1 : 1;
              });
              const isActive = pathname.startsWith(`/portal/projects/${project.id}`);

              return (
                <div key={project.id} className="mb-1">
                  <div className={cn(
                      "flex items-center gap-1 rounded-md transition-colors",
                      isActive ? "bg-accent/50" : "hover:bg-accent/20"
                  )}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 hover:bg-transparent"
                        onClick={() => toggleProject(project.id)}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className={cn(
                          "w-full justify-start font-normal truncate h-9 px-2 hover:bg-transparent",
                          pathname === `/portal/projects/${project.id}` && "font-medium"
                      )}
                    >
                      <Link 
                        href={`/portal/projects/${project.id}`} 
                        className="flex items-center gap-2 w-full"
                        onClick={onNavigate}
                      >
                        <BankLogo bankName={project.details?.bankName} size="sm" />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-2 animate-in slide-in-from-left-2 duration-200">
                         {sortedLotes.length === 0 ? (
                             <p className="text-xs text-muted-foreground py-1 px-3">Sem lotes</p>
                         ) : (
                             sortedLotes.map(lote => (
                                 <Button
                                   key={lote.id}
                                   asChild
                                   variant={pathname === `/portal/projects/${project.id}/lotes/${lote.id}` ? "secondary" : "ghost"}
                                   className="w-full justify-start font-normal truncate h-8 text-sm px-3"
                                >
                                   <Link 
                                    href={`/portal/projects/${project.id}/lotes/${lote.id}`} 
                                    className="flex items-center gap-2"
                                    onClick={onNavigate}
                                   >
                                       {lote.is_favorite ? (
                                           <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                       ) : (
                                           <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                                       )}
                                       <span className="truncate">{lote.title}</span>
                                   </Link>
                                </Button>
                             ))
                         )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <Button asChild className="w-full">
          <Link href="/portal/projects/new" onClick={onNavigate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>
    </div>
  );
}
