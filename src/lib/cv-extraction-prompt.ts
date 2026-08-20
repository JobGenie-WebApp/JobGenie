/**
 * The prompt used to pull structured data out of an uploaded CV.
 *
 * This is the single place extraction behaviour is tuned - edit the text below and nothing
 * else needs to change. Two things must stay in step with it:
 *  - `cvExtractionResultSchema` in @/lib/validations/profile-schema, which is sent to the model
 *    as a response schema and used to validate what comes back;
 *  - the dropdown values listed under FIXED VALUES, which must match the options the wizard
 *    steps actually offer, or the extracted value will not select in the UI.
 */

/** Values the wizard's selects accept. Anything the model returns is re-checked against these in code. */
export const CV_FIXED_VALUES = {
    employmentType: ["full_time", "part_time", "contract", "internship", "freelance"],
    locationType: ["onsite", "remote", "hybrid"],
    academicStatus: ["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"],
    professionalStatus: ["partially_completed", "completed"],
    highestQualification: [
        "bachelors_degree", "masters_degree", "doctorate_phd", "undergraduate", "post_graduate",
        "diploma", "certificate", "professional_certification", "vocational_training", "no_formal_education",
    ],
    noticePeriod: ["immediate", "1_week", "2_weeks", "1_month", "2_months", "3_months"],
} as const;

export type CvPromptOptions = {
    today?: Date;
    /** Job titles from the job_designations table for the candidate's industry, when available. */
    designations?: string[];
    /** Country names the wizard offers. */
    countries?: string[];
};

