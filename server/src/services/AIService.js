/**
 * AI Service
 * Powered by Groq
 */

const logger = require("../config/logger");
const OpenAI = require("openai");

class AIService {
  constructor() {
    this.isConfigured = !!process.env.GROQ_API_KEY;

    if (this.isConfigured) {
      this.client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
      });

      logger.info("AIService: Groq configured");
    } else {
      logger.info("AIService: AI not configured. Using fallback.");
    }
  }

  async analyzeSymptoms(symptoms, patientInfo = {}) {
    if (!this.isConfigured) {
      return this._getFallbackAssessment(symptoms);
    }

    try {

      const completion = await this.client.chat.completions.create({

        model: process.env.GROQ_MODEL,

        messages: [

          {
            role: "system",
            content: `
You are an experienced medical assistant.

Your task is NOT to diagnose.

You only provide preliminary health guidance.

Always answer in this format:

Possible Conditions
Severity
Recommended Actions
Emergency Warning
Disclaimer

Rules:

Never prescribe medicines.

Never say patient definitely has a disease.

Always recommend consulting a doctor.

If symptoms suggest emergency, clearly tell patient to visit nearest emergency room immediately.

`
          },

          {
            role: "user",
            content: `
Patient Information

Age:
${patientInfo.age || "Not Provided"}

Gender:
${patientInfo.gender || "Not Provided"}

Medical History:
${patientInfo.medicalHistory || "None"}

Symptoms:
${symptoms}
`
          }

        ],

        temperature: 0.3,

        max_tokens: 1000

      });

      const assessment = completion.choices[0].message.content;

      return {

        success: true,

        assessment,

        severity: this._extractSeverity(assessment),

        disclaimer:
          "This is an AI-generated preliminary assessment and NOT a medical diagnosis. Please consult a qualified healthcare professional.",

        isAiGenerated: true,

        generatedAt: new Date().toISOString()

      };

    } catch (error) {

      logger.error("Groq Error:", error);

      return this._getFallbackAssessment(symptoms);

    }
  }

  _extractSeverity(text) {

    const lower = text.toLowerCase();

    if (
      lower.includes("emergency") ||
      lower.includes("immediately") ||
      lower.includes("critical") ||
      lower.includes("severe")
    ) {
      return "severe";
    }

    if (
      lower.includes("moderate") ||
      lower.includes("doctor")
    ) {
      return "moderate";
    }

    return "mild";

  }

  _getFallbackAssessment(symptoms) {

    return {

      success: true,

      assessment: `
Symptoms Reported

${symptoms}

AI service is currently unavailable.

General Recommendations

• Stay hydrated

• Take adequate rest

• Monitor your symptoms

• If symptoms worsen, consult a doctor.

• If you experience chest pain, difficulty breathing, unconsciousness or severe bleeding, seek emergency medical attention immediately.
`,

      severity: "mild",

      disclaimer:
        "AI service unavailable. Please consult a qualified healthcare professional.",

      isAiGenerated: false,

      generatedAt: new Date().toISOString()

    };

  }

  isAvailable() {

    return this.isConfigured;

  }

}

module.exports = new AIService();