import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateShortCode } from '@/lib/utils/short-code';
import { copyImageToPublic } from '@/lib/utils/copy-image-to-public';

interface CreateShareLinkRequest {
  shortCode?: string; // Optional pre-generated code
  imageUrl?: string;  // Image URL to generate signed URL from
  styleId?: string;
  sceneId?: string;
  wardrobeId?: string;
  colorId?: string;
  quality?: string;
  aspectRatio?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: CreateShareLinkRequest = await request.json();
    const { shortCode: providedCode, imageUrl, styleId, sceneId, wardrobeId, colorId, quality, aspectRatio } = body;
    
    // Debug logging to verify received parameters
    console.log('[Share Create] Received parameters:', {
      styleId,
      sceneId,
      wardrobeId,
      colorId,
      quality,
      aspectRatio,
      hasImageUrl: !!imageUrl
    });
    
    // Validate that at least one parameter is provided
    if (!styleId && !sceneId && !wardrobeId && !colorId) {
      return NextResponse.json({ 
        error: 'At least one style parameter is required' 
      }, { status: 400 });
    }
    
    let shortCode: string = '';
    
    // Use provided code or generate a new one
    if (providedCode) {
      // Validate the provided code
      if (!/^[0-9a-zA-Z]{6}$/.test(providedCode)) {
        return NextResponse.json({ 
          error: 'Invalid short code format' 
        }, { status: 400 });
      }
      
      // Check if code already exists
      const { data: existing } = await supabase
        .from('share_links')
        .select('id')
        .eq('short_code', providedCode)
        .maybeSingle();
      
      if (existing) {
        return NextResponse.json({ 
          error: 'Short code already exists' 
        }, { status: 409 });
      }
      
      shortCode = providedCode;
    } else {
      // Generate unique short code with retry logic
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const tempCode = generateShortCode(6);
        
        // Check if code already exists
        const { data: existing } = await supabase
          .from('share_links')
          .select('id')
          .eq('short_code', tempCode)
          .maybeSingle();
        
        if (!existing) {
          shortCode = tempCode;
          break;
        }
        attempts++;
      }
      
      if (attempts === maxAttempts || !shortCode) {
        return NextResponse.json({ 
          error: 'Failed to generate unique code' 
        }, { status: 500 });
      }
    }
    
    // Copy image to public S3 path (if provided)
    let publicImageUrl: string | null = null;
    if (imageUrl) {
      try {
        console.log('Copying image to public S3 path for sharing');
        publicImageUrl = await copyImageToPublic(imageUrl, shortCode);
        console.log('Image copied successfully:', publicImageUrl);
      } catch (error) {
        console.error('Failed to copy image to public S3:', error);
        // Continue without public image - not critical for link creation
      }
    } else {
      console.log('No imageUrl provided, skipping image copy');
    }
    
    // Create share link (expires in 1 year)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // Debug: Log what we're about to insert
    const insertData = {
      short_code: shortCode,
      style_id: styleId,
      scene_id: sceneId,
      wardrobe_id: wardrobeId,
      color_id: colorId,
      quality,
      aspect_ratio: aspectRatio,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
      signed_image_url: publicImageUrl
    };
    console.log('[Share Create] Inserting into DB:', insertData);
    
    const { data, error } = await supabase
      .from('share_links')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating share link:', error);
      return NextResponse.json({ 
        error: 'Failed to create share link' 
      }, { status: 500 });
    }
    
    // Build share URL using environment variable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${data.short_code}`;
    
    return NextResponse.json({ 
      shortCode: data.short_code,
      shareUrl,
      publicImageUrl // Return the public image URL for sharing
    });
    
  } catch (error) {
    console.error('Error in share/create:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

