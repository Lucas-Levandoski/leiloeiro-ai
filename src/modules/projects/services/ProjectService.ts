import { Project } from "../models/Project";
import { 
  getProjects, 
  getProjectById, 
  createProjectAction, 
  updateProjectAction, 
  deleteProjectAction 
} from "@/actions/projects";

class ProjectService {
  private notifyListeners(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("project-update"));
    }
  }

  async getAll(): Promise<Project[]> {
    return await getProjects();
  }

  async getById(id: string): Promise<Project | null> {
    return await getProjectById(id);
  }

  async create(project: Omit<Project, "id" | "createdAt" | "editalUrl" | "municipalUrl">, editalFile?: File): Promise<Project> {
    const formData = new FormData();
    formData.append("name", project.name);
    if (project.description) formData.append("description", project.description);
    if (project.details) formData.append("details", JSON.stringify(project.details));
    
    if (editalFile) formData.append("editalFile", editalFile);

    const result = await createProjectAction(formData);
    
    if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create project");
    }
    
    this.notifyListeners();
    return result.data;
  }

  async update(id: string, updates: Partial<Omit<Project, "id" | "createdAt">>, editalFile?: File): Promise<Project | null> {
    const formData = new FormData();
    if (updates.name !== undefined) formData.append("name", updates.name);
    if (updates.description !== undefined) formData.append("description", updates.description);
    if (updates.lotes !== undefined) formData.append("lotes", JSON.stringify(updates.lotes));
    if (updates.details !== undefined) formData.append("details", JSON.stringify(updates.details));

    if (editalFile) formData.append("editalFile", editalFile);

    const result = await updateProjectAction(id, formData);
    
    if (!result.success) {
        throw new Error(result.error || "Failed to update project");
    }
    
    if (result.data) {
        this.notifyListeners();
        return result.data;
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    const result = await deleteProjectAction(id);
    if (!result.success) {
        throw new Error(result.error || "Failed to delete project");
    }
    this.notifyListeners();
  }
}

export const projectService = new ProjectService();
