import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel, Subject, Question, Lesson, LearningStyle, Language } from '../types';

// Ensure API key is present
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateExamQuestions = async (
  subject: Subject,
  level: DifficultyLevel,
  count: number,
  language: Language,
  topic?: string
): Promise<Question[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are a strict examiner for the Institute of Chartered Accountants. 
    Create a simulated exam for the subject "${subject}" at the "${level}" level.
    ${topic ? `Focus specifically on the topic: "${topic}".` : ''}
    Generate ${count} multiple-choice questions.
    
    IMPORTANT LANGUAGE INSTRUCTION:
    Generate the content (Question text, Options, and Explanation) in **${language}**.
    If Malayalam is selected, use Malayalam script.
    However, keep the JSON keys (id, text, options, correctOptionIndex, explanation) strictly in English.

    Guidelines:
    1. Questions should be scenario-based or conceptual, matching the high standards of CA exams.
    2. Provide 4 distinct options for each question.
    3. Clearly mark the correct option index (0-3).
    4. Provide a detailed explanation for the correct answer, citing relevant sections of law or accounting standards if applicable.
    
    Return the response strictly as a JSON array.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique identifier for the question" },
            text: { type: Type.STRING, description: "The question text in the requested language." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of exactly 4 possible answers in the requested language."
            },
            correctOptionIndex: { type: Type.INTEGER, description: "The zero-based index of the correct option." },
            explanation: { type: Type.STRING, description: "Detailed reasoning in the requested language." }
          },
          required: ["id", "text", "options", "correctOptionIndex", "explanation"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response received from AI.");
  }

  try {
    const questions = JSON.parse(text) as Question[];
    return questions;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to generate valid exam questions.");
  }
};

export const generateLessonStream = async function* (
  subject: Subject,
  level: DifficultyLevel,
  topic: string,
  style: LearningStyle,
  language: Language
) {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const model = "gemini-3-flash-preview";

  const prompt = `
    You are the "CA Mastermind AI", the world's most effective Chartered Accountancy tutor.
    Your goal is to ensure the student not only understands the topic but can score high marks in the real exam.
    
    Prepare a lesson on: "${topic}"
    Subject: "${subject}"
    Level: "${level}"
    Teaching Style: "${style}"

    IMPORTANT LANGUAGE INSTRUCTION:
    Teach in **${language}**.
    If Malayalam is selected, use Malayalam script.

    Style Guidelines:
    - If style is "Simplify for Beginners": Use analogies, break down complex legal/accounting jargon into plain English (or simple Malayalam), and focus on "why" things happen.
    - If style is "Exam Oriented": Focus strictly on keywords, specific sections/standards that fetch marks, presentation tips, and common student mistakes.
    - If style is "Master Class": Provide a deep comprehensive analysis, including exceptions, relevant case laws, and cross-references to other subjects.

    OUTPUT FORMAT:
    Do NOT return JSON. Return formatted Markdown text.
    Structure the lesson strictly into these 5 sections using Markdown Level 2 Headers (##):
    
    ## Mastermind Overview
    (A powerful, high-impact summary of what this topic is and why it matters.)

    ## Core Concept Decoded
    (The main explanation, tailored to the selected style.)

    ## The "Examiner's Favorite" Points
    (Specific areas that are frequently asked in exams.)

    ## Practical Application / Case Study
    (A real-world scenario or calculation.)

    ## Mastermind Memory Hook
    (A mnemonic or trick to remember this concept forever.)

    Make the content inspiring, professional, and authoritative. Start directly with the first header.
  `;

  const responseStream = await ai.models.generateContentStream({
    model: model,
    contents: prompt,
  });

  for await (const chunk of responseStream) {
    yield chunk.text;
  }
};