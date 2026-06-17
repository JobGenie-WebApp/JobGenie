import { PDFDocument, rgb, StandardFonts, type PDFFont, type Color } from "pdf-lib";
import type { CompleteProfileData } from "@/lib/validations/profile-schema";

export interface CandidateBasicInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  currentPosition: string;
  industry: string;
  yearsOfExperience?: number;
  professionalSummary?: string;
}

// Color palette for professional CV
const COLORS = {
  primary: rgb(0.125, 0.251, 0.376), // #204060 - Dark blue
  secondary: rgb(0.282, 0.518, 0.741), // #4884BD - Medium blue
  text: rgb(0.2, 0.2, 0.2), // Dark gray for text
  lightText: rgb(0.4, 0.4, 0.4), // Light gray for secondary text
  accent: rgb(0.125, 0.251, 0.376), // Accent color
  border: rgb(0.8, 0.8, 0.8), // Light border
};

const LAYOUT = {
  margin: 50,
  lineHeight: 14,
  sectionSpacing: 20,
  itemSpacing: 12,
  headerHeight: 80,
};

/**
 * Generates a professional, standardized Common CV PDF from candidate profile data
 */
export async function generateCommonCV(
  profileData: CompleteProfileData,
  candidateInfo: CandidateBasicInfo
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  let yPosition = height - LAYOUT.margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition - requiredSpace < LAYOUT.margin) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - LAYOUT.margin;
      return true;
    }
    return false;
  };

  // Helper function to sanitize text for PDF (remove newlines and control characters)
  const sanitizeText = (text: string): string => {
    if (!text) return "";
    // Replace newlines, carriage returns, and tabs with spaces
    // Remove other control characters
    return text
      .replace(/[\r\n\t]/g, " ")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim();
  };

  // Safe wrapper for page.drawText that auto-sanitizes
  const safeDrawText = (text: string, options: Parameters<typeof page.drawText>[1]) => {
    page.drawText(sanitizeText(text), options);
  };

  // Helper function to draw text with wrapping
  const drawWrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
    color: Color
  ) => {
    // Sanitize the text first
    const sanitizedText = sanitizeText(text);
    if (!sanitizedText) return;

    const words = sanitizedText.split(" ");
    let line = "";
    const lines: string[] = [];

    words.forEach((word) => {
      const testLine = line + word + " ";
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    });
    if (line.trim() !== "") {
      lines.push(line.trim());
    }

    lines.forEach((line) => {
      checkPageBreak(LAYOUT.lineHeight + 5);
      safeDrawText(line, {
        x,
        y: yPosition,
        size,
        font,
        color,
      });
      yPosition -= LAYOUT.lineHeight;
    });
  };

  // Helper function to draw section header
  const drawSectionHeader = (title: string) => {
    checkPageBreak(30);
    yPosition -= LAYOUT.sectionSpacing;

    safeDrawText(title.toUpperCase(), {
      x: LAYOUT.margin,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: COLORS.primary,
    });

    yPosition -= 5;
    page.drawLine({
      start: { x: LAYOUT.margin, y: yPosition },
      end: { x: width - LAYOUT.margin, y: yPosition },
      thickness: 2,
      color: COLORS.secondary,
    });
    yPosition -= 10;
  };

  // ============ HEADER SECTION ============
  const fullName = `${candidateInfo.firstName} ${candidateInfo.lastName}`;

  safeDrawText(fullName, {
    x: LAYOUT.margin,
    y: yPosition,
    size: 24,
    font: helveticaBold,
    color: COLORS.primary,
  });
  yPosition -= 30;

  safeDrawText(candidateInfo.currentPosition, {
    x: LAYOUT.margin,
    y: yPosition,
    size: 12,
    font: helveticaBold,
    color: COLORS.secondary,
  });
  yPosition -= 20;

  // Contact Information
  const contactInfo = [
    sanitizeText(`Email: ${candidateInfo.email}`),
    sanitizeText(`Phone: ${candidateInfo.phone}`),
    sanitizeText(`Address: ${candidateInfo.address}`),
  ];

  contactInfo.forEach((info) => {
    safeDrawText(info, {
      x: LAYOUT.margin,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: COLORS.text,
    });
    yPosition -= LAYOUT.lineHeight;
  });

  // ============ PROFESSIONAL SUMMARY ============
  if (profileData.professionalSummary) {
    drawSectionHeader("Professional Summary");
    drawWrappedText(
      profileData.professionalSummary,
      LAYOUT.margin,
      width - 2 * LAYOUT.margin,
      timesRoman,
      11,
      COLORS.text
    );
  }

  // ============ WORK EXPERIENCE ============
  if (profileData.workExperiences && profileData.workExperiences.length > 0) {
    drawSectionHeader("Work Experience");

    profileData.workExperiences.forEach((exp, index) => {
      checkPageBreak(60);

      // Job title and company
      const jobTitle = sanitizeText(exp.jobTitle || "Position");
      const company = sanitizeText(exp.company || "Company");
      safeDrawText(`${jobTitle} at ${company}`, {
        x: LAYOUT.margin,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: COLORS.text,
      });
      yPosition -= LAYOUT.lineHeight + 2;

      // Employment type and dates
      const employmentType = exp.employmentType || "full_time";
      const startDate = exp.startDate ? exp.startDate.replace("-01", "") : "";
      const endDate = exp.isCurrent ? "Present" : (exp.endDate ? exp.endDate.replace("-01", "") : "");
      const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : "";

      safeDrawText(`${employmentType.replace("_", " ")} | ${dateRange}`, {
        x: LAYOUT.margin,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: COLORS.lightText,
      });
      yPosition -= LAYOUT.lineHeight + 2;

      // Location
      if (exp.location) {
        safeDrawText(sanitizeText(exp.location), {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;
      }

      // Description
      if (exp.description) {
        drawWrappedText(
          exp.description,
          LAYOUT.margin + 15,
          width - 2 * LAYOUT.margin - 15,
          timesRoman,
          10,
          COLORS.text
        );
      }

      yPosition -= LAYOUT.itemSpacing;
    });
  }

  // ============ EDUCATION ============
  const hasEducation =
    (profileData.educations && profileData.educations.length > 0) ||
    (profileData.financeAcademicEducation && profileData.financeAcademicEducation.length > 0) ||
    (profileData.financeProfessionalEducation && profileData.financeProfessionalEducation.length > 0) ||
    (profileData.bankingAcademicEducation && profileData.bankingAcademicEducation.length > 0) ||
    (profileData.bankingProfessionalEducation && profileData.bankingProfessionalEducation.length > 0) ||
    (profileData.bankingSpecializedTraining && profileData.bankingSpecializedTraining.length > 0);

  if (hasEducation) {
    drawSectionHeader("Education");

    // Standard Education (IT and general)
    if (profileData.educations) {
      profileData.educations.forEach((edu) => {
        checkPageBreak(40);

        safeDrawText(edu.degreeDiploma || "Degree/Diploma", {
          x: LAYOUT.margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(edu.institution || "Institution", {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        const status = edu.status || "incomplete";
        safeDrawText(`Status: ${status.replace("_", " ")}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.itemSpacing;
      });
    }

    // Finance Education
    if (profileData.financeAcademicEducation) {
      profileData.financeAcademicEducation.forEach((edu) => {
        checkPageBreak(40);

        safeDrawText(edu.degreeDiploma, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(edu.institution, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(`Status: ${edu.status.replace("_", " ")}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.itemSpacing;
      });
    }

    if (profileData.financeProfessionalEducation) {
      profileData.financeProfessionalEducation.forEach((edu) => {
        checkPageBreak(40);

        safeDrawText(edu.professionalQualification, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(edu.institution, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(`Status: ${edu.status.replace("_", " ")}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.itemSpacing;
      });
    }

    // Banking Education
    if (profileData.bankingAcademicEducation) {
      profileData.bankingAcademicEducation.forEach((edu) => {
        checkPageBreak(40);

        safeDrawText(edu.degreeDiploma, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(edu.institution, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(`Status: ${edu.status.replace("_", " ")}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.itemSpacing;
      });
    }

    if (profileData.bankingProfessionalEducation) {
      profileData.bankingProfessionalEducation.forEach((edu) => {
        checkPageBreak(40);

        safeDrawText(edu.professionalQualification, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(edu.institution, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(`Status: ${edu.status.replace("_", " ")}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.itemSpacing;
      });
    }

    if (profileData.bankingSpecializedTraining) {
      profileData.bankingSpecializedTraining.forEach((training) => {
        checkPageBreak(40);

        safeDrawText(training.certificateName, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: COLORS.text,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        safeDrawText(training.issuingAuthority, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;

        if (training.certificateIssueMonth) {
          safeDrawText(`Issued: ${training.certificateIssueMonth}`, {
            x: LAYOUT.margin,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: COLORS.lightText,
          });
          yPosition -= LAYOUT.lineHeight + 2;
        }

        safeDrawText(`Status: ${training.status.replace("_", " ")}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.itemSpacing;
      });
    }
  }

  // ============ PROJECTS (IT Industry) ============
  if (profileData.projects && profileData.projects.length > 0) {
    drawSectionHeader("Projects");

    profileData.projects.forEach((project) => {
      checkPageBreak(40);

      safeDrawText(project.projectName || "Project", {
        x: LAYOUT.margin,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: COLORS.text,
      });
      yPosition -= LAYOUT.lineHeight + 2;

      if (project.demoUrl) {
        safeDrawText(`URL: ${project.demoUrl}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 9,
          font: helvetica,
          color: COLORS.secondary,
        });
        yPosition -= LAYOUT.lineHeight + 2;
      }

      if (project.description) {
        drawWrappedText(
          project.description,
          LAYOUT.margin + 15,
          width - 2 * LAYOUT.margin - 15,
          timesRoman,
          10,
          COLORS.text
        );
      }

      yPosition -= LAYOUT.itemSpacing;
    });
  }

  // ============ CERTIFICATES (IT Industry) ============
  if (profileData.certificates && profileData.certificates.length > 0) {
    drawSectionHeader("Certifications");

    profileData.certificates.forEach((cert) => {
      checkPageBreak(40);

      safeDrawText(cert.certificateName || "Certificate", {
        x: LAYOUT.margin,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: COLORS.text,
      });
      yPosition -= LAYOUT.lineHeight + 2;

      if (cert.issuingAuthority) {
        safeDrawText(`Issued by: ${cert.issuingAuthority}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;
      }

      if (cert.issueDate) {
        const issueDate = cert.issueDate;
        const expiryDate = cert.expiryDate || "No expiry";
        safeDrawText(`Valid: ${issueDate} - ${expiryDate}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;
      }

      if (cert.credentialUrl) {
        safeDrawText(`Credential: ${cert.credentialUrl}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 9,
          font: helvetica,
          color: COLORS.secondary,
        });
        yPosition -= LAYOUT.lineHeight + 2;
      }

      yPosition -= LAYOUT.itemSpacing;
    });
  }

  // ============ AWARDS ============
  if (profileData.awards && profileData.awards.length > 0) {
    drawSectionHeader("Awards & Achievements");

    profileData.awards.forEach((award) => {
      checkPageBreak(40);

      safeDrawText(award.natureOfAward || "Award", {
        x: LAYOUT.margin,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: COLORS.text,
      });
      yPosition -= LAYOUT.lineHeight + 2;

      if (award.offeredBy) {
        safeDrawText(`Offered by: ${award.offeredBy}`, {
          x: LAYOUT.margin,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: COLORS.lightText,
        });
        yPosition -= LAYOUT.lineHeight + 2;
      }

      if (award.description) {
        drawWrappedText(
          award.description,
          LAYOUT.margin + 15,
          width - 2 * LAYOUT.margin - 15,
          timesRoman,
          10,
          COLORS.text
        );
      }

      yPosition -= LAYOUT.itemSpacing;
    });
  }

  // Save and return PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
