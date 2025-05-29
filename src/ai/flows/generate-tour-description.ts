'use server';
/**
 * @fileOverview AI-powered description generator for product tours.
 *
 * - generateTourDescription - A function that generates a compelling description for a product tour.
 * - GenerateTourDescriptionInput - The input type for the generateTourDescription function.
 * - GenerateTourDescriptionOutput - The return type for the generateTourDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTourDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  tourHighlights: z
    .string()
    .describe('Key features and highlights of the product tour.'),
  targetAudience: z.string().describe('The target audience for the product tour.'),
});
export type GenerateTourDescriptionInput = z.infer<typeof GenerateTourDescriptionInputSchema>;

const GenerateTourDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A compelling description of the product tour, designed to attract viewers.'),
});
export type GenerateTourDescriptionOutput = z.infer<typeof GenerateTourDescriptionOutputSchema>;

export async function generateTourDescription(
  input: GenerateTourDescriptionInput
): Promise<GenerateTourDescriptionOutput> {
  return generateTourDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTourDescriptionPrompt',
  input: {schema: GenerateTourDescriptionInputSchema},
  output: {schema: GenerateTourDescriptionOutputSchema},
  prompt: `You are an expert marketing copywriter specializing in creating engaging product tour descriptions.

  Based on the provided information, craft a compelling description to attract viewers to the product tour.

  Product Name: {{{productName}}}
  Tour Highlights: {{{tourHighlights}}}
  Target Audience: {{{targetAudience}}}

  Description:`, // The copy should be optimized for click through rate and SEO. Include a call to action at the end.
});

const generateTourDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTourDescriptionFlow',
    inputSchema: GenerateTourDescriptionInputSchema,
    outputSchema: GenerateTourDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