export function buildCvExtractionPrompt({ today = new Date(), designations = [], countries = [] }: CvPromptOptions = {}): string {
    const todayISO = today.toISOString().slice(0, 10);
    const v = CV_FIXED_VALUES;

    const designationBlock = designations.length
        ? `\nJOB TITLES - "currentPosition" and every entry in "expectedPositions" MUST be copied exactly from this list, choosing the closest match to what the CV actually says. Do not invent a title outside it. If nothing is a reasonable match, return null.\n${designations.map((d) => `- ${d}`).join("\n")}\n`
        : `\nJOB TITLES - no designation list was supplied, so return "currentPosition" and "expectedPositions" as written in the CV.\n`;

    const countryBlock = countries.length
        ? `\nCOUNTRY - "country" MUST be one of exactly these values, chosen from the candidate's address or most recent role location. Return null if none apply:\n${countries.map((c) => `- ${c}`).join("\n")}\n`
        : "";

    return `You are an expert CV/Resume parser. Extract the information below from the provided CV and return it as a single JSON object.

Today's date is ${todayISO}. Use it whenever a role or course says "Present", "Current", "To date" or "Ongoing".

OUTPUT RULES
- Return ONLY valid JSON. No markdown, no code fences, no commentary.
- Dates use "YYYY-MM-DD", or "YYYY-MM" when the day is not given.
- Work experience startDate and endDate use "YYYY-MM" ONLY - never include a day component for those two fields.
- If a date gives only a year, use month 01 (e.g. "2019" becomes "2019-01").
- Set isCurrent to true when the end date reads Present/Current/To date/Ongoing.
- Phone numbers: return them exactly as printed on the CV, including any leading 0 or country code. Do not reformat them.

THE CV MAY BE IN ANY LAYOUT AND ANY WORDING. Handle all of the following:
- Single-column, two-column, sidebar, table-based, infographic, and scanned or photographed layouts. Read the ENTIRE document including sidebars, margins, headers and footers - contact details and skills are often in a side panel.
- Any section heading. Map whatever wording the CV uses onto the target fields:
  * work experience: Employment History, Career History, Professional Experience, Work History, Career Summary, Positions Held, Track Record, Experience
  * education: Academic Background, Academic Qualifications, Educational Background, Studies, Academic Profile, Qualifications
  * certificates: Certifications, Licenses, Training, Courses, Professional Development, Workshops, Accreditations
  * awards: Achievements, Honours, Accomplishments, Recognition, Scholarships, Prizes, Distinctions
  * projects: Key Projects, Portfolio, Assignments, Case Studies, Research, Publications
- CVs with no headings at all: infer each section from the content itself.
- Functional or skills-first CVs where roles and dates are listed apart from each other: match each role to its dates wherever they appear in the document.
- Tables and two-column entries where the date sits in one column and the role in another.
- Non-English and mixed-language CVs, including Sinhala and Tamil. Extract into the English field names below and keep proper nouns (names, companies, institutions) exactly as written in the CV.
- Dates in any format: "Jan 2020", "01/2020", "2020.01", "March 2020 to date", "2020-2023", or month names in any language. Normalise them to the formats above.

COMPLETENESS - these rules override any instinct to summarise:
- Extract EVERY entry. Never merge similar roles, never omit short tenures, internships, contract or part-time work. If the CV lists 12 positions, return 12.
- Copy each work experience "description" IN FULL. Reproduce every bullet point and every sentence describing that role's responsibilities and achievements. Do NOT summarise, shorten, paraphrase, or keep only the bullets you judge important. A one-line description for a role that shows six bullets in the CV is WRONG.
- Do the same for project and certificate descriptions.
- NEVER write a description yourself. A description is text COPIED from the CV. If a role genuinely has no descriptive text under it, return null - restating the job title and company as a sentence ("Financial Controller at Rockland Distilleries Pvt Limited.") is NOT a description and is WRONG.
- Only use null for a field when the CV genuinely contains nothing for it AND the DERIVED FIELDS rules below do not tell you to work it out.
- Keep the description's LINE STRUCTURE exactly as the CV lays it out: one bullet or numbered point per line, separated by newline characters. Never flatten a bulleted or numbered list into a single running paragraph, and never join separate points with spaces, commas or colons.
- Keep the CV's own bullet markers and numbering at the start of each line, and leave an in-block heading such as "Areas of experience" on its own line.
- An opening line such as "I was attached to the above division since March 2019" or "I have been serving as X since July 2023" is the FIRST SENTENCE of the description, never the whole of it. The duties, "Areas of experience", numbered points and bullets that follow it are part of the same description and must be included.

MULTIPLE POSITIONS AT ONE EMPLOYER - a very common layout, and currently the biggest source of lost text:
- A CV often gives ONE block per employer: the employer name, one overall date range, a list of the positions held there with their own dates, and ONE shared list of duties covering the whole block.
- Return one work experience entry per POSITION, each with its own dates - do not collapse them into a single entry.
- Give EVERY position in that block the block's full duties text as its description. The same text repeated across those entries is correct and expected.
- It is WRONG to give one position in a block the full duties list and leave the others with just their opening sentence. If three positions share one block, all three descriptions are the same length. Check this before returning.

PAGE BREAKS - an entry's content very often continues onto the next page, and this is where extraction most commonly loses text. Read the document as one continuous flow, not as separate pages:
- When a page STARTS with bullet points, a sentence fragment, or continuing prose that has no heading of its own above it, that text belongs to the LAST entry from the previous page. Append it to that entry's description. Never drop it, and never create a new entry for it.
- When a role/section heading sits at the very BOTTOM of a page and its content begins on the next page, they are ONE entry.
- A sentence cut in half by a page break is one sentence. Join the halves.
- Page furniture is not content: page numbers, "Page 2 of 3", the candidate's name or contact line repeated at the top of each page, running headers and footers, horizontal rules. Ignore them, and do not let them split a description into two entries.
- When a CV repeats a heading on the continuation page ("Financial Controller (continued)", "Work Experience cont'd"), that is the SAME entry, not a second one. Merge the content into one entry.
- Before returning, re-read each work experience against the CV and check its description contains every bullet shown for that role on BOTH sides of any page break.

DERIVED FIELDS - these are almost never printed on a CV. You must work them out yourself:
- "currentPosition": the job title of the most recent role - the one marked Present/Current, otherwise the one with the latest end date. Never return null if the CV contains any work experience.
- "yearsOfExperience": total professional experience in years, summed from the work history using today's date for roles still running. Round to the nearest whole number. Never return null if the CV contains any work experience.
- "expectedPositions": 1 to 3 job titles this candidate would realistically apply for next, based on their current role and seniority. Never return an empty list if the CV contains any work experience.
- "highestQualification": the single highest qualification the candidate holds, from the FIXED VALUES list below.

SECTION ROUTING - every item belongs in exactly one place:
- A position held at an organisation with a role title -> workExperiences. This includes internships, apprenticeships, freelance, contract, and volunteering that carries a job title.
- A degree, diploma, HND, school qualification (A/L, O/L), or professional-body qualification (ACCA, CIMA, CA, CFA, CIM, CMA) -> educations. Include part-qualified and in-progress studies.
- A named credential earned from a course, exam or vendor programme (AWS, Microsoft, Google, Cisco, PMP, Scrum, IELTS) -> certificates.
- A prize, honour, scholarship, ranking, dean's list or other recognition -> awards.
- A named piece of delivered work, portfolio item, research output or publication -> projects.
- If an item could fit two buckets, choose the more specific one and do NOT list it twice.

EDUCATION SPECIFICS
- Set "educationType" to "professional" for professional-body qualifications, otherwise "academic".
- Always populate the field matching the type: "degreeDiploma" for academic, "professionalQualification" for professional. NEVER return an education entry with both of those fields null.
- "institution" is required for the entry to be saved. If the awarding body is not printed beside the qualification, take it from the section heading, or from the qualification itself where it names its own body (e.g. ACCA -> "ACCA"). Use null only if it is genuinely absent.
- "status" must come from the FIXED VALUES list matching the entry's type. Map the CV's own wording onto it: "First Class" -> first_class, "Second Upper"/"Second Class Upper Division" -> second_class_upper, "Second Lower" -> second_class_lower, a finished degree with no class stated -> general, still reading/in progress -> incomplete. For professional entries: finished -> completed, part-qualified/reading -> partially_completed.

FIXED VALUES - these fields MUST use one of the listed values exactly, or null:
- workExperiences[].employmentType: ${v.employmentType.join(", ")}
- workExperiences[].locationType: ${v.locationType.join(", ")} (use onsite unless the CV says otherwise)
- educations[].status where educationType is academic: ${v.academicStatus.join(", ")}
- educations[].status where educationType is professional: ${v.professionalStatus.join(", ")}
- highestQualification: ${v.highestQualification.join(", ")}
- noticePeriod: ${v.noticePeriod.join(", ")} (only if the CV states an availability or notice period)
${designationBlock}${countryBlock}
Extract this structure:
{
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string (as printed on the CV)",
    "alternativePhone": "string (a second number if the CV lists one)",
    "address": "string",
    "country": "string",
    "currentPosition": "string",
    "expectedPositions": ["string (1-3 titles)"],
    "yearsOfExperience": number,
    "highestQualification": "string (from FIXED VALUES)",
    "noticePeriod": "string (from FIXED VALUES, or null)",
    "expectedMonthlySalary": number (only if the CV states an expected salary, else null),
    "professionalSummary": "string (the CV's own profile/objective section, or write one from the CV content, 50-200 words)",
    "workExperiences": [
        {
            "jobTitle": "string",
            "company": "string",
            "location": "string (city/country of the role, if shown)",
            "employmentType": "string (from FIXED VALUES)",
            "locationType": "string (from FIXED VALUES)",
            "startDate": "YYYY-MM",
            "endDate": "YYYY-MM or null if current",
            "description": "string (every bullet and sentence for this role, in full, including any that continue on the next page; null if the CV shows none)",
            "isCurrent": boolean
        }
    ],
    "educations": [
        {
            "educationType": "academic or professional",
            "degreeDiploma": "string (academic qualifications like BSc, MSc, HND, A/L; null if professional)",
            "professionalQualification": "string (professional bodies like ACCA, CIMA, CFA; null if academic)",
            "institution": "string",
            "status": "string (from FIXED VALUES for this entry's type)"
        }
    ],
    "skills": ["string array of skills"],
    "certificates": [
        {
            "certificateName": "string",
            "issuingAuthority": "string",
            "issueDate": "YYYY-MM-DD",
            "expiryDate": "YYYY-MM-DD or null",
            "credentialId": "string or null",
            "credentialUrl": "string or null",
            "description": "string or null"
        }
    ],
    "projects": [
        {
            "projectName": "string",
            "description": "string (in full)",
            "demoUrl": "string or null",
            "isCurrent": boolean
        }
    ],
    "awards": [
        {
            "awardName": "string (award or achievement name)",
            "offeredBy": "string (organization or institution that gave the award)",
            "description": "string (brief description of the achievement)"
        }
    ]
}

CV Content:
`;
}
