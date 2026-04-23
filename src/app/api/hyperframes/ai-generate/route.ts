import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

const systemInstruction = `You are an expert UI/UX designer and frontend developer specializing in HyperFrames, a frame-by-frame HTML/CSS animation system powered by GSAP.
Your task is to generate a JSON object representing a video composition based on the user's prompt.

The JSON object MUST have the following structure:
{
  "name": "A descriptive name for the composition",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "duration": 10,
  "html": "The HTML content",
  "css": "The CSS content"
}

RULES FOR HTML & CSS:
1. The composition represents a video canvas. Use absolute positioning, flexbox, or grid to layout elements beautifully.
2. The root element in HTML MUST have a 'data-composition-id' attribute (e.g. data-composition-id="generated-comp").
3. Use Google Fonts if you need typography (e.g. <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet"> inside the HTML).
4. ANIMATION SYSTEM: HyperFrames automatically animates elements using GSAP based on specific data-attributes.
   To animate an element, you MUST add these attributes:
   - 'data-start="SECONDS"': When the element should appear.
   - 'data-duration="SECONDS"': How long the element stays on screen before fading out.
   - 'data-ease="power2.out"': (Optional) GSAP easing function.
5. Example of animated text:
   <h1 data-start="0.5" data-duration="4" style="position:absolute; top:20%; left:10%; font-family:'Inter', sans-serif; font-size: 80px; color: white;">Hello World!</h1>
6. Design: Make it look premium, modern, glassmorphic or highly cinematic depending on the prompt. Use high-quality gradients, shadows, and rounded corners.
7. Return ONLY the JSON object.

ITERATIVE CORRECTIONS:
If the user provides 'currentHtml' and 'currentCss', you are NOT starting from scratch. You must modify the provided HTML and CSS to satisfy the user's new request, keeping the existing layout and animations intact unless they conflict with the request.
`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key') {
      return NextResponse.json({ 
        success: false, 
        error: 'В файле .env.local не указан корректный OPENAI_API_KEY. Сейчас там стоит заглушка "your_openai_key".' 
      }, { status: 400 });
    }

    const { prompt, currentHtml, currentCss } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    let userContent = prompt;
    if (currentHtml || currentCss) {
      userContent = `Current HTML:\n\`\`\`html\n${currentHtml || ''}\n\`\`\`\n\Current CSS:\n\`\`\`css\n${currentCss || ''}\n\`\`\`\n\nUser Request: ${prompt}`;
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }

    let jsonString = content.trim();
    if (jsonString.startsWith('\`\`\`')) {
      jsonString = jsonString.replace(/^\`\`\`(json)?\n/, '').replace(/\n\`\`\`$/, '');
    }

    const composition = JSON.parse(jsonString);
    
    return NextResponse.json({ 
      success: true, 
      composition: {
        id: crypto.randomUUID(),
        name: composition.name || 'AI Generated Composition',
        width: composition.width || 1080,
        height: composition.height || 1920,
        fps: composition.fps || 30,
        duration: composition.duration || 10,
        html: composition.html || '<div data-composition-id="gen" style="width:100%;height:100%;background:black;"></div>',
        css: composition.css || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('[AI Generate Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
