import { supabase } from "@/lib/supabaseClient";
import { Project } from "../models/Project";

const BUCKET_NAME = "project-files";

class ProjectService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      fileUrl: row.file_url,
      createdAt: row.created_at,
    };
  }

  private notifyListeners(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("project-update"));
    }
  }

  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
    return (data || []).map(this.mapToProject);
  }

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return null;
    }
    return this.mapToProject(data);
  }

  async create(project: Omit<Project, "id" | "createdAt" | "fileUrl">, file?: File): Promise<Project> {
    let fileUrl = "";

    if (file) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
        
      fileUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: project.name,
        description: project.description,
        file_url: fileUrl || null,
      })
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("No data returned from insert");
    
    this.notifyListeners();
    return this.mapToProject(data[0]);
  }

  async update(id: string, updates: Partial<Omit<Project, "id" | "createdAt">>, file?: File): Promise<Project | null> {
    let fileUrl = updates.fileUrl;

    if (file) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
        
      fileUrl = publicUrl;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {
      name: updates.name,
      description: updates.description,
    };
    
    if (fileUrl !== undefined) {
      updatePayload.file_url = fileUrl;
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return null;
    
    this.notifyListeners();
    return this.mapToProject(data[0]);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    this.notifyListeners();
  }
}

export const projectService = new ProjectService();
