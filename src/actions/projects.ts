'use server'

import { supabase } from "@/lib/supabaseServer";
import { Project } from "@/modules/projects/models/Project";
import { revalidatePath } from "next/cache";

const BUCKET_NAME = "project-files";

function mapToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    editalUrl: row.edital_url,
    municipalUrl: row.municipal_url,
    price: row.price,
    estimatedPrice: row.estimated_price,
    createdAt: row.created_at,
  };
}

async function uploadFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
  
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: file.type,
    });

  if (uploadError) throw uploadError;
  
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);
    
  return publicUrl;
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return (data || []).map(mapToProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }
  return mapToProject(data);
}

export async function createProjectAction(formData: FormData): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const estimatedPrice = formData.get("estimatedPrice") as string;
    const editalFile = formData.get("editalFile") as File | null;
    const municipalFile = formData.get("municipalFile") as File | null;

    let editalUrl = "";
    let municipalUrl = "";

    if (editalFile && editalFile.size > 0) {
      editalUrl = await uploadFile(editalFile);
    }

    if (municipalFile && municipalFile.size > 0) {
      municipalUrl = await uploadFile(municipalFile);
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        edital_url: editalUrl || null,
        municipal_url: municipalUrl || null,
        price: price || null,
        estimated_price: estimatedPrice || null,
      })
      .select();

    if (error) throw error;
    
    revalidatePath("/portal");
    return { success: true, data: mapToProject(data[0]) };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProjectAction(id: string, formData: FormData): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const editalFile = formData.get("editalFile") as File | null;
    const municipalFile = formData.get("municipalFile") as File | null;

    // Prepare update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    
    const name = formData.get("name");
    if (name !== null) updatePayload.name = name;

    const description = formData.get("description");
    if (description !== null) updatePayload.description = description;

    const price = formData.get("price");
    if (price !== null) updatePayload.price = price;

    const estimatedPrice = formData.get("estimatedPrice");
    if (estimatedPrice !== null) updatePayload.estimated_price = estimatedPrice;

    if (editalFile && editalFile.size > 0) {
      updatePayload.edital_url = await uploadFile(editalFile);
    }

    if (municipalFile && municipalFile.size > 0) {
      updatePayload.municipal_url = await uploadFile(municipalFile);
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error) throw error;
    
    revalidatePath("/portal");
    revalidatePath(`/portal/projects/${id}`);
    return { success: true, data: mapToProject(data[0]) };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    
    revalidatePath("/portal");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return { success: false, error: error.message };
  }
}
