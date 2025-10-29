import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface ImageInput {
  filename: string;
  data: string; // base64
}

const CLAUDE_PROMPT = `Analyze 9 portrait photos for AI training. Check quality and enforce diversity.

**PER-IMAGE QUALITY CHECKS:**

1. **Face Count:** Must be exactly 1. Reject if 0 or 2+. To count an extra face, we have to see at least one eye.

2. **Sharpness - BE VERY STRICT:** Look at face details closely:
   - **Sharp (isSharp: true, 80-100):** Individual hair strands visible, skin texture clear, eyes crisp, no motion blur
   - **Slightly soft (isSharp: true, 60-79):** Face clear but hair slightly soft, minor motion blur
   - **Blurry/Out of focus (isSharp: false, 0-59):** Hair blurred/mushy, face soft, eyes not crisp, motion blur, low resolution
   - **REJECT if isSharp: false** - Training needs crisp, clear images

3. **Filters:** Subtle OK. Reject strong beauty/color/distortion filters.
4. **Quality Scores (0-100):** Rate these and calculate overallScore:
   - **Brightness:** Overall image brightness (0=too dark, 100=perfect)
   - **Contrast:** Difference between light and dark areas (0=flat, 100=good contrast)
   - **Saturation:** Color vibrancy (0=washed out, 100=vibrant)
   - **Sharpness Score:** How sharp/crisp the image is (0=very blurry, 60=acceptable, 80-100=sharp)
     - Look at hair, eyes, skin texture - if they're soft/blurry → score 0-40
   - **Bokeh (Background Blur):** How blurred the BACKGROUND is, NOT the subject (0=sharp background, 100=very blurred background)

5. **Overall Quality Score:** Calculate average of all quality scores. **REJECT if overallScore ≤ 55** with reason "Overall image quality is too low"

**SIMILARITY DETECTION - BE VERY STRICT:**

**Your job: Find groups of images from the SAME photo shoot and limit each group.**

**SAME photo shoot = ALL 3 factors match:**
1. **Same background** - Walls, furniture, room structure match
   - Example: All photos in kitchen → SAME session (score 98)
   - Example: Office vs bedroom → DIFFERENT (score 30)
   
2. **Same clothing** - Same shirt/top visible in photos
   - Example: All white t-shirt → SAME session (score 98)
   - Example: White shirt vs black shirt → DIFFERENT (score 30)
   
3. **Same lighting setup** - Light direction, shadows, brightness match
   - Example: All window light from left → SAME session (score 98)
   - Example: Daytime vs evening light → DIFFERENT (score 30)

**CRITICAL: If all 3 match → sessionSimilarity 95-100 (SAME group)**
**If ANY factor differs → sessionSimilarity < 70 (DIFFERENT groups)**

**DIFFERENT photo shoots = ANY of these differ:**
- ✅ Different rooms (bedroom vs living room, even same house)
- ✅ Different locations (home vs office vs restaurant vs outdoor vs different homes)
- ✅ Different outfits (white shirt vs black shirt, t-shirt vs button-up)
- ✅ Different lighting (window light vs ceiling light, day vs night, front vs side)
- ✅ Different events (Event A vs Event B, even if similar style)

**Examples of SAME session (MUST limit quantity):**
- ❌ 9 photos: SAME walls/furniture visible, SAME garment, SAME light on face → Score 95+ (keep best 4, reject 5)
- ❌ 4 photos: SAME background visible, SAME clothing, SAME shadows → Score 95+ (keep best 3, reject 1)

**Examples of DIFFERENT sessions (accept all):**
- ✅ 9 photos with DIFFERENT backgrounds visible → Score < 50 (different shoots)
- ✅ Photos with SAME background but DIFFERENT clothing → Score < 70 (different shoots)
- ✅ Photos with SAME background but DIFFERENT lighting on face → Score < 70 (different shoots)

**Scoring (sessionSimilarity 0-100):**
- **95-100:** Definitely same photo shoot (identical background + clothes + light)
- **70-94:** Possibly same day, but different setup (1-2 factors differ)
- **0-69:** Clearly different sessions (accept all, no similarity concern)

**REJECTION LOGIC (group-based):**
1. **Group images:** Find all images with sessionSimilarity ≥ 95 to each other (same session group)
2. **Within EACH group, apply limits:**
   - Group of 2: Accept both
   - Group of 3: Keep best 2 (highest varietyScore), reject 1
   - Group of 4: Keep best 2 (highest varietyScore), reject 2
   - Group of 5+: Keep best 3 (highest varietyScore), reject rest
3. **Images not in any large group:** Accept all

**Goal:** Only reject TRUE duplicates (same shoot), NOT just "same category" photos

**JSON Response Fields:**
- **sessionSimilarity:** How similar location+outfit+lighting is to other images (0-100)
- **varietyScore:** How different pose/expression/angle is from same-session images (0-100)  
- **varietyRank:** Ranking within session group (1=most diverse, higher=less diverse)
- **sameSessionIndices:** Which other images are from the same session

**EXAMPLE 1 - ALL SAME SESSION (strict rejection):**
Input: 9 photos, all in apartment/home with same walls/furniture, all white t-shirt, all similar lighting

**Step 1: Check each image against others**
- Image 0: Same background, same white shirt, same light → sessionSimilarity = 98
- Image 1: Same background, same white shirt, same light → sessionSimilarity = 98
- ... (all 9 images score 95+ similarity)

**Step 2: Form groups**
- Group 1: ALL 9 images [0,1,2,3,4,5,6,7,8]
- sameSessionIndices for each image: [other 8 indices]

**Step 3: Apply limits**
- Group size: 9 (≥5) → Keep ONLY best 4
- Rank by varietyScore (pose/expression differences)
- Keep ranks 1-4 (most variety) → isAcceptable: true
- Reject ranks 5-9 (less variety) → isAcceptable: false

**Output:** 4 accepted, 5 rejected with varietyIssue: "duplicate"

**EXAMPLE 2 - MULTIPLE GROUPS:**
Batch: 6 office images, 3 outdoor images

**Grouping:**
- Group 1: Images [0,1,2,3,4,5] (office: same desk, same shirt, same lamp) sessionSimilarity=98
- Group 2: Images [6,7,8] (outdoor: same park, same jacket, same sunlight) sessionSimilarity=97
- Group 1 size: 6 (≥5) → Keep best 4, reject 2
- Group 2 size: 3 → Keep best 2, reject 1

**Result:** From Group 1 keep ranks 1-4, reject ranks 5-6. From Group 2 keep ranks 1-2, reject rank 3.

**EXAMPLE 3 - ALL DIFFERENT SESSIONS:**
Batch: 9 photos, all in black tuxedos but different venues

**Visual comparison:**
- Different backgrounds/venues (red carpet vs gala vs premiere) → sessionSimilarity < 50

**Grouping:**
- No groups (all images have sessionSimilarity < 95)

**Result:** Accept ALL 9 (all from different photo shoots)

**IMPORTANT REMINDERS:**
1. Same background + same clothing + same lighting = sessionSimilarity 95+ (SAME group)
2. Group of 5+ images → Keep ONLY best 4, reject rest (varietyIssue: "duplicate", isAcceptable: false)
3. Group of 3-4 images → Keep ONLY best 2-3, reject rest
4. Always populate sameSessionIndices for grouped images
5. Rank grouped images by varietyScore (1=most diverse=keep, higher rank=reject)

Return ONLY valid JSON, no markdown, no comments, no other text:

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
      "sharpnessScore": 85,
      "bokehScore": 45,
      "overallScore": 73,
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
      "sharpnessScore": 90,
      "bokehScore": 65,
      "overallScore": 79,
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
    
    // Extract JSON if Claude added extra text (be more aggressive)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysisText = jsonMatch[0];
    } else {
      // Fallback to old method
      const jsonStart = analysisText.indexOf('{');
      const jsonEnd = analysisText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        analysisText = analysisText.substring(jsonStart, jsonEnd + 1);
      }
    }
    
    // Remove any trailing commas (common JSON mistake)
    analysisText = analysisText.replace(/,(\s*[}\]])/g, '$1');
    
    // Parse JSON response from Claude
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse text (full):', analysisText);
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

