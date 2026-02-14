'use server'

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Project } from "@/modules/projects/models/Project";
import { revalidatePath } from "next/cache";

const BUCKET_NAME = "project-files";

function mapToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    editalUrl: row.file_url, // Changed from edital_url to file_url
    createdAt: row.created_at,
    lotes: row.lotes || [],
    details: row.details || {},
  };
}

export async function uploadFile(file: File): Promise<string> {
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*, lotes(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return (data || []).map(mapToProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, lotes(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }
  return mapToProject(data);
}

export async function getProjectLotes(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lotes")
    .select("*")
    .eq("project_id", projectId);
    
  if (error) {
    console.error("Error fetching lotes:", error);
    return [];
  }
  return data;
}

export async function getLoteById(loteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lotes")
    .select("*, projects(*)")
    .eq("id", loteId)
    .single();

  if (error) {
    console.error("Error fetching lote:", error);
    return null;
  }
  return data;
}

export async function createProjectAction(formData: FormData): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const editalFile = formData.get("editalFile") as File | null;
    const lotesJson = formData.get("lotes") as string;
    const detailsJson = formData.get("details") as string;

    let editalUrl = "";

    if (editalFile && editalFile.size > 0) {
      editalUrl = await uploadFile(editalFile);
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        file_url: editalUrl || null,
        details: detailsJson ? JSON.parse(detailsJson) : {},
        user_id: user.id
      })
      .select();

    if (error) throw error;
    
    // Insert Lotes if present
    if (lotesJson && data[0]?.id) {
      try {
        const lotes = JSON.parse(lotesJson);
        if (Array.isArray(lotes) && lotes.length > 0) {
          const lotesToInsert = lotes.map((lote: any) => ({
            project_id: data[0].id,
            title: lote.title || `Lote ${lote.id || 'Unknown'}`,
            description: lote.description || lote.rawContent || '',
            price: lote.price,
            estimated_price: lote.estimatedPrice || lote.valuation,
            city: lote.city,
            state: lote.state,
            auction_prices: lote.auction_prices,
            details: lote,
            user_id: user.id
          }));

          const { error: lotesError } = await supabase
            .from("lotes")
            .insert(lotesToInsert);

          if (lotesError) {
            console.error("Error inserting lotes:", lotesError);
            // We don't throw here to avoid failing the project creation, but we log it.
          }
        }
      } catch (e) {
        console.error("Error parsing lotes JSON:", e);
      }
    }
    
    revalidatePath("/portal");
    return { success: true, data: mapToProject(data[0]) };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleLoteFavorite(loteId: string, isFavorite: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("lotes")
      .update({ is_favorite: isFavorite })
      .eq("id", loteId);

    if (error) throw error;

    revalidatePath("/portal");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProjectAction(id: string, formData: FormData): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    const editalFile = formData.get("editalFile") as File | null;
    const lotesJson = formData.get("lotes") as string;
    const detailsJson = formData.get("details") as string;

    // Prepare update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    
    const name = formData.get("name");
    if (name !== null) updatePayload.name = name;

    const description = formData.get("description");
    if (description !== null) updatePayload.description = description;

    if (detailsJson) {
        try {
            updatePayload.details = JSON.parse(detailsJson);
        } catch(e) {
            console.error("Invalid details json", e);
        }
    }

    if (editalFile && editalFile.size > 0) {
      updatePayload.file_url = await uploadFile(editalFile);
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error) throw error;
    
    // Update/Insert Lotes if present
    if (lotesJson) {
      try {
        const lotes = JSON.parse(lotesJson);
        if (Array.isArray(lotes)) {
           const existingLotes = await getProjectLotes(id);
           const existingIds = existingLotes ? existingLotes.map((l: any) => l.id) : [];
           const newIds = lotes.map((l: any) => l.id).filter((lid: string) => lid && lid.length > 10); 
           
           // Delete removed lotes
           const idsToDelete = existingIds.filter((eid: string) => !newIds.includes(eid));
           if (idsToDelete.length > 0) {
               await supabase.from("lotes").delete().in("id", idsToDelete);
           }
           
           // Upsert (Insert or Update)
           const lotesToUpsert = lotes.map((lote: any) => {
             const isNew = !lote.id || lote.id.length < 10;
             const payload: any = {
                project_id: id,
                title: lote.title || `Lote ${lote.id || 'Unknown'}`,
                description: lote.description || lote.rawContent || '',
                price: lote.price,
                estimated_price: lote.estimatedPrice || lote.valuation,
                city: lote.city,
                state: lote.state,
                auction_prices: lote.auction_prices,
                details: lote,
                user_id: user.id
             };
             
             if (!isNew) {
                 payload.id = lote.id;
             }
             return payload;
           });

           if (lotesToUpsert.length > 0) {
               const { error: lotesError } = await supabase
                 .from("lotes")
                 .upsert(lotesToUpsert);
                 
               if (lotesError) console.error("Error upserting lotes:", lotesError);
           }
        }
      } catch (e) {
        console.error("Error parsing lotes JSON for update:", e);
      }
    }

    revalidatePath("/portal");
    revalidatePath(`/portal/projects/${id}`);
    
    // Fetch fresh project with lotes to return
    const updatedProject = await getProjectById(id);
    return { success: true, data: updatedProject || mapToProject(data[0]) };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLoteAction(loteId: string, loteData: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    const payload: any = {
        title: loteData.title || `Lote ${loteData.id || 'Unknown'}`,
        description: loteData.description || loteData.rawContent || '',
        price: loteData.price,
        estimated_price: loteData.estimatedPrice || loteData.valuation,
        city: loteData.city,
        state: loteData.state,
        auction_prices: loteData.auction_prices,
        details: loteData,
        // user_id: user.id // Usually not needed for update if RLS handles it or if it's already set
    };

    const { data, error } = await supabase
      .from("lotes")
      .update(payload)
      .eq("id", loteId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/portal");
    revalidatePath(`/portal/projects/${data.project_id}`);
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Error updating lote:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    
    revalidatePath("/portal");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return { success: false, error: error.message };
  }
}