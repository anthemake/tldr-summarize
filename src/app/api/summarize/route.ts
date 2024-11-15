import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../../lib/rateLimiter';
import validator from 'validator';

export async function POST(req: NextRequest) {
  try {
    // Retrieve and validate environment variables
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    if (!endpoint || !apiKey || !deploymentName) {
      throw new Error('Azure OpenAI endpoint, API key, or deployment name is not defined in environment variables.');
    }

    // Retrieve the user's IP address
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';


    // Check rate limiting for the current IP
    const { perMinute, perHour } = await checkRateLimit(ip);

    if (!perMinute) {
      return NextResponse.json(
        { error: 'Too many requests per minute. Please try again later.' },
        { status: 429 }
      );
    }

    if (!perHour) {
      return NextResponse.json(
        { error: 'Too many requests per hour. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse the request body
    const { text } = await req.json();

    // Trim the text to remove leading/trailing whitespace
    const trimmedText = text?.trim();

    // Validate the input text
    if (!trimmedText || validator.isEmpty(trimmedText)) {
      return NextResponse.json({ error: 'Input text is required.' }, { status: 400 });
    }

    // Adjusted max length to 3000 characters
    if (!validator.isLength(trimmedText, { min: 1, max: 3000 })) {
      return NextResponse.json({ error: 'Input text exceeds the maximum allowed length.' }, { status: 400 });
    }

    // Log the actual length for debugging
    console.log(`Received text length: ${trimmedText.length} characters`);

    const maxTokens = calculateMaxTokens(trimmedText);

    // Prepare the API configuration
    const apiConfig = {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    };

    // API call for regular summary
    const summaryResponse = await axios.post(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-03-15-preview`,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that summarizes text.',
          },
          {
            role: 'user',
            content: `Please provide a concise and accurate summary of the following text. The summary should only include information present in the text and should be shorter than the original. Do not include questions, add new information, or repeat content. End the summary appropriately.\n\n"${trimmedText}"`,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        stop: ['\n\n'],
      },
      apiConfig
    );

    let summary = summaryResponse.data.choices[0].message.content.trim();

    // Clean and validate the summary
    summary = cleanSummary(summary, trimmedText);

    // API call for bullet points
    const bulletResponse = await axios.post(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-03-15-preview`,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that summarizes text into bullet points.',
          },
          {
            role: 'user',
            content: `Please summarize the following text into concise bullet points. Each bullet point should be a single, complete sentence or phrase based strictly on the provided text. Do not include any additional information or personal opinions. Avoid using line breaks within bullet points.\n\n"${trimmedText}"`,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        stop: ['\n\n'],
      },
      apiConfig
    );

    const bulletPointSummary = bulletResponse.data.choices[0].message.content.trim();

    const bulletPointsArray = bulletPointSummary
      .split(/\n(?=[-•\d])/) // Split when a newline is followed by a bullet
      .map((point: string) => point.replace(/^\s*[-•\d.\s]*/, '').trim())
      // Remove bullet markers
      .filter((point: string) => point.length > 0);


    // Return both the summary and bullet points in the response
    return NextResponse.json({ summary, bulletPoints: bulletPointsArray });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
      return NextResponse.json(
        { error: 'API Error: ' + (error.response?.data?.error?.message || error.message) },
        { status: 500 }
      );
    } else if (error instanceof Error) {
      console.error('Unexpected Error:', error);
      return NextResponse.json({ error: 'Unexpected Error: ' + error.message }, { status: 500 });
    } else {
      console.error('Unknown Error:', error);
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }

}

// Utility functions remain the same
function calculateMaxTokens(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const tokensUsedByInput = Math.ceil(wordCount * 1.5);
  const maxOutputTokens = Math.min(200, 4096 - tokensUsedByInput);
  return Math.max(maxOutputTokens, 50);
}

function cleanSummary(summary: string, originalText: string): string {
  // Remove unwanted tokens
  summary = summary.replace(/<.*?>/g, '').trim();

  // Ensure the summary is shorter than the original
  if (summary.length > originalText.length) {
    summary = summary.substring(0, originalText.length) + '...';
  }

  // Ensure it ends with proper punctuation
  if (!/[.!?]$/.test(summary)) {
    summary += '.';
  }

  return summary;
}
