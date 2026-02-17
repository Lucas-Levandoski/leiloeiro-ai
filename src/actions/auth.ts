'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/portal')
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient()

  // Get current origin from headers to ensure correct redirect URL in all environments
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = (headersList.get('x-forwarded-proto') ?? 'http').split(',')[0]
  const origin = `${protocol}://${host}`

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Check if email confirmation is required? usually yes.
  // But for now redirect to portal or a "check email" page.
  // If email confirmation is disabled, it logs in automatically.
  
  revalidatePath('/', 'layout')
  redirect('/portal')
}

export async function signout() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
