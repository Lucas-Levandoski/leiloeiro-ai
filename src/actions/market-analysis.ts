'use server';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { load } from 'cheerio';
import { MarketAnalysisInput } from '@/modules/projects/models/MarketAnalysis';

interface OLXAd {
  subject: string;
  price: string;
  url: string;
  location: string;
  locationDetails?: {
    municipality?: string;
    neighbourhood?: string;
    uf?: string;
  };
}

export async function searchLoteMarketOpportunities(loteId: string) {
  const supabase = await createSupabaseServerClient();

  // 1. Fetch lote details
  const { data: lote, error: loteError } = await supabase
    .from('lotes')
    .select('city, state, details')
    .eq('id', loteId)
    .single();

  if (loteError || !lote) {
    throw new Error('Lote not found');
  }

  const city = lote.city;
  const state = lote.state;
  const neighborhood = lote.details?.neighborhood || lote.details?.bairro;
  // Try to determine the type of property, defaulting to 'imóvel' if unknown
  // Common types: Apartamento, Casa, Terreno, Comercial, Sala, Galpão, Prédio, Sítio, Chácara, Fazenda
  let type = lote.details?.type || lote.details?.tipo || 'imóvel';
  
  // Normalize type for better search results
  type = type.toLowerCase();
  if (type.includes('lote') || type.includes('gleba')) type = 'terreno';
  
  if (!city || !state) {
    throw new Error('Lote address incomplete');
  }

  // 2. Construct search query
  const query = `${type} ${neighborhood ? neighborhood + ' ' : ''}${city} ${state}`;
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.olx.com.br/brasil?q=${encodedQuery}`;

  console.log(`Searching OLX: ${searchUrl}`);

  try {
    // 3. Fetch OLX
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OLX: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);
    const nextData = $('#__NEXT_DATA__').html();

    if (!nextData) {
      throw new Error('Failed to parse OLX data');
    }

    const data = JSON.parse(nextData);
    const ads: OLXAd[] = data.props?.pageProps?.ads || [];

    // 4. Extract top 5 opportunities
    const opportunities: MarketAnalysisInput[] = ads
      .slice(0, 5)
      .map((ad) => ({
        lote_id: loteId,
        title: ad.subject,
        price: ad.price,
        url: ad.url,
        description: `Localização: ${ad.locationDetails?.municipality || ad.location} - ${ad.locationDetails?.neighbourhood || ''}`,
        source: 'OLX',
      }));

    if (opportunities.length === 0) {
      return { success: true, count: 0, message: 'No opportunities found' };
    }

    // 5. Save to database
    // First delete old analysis for this lote to avoid duplicates/stale data
    await supabase.from('lote_market_analysis').delete().eq('lote_id', loteId);

    const { error: insertError } = await supabase
      .from('lote_market_analysis')
      .insert(opportunities);

    if (insertError) {
      console.error('Error inserting analysis:', insertError);
      throw new Error('Failed to save analysis results');
    }

    return { success: true, count: opportunities.length, data: opportunities };
  } catch (error) {
    console.error('Market analysis error:', error);
    throw new Error('Failed to perform market analysis');
  }
}

export async function getLoteMarketAnalysis(loteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('lote_market_analysis')
    .select('*')
    .eq('lote_id', loteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
