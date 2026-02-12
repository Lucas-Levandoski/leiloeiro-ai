"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Briefcase, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/modules/projects/models/Project";
import { projectService } from "@/modules/projects/services/ProjectService";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="flex h-full w-full flex-col bg-background border-r">
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
            projects.map((project) => (
              <Button
                key={project.id}
                asChild
                variant={pathname === `/portal/projects/${project.id}` ? "secondary" : "ghost"}
                className="w-full justify-start font-normal truncate"
              >
                <Link href={`/portal/projects/${project.id}`}>
                   {project.name}
                </Link>
              </Button>
            ))
          )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <Button asChild className="w-full">
          <Link href="/portal/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>
    </div>
  );
}
