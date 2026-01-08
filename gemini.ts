
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper: Base64 Encoding
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Audio Helper: PCM Blob Creation
export function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: "Please transcribe this audio accurately in Bangla. Maintain the speaker's tone and context. Only return the transcript."
        }
      ]
    }
  });
  
  return response.text || '';
};

export const generateContent = async (transcript: string, type: string): Promise<string> => {
  const ai = getAI();
  
  let prompt = "";
  switch(type) {
    case 'title':
      prompt = `Based on this transcript: "${transcript}", generate 10 catchy, viral-worthy video titles in Bangla. Format them as a numbered list.`;
      break;
    case 'thumbnail':
      prompt = `Based on this transcript: "${transcript}", suggest 5 high-impact short text ideas for a video thumbnail in Bangla. Each suggestion should be very short (max 3-4 words).`;
      break;
    case 'facebook':
      prompt = `Based on this transcript: "${transcript}", write an engaging Facebook post caption in a mix of Bangla and English (Banglish style). Include relevant emojis and hashtags.`;
      break;
    case 'youtube':
      prompt = `Based on this transcript: "${transcript}", write a detailed YouTube video description in Bangla. Include a summary, key points covered, and common hashtags.`;
      break;
    default:
      prompt = `Summarize this in Bangla: ${transcript}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  return response.text || '';
};

export const connectLiveTranscription = (callbacks: {
  onTranscript: (text: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: any) => void;
}) => {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: callbacks.onOpen || (() => {}),
      onclose: callbacks.onClose || (() => {}),
      onerror: callbacks.onError || (() => {}),
      onmessage: async (message) => {
        if (message.serverContent?.inputTranscription) {
          callbacks.onTranscript(message.serverContent.inputTranscription.text);
        }
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      systemInstruction: "You are a specialized Bangla transcription engine. Only transcribe the user's audio input. Do not provide any conversational responses or audio output. Output exactly what is being said in Bangla script."
    }
  });
};
