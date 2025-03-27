import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const history = JSON.parse(formData.get('history') as string);
    const file = formData.get('file') as File | null;

    let fileContent = '';
    if (file) {
      try {
        // For now, only handle text files
        if (file.type === 'text/plain') {
          const buffer = Buffer.from(await file.arrayBuffer());
          fileContent = buffer.toString('utf-8');
          
          // Basic cleanup and truncation
          fileContent = fileContent.trim().replace(/\s+/g, ' ');
          if (fileContent.length > 5000) {
            fileContent = fileContent.substring(0, 5000) + '... (content truncated)';
          }
        } else if (file.type === 'application/pdf') {
          fileContent = 'PDF analysis is currently being implemented. Please use text files for now.';
        }
      } catch (error) {
        console.error('File processing error:', error);
        return NextResponse.json(
          { error: 'Could not process file. Please try again with a text file.' },
          { status: 400 }
        );
      }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Proceed with OpenAI request
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Kai, an AI assistant specializing in commercial real estate. 
          When analyzing documents:
          1. Focus on extracting key information and terms
          2. Highlight important dates, numbers, and conditions
          3. Provide a structured summary using markdown formatting
          4. If it's a lease or contract, identify critical clauses
          5. For financial documents, emphasize key metrics and calculations`
        },
        ...history.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { 
          role: "user", 
          content: fileContent ? 
            `${message}\n\nDocument content:\n${fileContent}` : 
            message 
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      message: response.choices[0].message.content
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 