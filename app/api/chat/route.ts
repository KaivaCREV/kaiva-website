import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdf from 'pdf-parse';

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
        console.log('Processing file:', file.name, 'Type:', file.type);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        console.log('Buffer created, size:', buffer.length);

        if (file.type === 'application/pdf') {
          try {
            // Parse PDF with error handling
            const pdfData = await pdf(buffer).catch(err => {
              console.error('PDF parsing error:', err);
              throw new Error('Failed to parse PDF file');
            });
            fileContent = pdfData.text;
            console.log('PDF parsed successfully, text length:', fileContent.length);
          } catch (pdfError) {
            console.error('PDF processing failed:', pdfError);
            return NextResponse.json(
              { error: 'Could not read PDF file. Please ensure it is not password protected and is a valid PDF.' },
              { status: 400 }
            );
          }
        } else if (file.type === 'text/plain') {
          fileContent = buffer.toString('utf-8');
          console.log('Text file processed, length:', fileContent.length);
        }

        // Basic cleanup
        fileContent = fileContent.trim().replace(/\s+/g, ' ');
        
        // Truncate if too long
        if (fileContent.length > 5000) {
          fileContent = fileContent.substring(0, 5000) + '... (content truncated)';
        }

        if (!fileContent.length) {
          console.error('No content extracted from file');
          return NextResponse.json(
            { error: 'No content could be extracted from the file.' },
            { status: 400 }
          );
        }

      } catch (error) {
        console.error('File processing error:', error);
        return NextResponse.json(
          { error: 'Could not process file. Please try again with a different file.' },
          { status: 400 }
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    try {
      // Proceed with OpenAI request
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are Kai, an AI assistant specializing in commercial real estate. 
            You have received a document to analyze. When analyzing documents:
            1. Focus on extracting key information and terms
            2. Highlight important dates, numbers, and conditions
            3. Provide a structured summary using markdown formatting
            4. If it's a lease or contract, identify critical clauses
            5. For financial documents, emphasize key metrics and calculations
            
            Always provide a response, even if the document is complex. Break down the analysis into clear sections.`
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

    } catch (openaiError: any) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json(
        { error: 'OpenAI API error: ' + (openaiError.message || 'Unknown error') },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('General API Error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 