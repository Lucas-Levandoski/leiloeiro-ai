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

  async create(project: Omit<Project, "id" | "createdAt" | "editalUrl" | "municipalUrl">, editalFile?: File, municipalFile?: File): Promise<Project> {
    const formData = new FormData();
    formData.append("name", project.name);
    if (project.description) formData.append("description", project.description);
    if (project.price) formData.append("price", project.price);
    if (project.estimatedPrice) formData.append("estimatedPrice", project.estimatedPrice);
    
    if (editalFile) formData.append("editalFile", editalFile);
    if (municipalFile) formData.append("municipalFile", municipalFile);

    const result = await createProjectAction(formData);
    
    if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create project");
    }
    
    this.notifyListeners();
    return result.data;
  }

  async update(id: string, updates: Partial<Omit<Project, "id" | "createdAt">>, editalFile?: File, municipalFile?: File): Promise<Project | null> {
    const formData = new FormData();
    if (updates.name !== undefined) formData.append("name", updates.name);
    if (updates.description !== undefined) formData.append("description", updates.description);
    if (updates.price !== undefined) formData.append("price", updates.price);
    if (updates.estimatedPrice !== undefined) formData.append("estimatedPrice", updates.estimatedPrice);
    if (updates.lotes !== undefined) formData.append("lotes", JSON.stringify(updates.lotes));

    if (editalFile) formData.append("editalFile", editalFile);
    if (municipalFile) formData.append("municipalFile", municipalFile);

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
