import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface ImageInput {
  filename: string;
  data: string; // base64
}

const CLAUDE_PROMPT = `Analyze 9 portrait photos for AI training. Check quality and enforce diversity.

**PER-IMAGE QUALITY CHECKS:**

1. **Face Count:** Must be exactly 1. Reject if 0 or 2+. To count an extra face, we have to see at least one eye.
2. **Sharpness:** Must be clear and sharp. Reject if blurry or pixelated.
3. **Filters:** Subtle OK. Reject strong beauty/color/distortion filters.
4. **Quality Scores (0-100):** Rate brightness, contrast, saturation

**SIMILARITY DETECTION - TWO-STEP APPROACH:**

**STEP 1: Is this the EXACT same photo session?**

**CRITICAL: IGNORE the person's face/identity! The same person can take photos in MANY different sessions!**
**Focus ONLY on: Background/Location, Clothing, Lighting**

A "photo session" means ALL 3 of these are TRUE:

1. **EXACT Same Location - Look at BACKGROUND, not face:**
   
   **MANDATORY LOCATION CHECKS (look at background ONLY):**
   - Is background indoor or outdoor? If different → Score < 20
   - Indoor types: office, home, restaurant, gym, car, etc.
   - Outdoor types: beach, ocean, street, park, nature, etc.
   - **Ocean/beach background vs any indoor = Score < 20 (NOT similar at all)**
   - **Different indoor rooms = Score < 50 (different locations)**
   - **Same room with same furniture/walls = Score 90+**
   
   **Step-by-step location scoring:**
   1. First: Indoor or outdoor? If different → < 20
   2. If both indoor: Same room? If no → < 50
   3. If same room: Same furniture/background visible? If yes → 90+
   
2. **EXACT Same Outfit:**
   - SAME clothing item (e.g., same white Adidas shirt)
   - NOT "both wearing white" - must be IDENTICAL garment
   - Different shirt = DIFFERENT session
   
3. **EXACT Same Lighting:**
   - SAME light sources and conditions
   - Indoor vs outdoor = DIFFERENT
   - Different time of day = DIFFERENT

**Session similarity score (0-100):**
- **90-100:** ALL 3 factors IDENTICAL (same exact spot, same exact clothes, same exact light)
- **50-89:** Same location type, but different room OR different outfit OR different lighting
- **20-49:** Different location types (e.g., office vs home) OR multiple factors differ
- **0-19:** Completely different (e.g., indoor vs outdoor, ocean vs office)

**HARD RULES (MUST FOLLOW):**
- **Indoor vs outdoor background = Score < 20** (not similar at all)
- **Ocean/beach vs any indoor = Score < 20** (completely different)
- **Different rooms (even if both indoor) = Score < 50** (different locations)
- **Same room + different outfit = Score < 70** (different session)
- **Only score 90+ if: SAME room + SAME outfit + SAME lighting**

**STEP 2: Within each session group, measure VARIETY**

If multiple images from same session, compare their:
- **Pose variety** (standing vs sitting, facing direction, body position)
- **Expression variety** (smiling vs serious, eyes closed vs open)
- **Angle variety** (straight-on vs side angle, close-up vs further)
- **Framing variety** (cropping, composition)

**Variety score (0-100):**
- **80-100:** Very different (different pose + expression + angle)
- **50-79:** Somewhat different (1-2 factors differ)
- **0-49:** Nearly identical (burst shots, minimal variation)

**REJECTION LOGIC:**

1. Group all images by session similarity (≥90 = same session, be strict!)
2. For each session group with 5+ images:
   - Identify the 4 images with HIGHEST VARIETY from each other
   - Keep those 4, reject the rest
3. For session groups with 3-4 images:
   - Keep the 3 most diverse, reject rest
4. For session groups with 2 images or from different sessions:
   - Accept all

**Goal:** Only reject when images are TRULY from the same photo sitting (same room + same outfit + same lighting)

**JSON Response Fields:**
- **sessionSimilarity:** How similar location+outfit+lighting is to other images (0-100)
- **varietyScore:** How different pose/expression/angle is from same-session images (0-100)  
- **varietyRank:** Ranking within session group (1=most diverse, higher=less diverse)
- **sameSessionIndices:** Which other images are from the same session

**EXAMPLE SCENARIO:**
Batch: 4 office indoor + 3 home indoor + 2 ocean outdoor (same person in ALL)

**Correct scoring:**
- Office image #1 vs Office image #2: sessionSimilarity = 92 (same room)
- Office image #1 vs Home image #5: sessionSimilarity = 35 (both indoor, but different rooms)
- Office image #1 vs Ocean image #8: sessionSimilarity = 12 (indoor vs outdoor - MUST be < 20)
- Ocean image #8 vs Ocean image #9: sessionSimilarity = 88 (same beach location)

**Result:** Three SEPARATE groups:
- Group 1: Office images (similar to each other, 90+)
- Group 2: Home images (similar to each other, 90+)
- Group 3: Ocean images (similar to each other, 90+)
- Between groups: < 50 (different locations, NOT similar)

Return ONLY valid JSON, no other text:

{
  "images": [
    {
      "index": 0,
      "filename": "photo1.jpg",
      "faceCount": 1,
      "hasSingleFace": true,
      "isSharp": true,
      "hasStrongFilter": false,
      "brightnessScore": 80,
      "contrastScore": 75,
      "saturationScore": 80,
      "overallScore": 68,
      "similarityAnalysis": {
        "sessionSimilarity": 92,
        "varietyScore": 45,
        "mostSimilarImageIndex": 1,
        "similarityBreakdown": {
          "outfit": 95,
          "location": 95,
          "pose": 85,
          "lighting": 92,
          "expression": 88,
          "cameraAngle": 90,
          "framing": 90
        },
        "sameSessionIndices": [1, 2, 3, 4, 5, 6, 7, 8],
        "varietyRank": 7
      },
      "isAcceptable": false,
      "rejectionReasons": ["Same session as 8 other images - not diverse enough within group"],
      "varietyIssue": "duplicate"
    },
    {
      "index": 1,
      "filename": "photo2.jpg",
      "faceCount": 1,
      "hasSingleFace": true,
      "isSharp": true,
      "hasStrongFilter": false,
      "brightnessScore": 82,
      "contrastScore": 78,
      "saturationScore": 82,
      "overallScore": 72,
      "similarityAnalysis": {
        "sessionSimilarity": 92,
        "varietyScore": 82,
        "mostSimilarImageIndex": 0,
        "similarityBreakdown": {
          "outfit": 95,
          "location": 95,
          "pose": 65,
          "lighting": 92,
          "expression": 70,
          "cameraAngle": 75,
          "framing": 80
        },
        "sameSessionIndices": [0, 2, 3, 4, 5, 6, 7, 8],
        "varietyRank": 2
      },
      "isAcceptable": true,
      "rejectionReasons": [],
      "varietyIssue": "none"
    }
  ],
  "batchAnalysis": {
    "duplicates": {
      "groups": [
        {
          "indices": [0, 1, 2, 3, 4, 5, 6, 7, 8],
          "reason": "All 9 images from same session (same room, same outfit, same lighting)",
          "keepIndices": [0, 1, 2, 3],
          "rejectIndices": [4, 5, 6, 7, 8]
        }
      ],
      "hasTooManyDuplicates": true,
      "message": "All images from same photo session - limited to best 4"
    },
    "varietyScore": 45,
    "varietyIssues": ["All images from same photo session with minimal variation"]
  }
}`;

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { images }: { images: ImageInput[] } = await req.json();
    
    console.log('Received images:', {
      count: images?.length || 0,
      filenames: images?.map(img => img.filename) || []
    });
    
    if (!images || images.length !== 9) {
      console.error(`Invalid image count: expected 9, got ${images?.length || 0}`);
      return new Response(
        JSON.stringify({ error: `Expected exactly 9 images, got ${images?.length || 0}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    
    // Build API request
    const claudeRequest = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          // Add all 9 images
          ...images.map((img) => ({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: img.data
            }
          })),
          // Add analysis prompt
          {
            type: 'text',
            text: CLAUDE_PROMPT
          }
        ]
      }]
    };
    
    const startTime = Date.now();
    console.log('Calling API for photo quality analysis...');
    
    // Retry logic for overloaded API (up to 3 attempts with exponential backoff)
    let response;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API attempt ${attempt}/${maxRetries}...`);
        
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify(claudeRequest),
          signal: AbortSignal.timeout(120000) // 2 minute timeout - Sonnet 4.5 is thorough
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`API responded in ${duration}s`);
        
        // If we get a 500/503 (overloaded/service unavailable), retry
        if (response.status === 500 || response.status === 503) {
          const errorText = await response.text();
          console.warn(`API ${response.status} on attempt ${attempt}:`, errorText);
          
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`Retrying after ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
          
          lastError = new Error(`API error: ${response.status} - ${errorText}`);
          break;
        }
        
        // Success or non-retryable error
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', response.status, errorText);
          throw new Error(`API error: ${response.status}`);
        }
        
        // Success!
        break;
        
      } catch (error) {
        console.error(`API attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`Retrying after ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // If all retries failed, throw the last error
    if (!response || !response.ok) {
      throw lastError || new Error('API failed after all retries');
    }
    
    const result = await response.json();
    let analysisText = result.content[0].text;
    
    // Extract JSON if Claude added extra text
    const jsonStart = analysisText.indexOf('{');
    const jsonEnd = analysisText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      analysisText = analysisText.substring(jsonStart, jsonEnd + 1);
    }
    
    // Parse JSON response from Claude
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text (first 500 chars):', analysisText.substring(0, 500));
      throw new Error(`Failed to parse response: ${parseError}`);
    }
    
    // Validate response structure
    if (!analysis.images || !Array.isArray(analysis.images)) {
      console.error('Invalid response structure:', analysis);
      throw new Error('response missing images array');
    }
    
    console.log('Analysis complete:', {
      totalImages: analysis.images?.length || 0,
      acceptedImages: analysis.images?.filter((i: any) => i.isAcceptable).length || 0,
      rejectedImages: analysis.images?.filter((i: any) => !i.isAcceptable).length || 0,
      duplicateGroups: analysis.batchAnalysis?.duplicates?.groups?.length || 0
    });
    
    return new Response(
      JSON.stringify(analysis),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
    
  } catch (error) {
    console.error('Analysis failed:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

